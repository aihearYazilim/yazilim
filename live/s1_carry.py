"""1) TL taşıma kolu: 32 gün mevduat + VİOP USDTRY KISA vadeli (try_carry R3 audited, combo_v5 kuralları).

Kural (araştırmayla birebir):
  vol20  = std(log getiri USDTRY 'mark', 20 iş günü) * sqrt(260)      [Yahoo TRY=X, mark = sonraki barın açılışı]
  L      = min(Lmax, 0.30 / vol20)  eğer (politika faizi - TÜFE yıllık) > %5, aksi halde 0
  lag 1  : t-1 günündeki L, t günü uzlaşma fiyatından uygulanır
  N(USD) = floor( min(L*B/F, B/(IM*1.25*F)) / 1000 ) * 1000 ;  B = TL kolu (mevduat + VİOP nakdi), F = vadeli uzlaşma
  yeniden boyutlama yalnızca |L_hedef - L_mevcut| > max(0.1, 0.2*L_hedef) ya da L_hedef = 0 iken pozisyon varsa
  VİOP nakdi: < 1.00*IM ise mevduattan 1.25*IM'e tamamla ; > 1.75*IM ise 1.25*IM'e indir (fazlası mevduata)
  ön vade: vadesine > 4 takvim günü kalan en yakın F_USDTRYmmyy (≤4 gün kalınca uzlaşmada bir sonrakine geç)
"""
import datetime as dt
import numpy as np, pandas as pd
import config as C, fetch as FX


def usdtry_marks():
    """research/try_carry/data_prep.build ile aynı mark serisi (iş günü, hafta sonu barları pazartesiye katlanır)."""
    j = FX.yahoo_chart("TRY=X", "1y", max_age_h=1)["chart"]["result"][0]
    q = j["indicators"]["quote"][0]
    ts = pd.to_datetime(j["timestamp"], unit="s") + pd.Timedelta(hours=2)
    df = pd.DataFrame({k: q[k] for k in ["open", "high", "low", "close"]}, index=ts.normalize())
    df = df[~df.index.duplicated(keep="last")].dropna()
    last_px = float(j["meta"].get("regularMarketPrice") or df["close"].iloc[-1])
    df["mark"] = df["open"].shift(-1)
    df.loc[df.index[-1], "mark"] = last_px              # son bar: canlı fiyat
    df["mark"] = df["mark"].fillna(df["close"])
    bd = df.index.where(df.index.dayofweek < 5, df.index + pd.offsets.BDay(1))
    m = df["mark"].groupby(bd).last()
    m = m.reindex(pd.bdate_range(m.index[0], m.index[-1])).ffill()
    return m, last_px


def policy_at(d):
    v = None
    for k, x in sorted(C.POLICY_DECISIONS):
        if pd.Timestamp(d) > pd.Timestamp(k): v = x          # karar gününden sonraki gün geçerli
    return v


def cpi_at(d):
    v, mo = None, None
    for k, x in sorted(C.CPI_YOY.items()):
        avail = pd.Timestamp(k + "-01") + pd.DateOffset(months=1) + pd.Timedelta(days=4)
        if pd.Timestamp(d) >= avail: v, mo = x, k
    return v, mo


def exec_day(now_ist):
    """işlem günü: bugün iş günüyse ve 17:30'dan önceyse bugün (uzlaşma fiyatından), değilse sonraki iş günü."""
    d = pd.Timestamp(now_ist.date())
    if d.dayofweek < 5 and now_ist.hour * 60 + now_ist.minute < 17 * 60 + 30: return d
    return d + pd.offsets.BDay(1)


def signal(now_ist, Lmax):
    m, spot = usdtry_marks()
    lr = np.log(m).diff().fillna(0)
    vol = lr.rolling(C.CARRY["vol_window"]).std() * np.sqrt(260)
    ex = exec_day(now_ist); sig_day = ex - pd.offsets.BDay(C.CARRY["lag"])
    sd = min(sig_day, vol.index[-1])
    v = float(vol.loc[:sd].iloc[-1])
    pol = policy_at(sd); cpi, cpi_m = cpi_at(sd)
    real = pol - cpi
    L = min(Lmax, C.CARRY["target_vol"] / v) if real > C.CARRY["real_th"] else 0.0
    return dict(exec_day=ex, sig_day=sd, vol=v, pol=pol, cpi=cpi, cpi_month=cpi_m, real=real, L=L, Lmax=Lmax,
                spot=spot, mark=float(m.loc[:sd].iloc[-1]))


def front_contract(ex):
    F = FX.viop_usdtry(dt.date.today())
    if F is None: return None
    F = F[F.settle > 0]
    c = F[(F.expiry - ex).dt.days > C.CARRY["roll_cal_days"]].sort_values("expiry")
    nxt = F[F.expiry > c.iloc[0].expiry].sort_values("expiry")
    return dict(code=c.iloc[0].code, expiry=c.iloc[0].expiry, settle=float(c.iloc[0].settle), bulletin=F.date.iloc[0],
                oi=c.iloc[0].get("oi"), next_code=nxt.iloc[0].code if len(nxt) else None,
                roll_day=c.iloc[0].expiry - pd.Timedelta(days=C.CARRY["roll_cal_days"]))


def position(B, sig, fc, held_contracts=0, held_code=None):
    P = C.CARRY; px = fc["settle"]; L = sig["L"]
    cur = held_contracts * P["contract_usd"] * px / B if B > 0 else 0.0
    need_trade = (L == 0 and held_contracts > 0) or (L > 0 and abs(L - cur) > max(P["band_abs"], P["band_rel"] * L))
    newN = min(L * B / px, B / (P["im"] * P["cash_mid"] * px)) if L > 0 else 0.0
    nc = int(np.floor(newN / P["contract_usd"] + 1e-9))
    final = nc if need_trade else held_contracts
    N = final * P["contract_usd"]; notional = N * px; IMv = P["im"] * notional
    vc = P["cash_mid"] * IMv
    out = dict(target_contracts=nc, final_contracts=final, trade=final - held_contracts, need_trade=need_trade,
               cur_lev=cur, eff_lev=notional / B if B else 0.0, notional_tl=notional, notional_usd=N, im=IMv,
               maint=P["maint"] * notional, viop_cash=vc, cash_lo=P["cash_lo"] * IMv, cash_hi=P["cash_hi"] * IMv,
               deposit=B - vc, roll=held_code is not None and held_contracts > 0 and held_code != fc["code"])
    if N > 0:
        # VİOP nakdi tamamlanmadan margin call: vc - N(F'-F) = maint*N*F'
        out["call_px"] = (vc + N * px) / (N * (1 + P["maint"]))
        # tüm TL kolu (mevduat dahil) IM'i karşılayamaz -> zorla kapatma: B - N(F'-F) = IM*N*F'
        out["liq_px"] = (B + N * px) / (N * (1 + P["im"]))
    return out


def report(B, Lmax, now_ist, held_contracts=0, held_code=None, title=""):
    s = signal(now_ist, Lmax); fc = front_contract(s["exec_day"])
    L = []
    L.append(f"--- 1) TL TAŞIMA {title}(Lmax {Lmax}, TL kolu {B:,.0f} TL) ---")
    L.append(f"  Politika faizi %{s['pol']:.2f} (son karar tabloda) - TÜFE y/y %{s['cpi']:.2f} ({s['cpi_month']}) "
             f"= reel %{s['real']:.2f}  -> filtre {'AÇIK' if s['real'] > C.CARRY['real_th'] else 'KAPALI (pozisyon yok)'}")
    L.append(f"  USDTRY spot {s['spot']:.4f} | 20g gerçekleşen vol (sinyal günü {s['sig_day']:%Y-%m-%d}) %{100 * s['vol']:.2f}")
    L.append(f"  Hedef kaldıraç L = min({Lmax}, 0.30/{s['vol']:.4f}) = {s['L']:.2f}x   (uygulama: {s['exec_day']:%Y-%m-%d} uzlaşma fiyatı)")
    if fc is None:
        L.append("  !! VİOP bülteni indirilemedi; sözleşme sayısı hesaplanamadı."); return "\n".join(L), s, None
    p = position(B, s, fc, held_contracts, held_code)
    L.append(f"  Ön vade: {fc['code']} (vade {fc['expiry']:%Y-%m-%d}, bülten {fc['bulletin']:%Y-%m-%d} uzlaşma {fc['settle']:.4f}); "
             f"{fc['roll_day']:%Y-%m-%d} itibarıyla {fc['next_code']}'e geç")
    L.append(f"  HEDEF: {p['target_contracts']} adet KISA {fc['code']} (1.000 USD/adet) = {p['notional_usd']:,.0f} USD "
             f"≈ {p['notional_tl']:,.0f} TL nominal, efektif {p['eff_lev']:.2f}x")
    if held_contracts:
        L.append(f"  Mevcut {held_contracts} adet (L {p['cur_lev']:.2f}x) -> bant "
                 f"{'AŞILDI: ' + format(p['trade'], '+d') + ' adet' if p['need_trade'] else 'içinde: işlem yok'}"
                 + ("; ROLL gerekli" if p["roll"] else ""))
    L.append(f"  Başlangıç teminatı (%11) {p['im']:,.0f} TL | sürdürme (%8.25) {p['maint']:,.0f} TL")
    L.append(f"  VİOP nakdi hedef 1.25xIM = {p['viop_cash']:,.0f} TL; bant [{p['cash_lo']:,.0f} , {p['cash_hi']:,.0f}] TL "
             f"(altına inerse mevduattan 1.25xIM'e tamamla, üstüne çıkarsa fazlayı mevduata)")
    L.append(f"  Serbest TL nakit (TL kolu - VİOP nakdi): {p['deposit']:,.0f} TL -> bono ya da 32 gün mevduat, bkz. 1b) TL NAKİT KOLU")
    if "call_px" in p:
        L.append(f"  Risk: vadeli {p['call_px']:.3f} (+%{100 * (p['call_px'] / fc['settle'] - 1):.1f}) -> teminat tamamlama çağrısı; "
                 f"{p['liq_px']:.3f} (+%{100 * (p['liq_px'] / fc['settle'] - 1):.1f}) -> tüm TL kolu yetmez, zorla kapatma")
    return "\n".join(L), s, p
