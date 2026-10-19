"""2) Deribit kolu: BTC+ETH haftalık 40Δ kısa strangle + 25-45 günlük (30 güne en yakın) 10Δ uzun koruma putu,
yalnızca DVOL > son 365 günlük medyan, 2x nominal, standart teminat (options2 REPORT #1 / TOP3 #2).

Kural (research/options2/strat.py + eng.py ile aynı):
  * Giriş Cuma 09:00 UTC; vade = 7 gün sonra Cuma 08:00 UTC.
  * Filtre her coin için ayrı: DVOL'un giriş gününden ÖNCEKİ gün kapanışı > son 365 günlük kapanışların medyanı.
  * Coin miktarı (her bacak) Nb = 2 * 0.5 * özsermaye(USD) / spot ; kısa call (+0.40Δ) ve kısa put (-0.40Δ).
  * Koruma: canlı koruma putu yoksa, aynı gün (filtre açıkken) Nb adet -0.10Δ put, vadesi 25-45 gün arası ve
    30 güne en yakın (haftalık ya da aylık olabilir).  Koruma vadesine kadar tutulur.
  * Deribit asgari miktar: BTC 0.1, ETH 1 -> aşağı yuvarlanır (combo_v5.lot_mult ile aynı).
  * Standart teminat IM(kısa) = max(0.15 - OTM/S, 0.10)*S + mark ; IM > özsermaye ise tüm yeni bacaklar orantılı küçültülür.
Canlı fark: araştırma sürekli (teorik) kullanım fiyatı kullandı; burada deltası hedefe EN YAKIN listelenmiş strike seçilir.
"""
import math, datetime as dt
import numpy as np, pandas as pd
import config as C, fetch as FX

MON = {m: i for i, m in enumerate(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], 1)}


def ncdf(x): return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def bs_delta(F, K, T, v, isc):
    sd = max(v, 1e-4) * math.sqrt(max(T, 1e-9)); d1 = (math.log(F / K) + 0.5 * sd * sd) / sd
    return ncdf(d1) if isc else ncdf(d1) - 1


def parse(name):
    c, e, k, t = name.split("-")
    d = int(e[:-5]); mo = MON[e[-5:-2]]; y = 2000 + int(e[-2:])
    return pd.Timestamp(y, mo, d, 8), float(k), t == "C"


def entry_friday(now_utc):
    d = pd.Timestamp(now_utc.date())
    k = (4 - d.dayofweek) % 7
    return d + pd.Timedelta(days=k)


def dvol_filter(cur, entry):
    dv = FX.deribit_dvol(cur)
    today = pd.Timestamp(dt.datetime.now(dt.timezone.utc).date())
    cut = entry - pd.Timedelta(days=1)
    x = dv.loc[:min(cut, today - pd.Timedelta(days=1))]      # yalnızca tamamlanmış günlük mumlar
    provisional = cut >= today
    look = C.DERIBIT["dvol_look"]
    last, med = float(x.iloc[-1]), float(x.iloc[-look:].median())
    return dict(last=last, last_day=x.index[-1], med=med, on=last > med, provisional=provisional, now=float(dv.iloc[-1]))


def chain(cur):
    rows = FX.deribit("get_book_summary_by_currency", currency=cur, kind="option")
    out = []
    for r in rows:
        ex, K, isc = parse(r["instrument_name"])
        out.append(dict(name=r["instrument_name"], ex=ex, K=K, isc=isc, iv=(r.get("mark_iv") or np.nan) / 100,
                        F=r.get("underlying_price"), mark=r.get("mark_price"), bid=r.get("bid_price"), ask=r.get("ask_price"),
                        oi=r.get("open_interest")))
    return pd.DataFrame(out)


def pick(ch, ex, target, isc, t0):
    g = ch[(ch.ex == ex) & (ch.isc == isc) & ch.iv.notna() & (ch.iv > 0)].copy()
    if g.empty: return None
    T = (ex - max(t0, pd.Timestamp.now(tz="UTC").tz_localize(None))).total_seconds() / (365 * 86400)
    g["delta"] = [bs_delta(f, k, T, v, isc) for f, k, v in zip(g.F, g.K, g.iv)]
    r = g.loc[(g.delta - target).abs().idxmin()].to_dict(); r["T"] = T
    try:
        tk = FX.deribit("ticker", instrument_name=r["name"])
        r["drb_delta"] = tk.get("greeks", {}).get("delta"); r["bid"] = tk.get("best_bid_price"); r["ask"] = tk.get("best_ask_price")
    except Exception:
        r["drb_delta"] = None
    return r


def plan(now_utc):
    """sermayeden bağımsız kısım: filtre ve seçilen kontratlar (coin başına)."""
    P = C.DERIBIT
    F = entry_friday(now_utc); t0 = F + pd.Timedelta(hours=9); exw = F + pd.Timedelta(days=P["tenor_days"], hours=8)
    res = {"entry": t0, "weekly_expiry": exw, "cur": {}}
    for cur in ("BTC", "ETH"):
        f = dvol_filter(cur, F)
        spot = FX.deribit("get_index_price", index_name=f"{cur.lower()}_usd")["index_price"]
        ch = chain(cur)
        d = dict(filter=f, spot=spot)
        if f["on"] or True:     # strike'ları her durumda göster (filtre kapalıysa bilgi amaçlı)
            d["call"] = pick(ch, exw, P["delta"], True, t0)
            d["put"] = pick(ch, exw, -P["delta"], False, t0)
            exs = sorted(e for e in ch.ex.unique() if P["hedge_min_days"] <= (e - t0).days <= P["hedge_max_days"])
            if exs:
                eh = min(exs, key=lambda e: abs((e - t0).days - P["hedge_target_days"]))
                d["hedge"] = pick(ch, eh, -P["hedge_delta"], False, t0)
        res["cur"][cur] = d
    return res


def size(pl, usd, hedge_held=False):
    P = C.DERIBIT; out = {}; im = 0.0
    for cur, d in pl["cur"].items():
        S = d["spot"]; Nb = P["size"] * 0.5 * usd / S
        lot = P["min_lot"][cur]; q = math.floor(Nb / lot + 1e-9) * lot
        act = d["filter"]["on"] and d.get("call") is not None and d.get("put") is not None
        o = dict(Nb=Nb, q=q if act else 0.0, q_pot=q, hedge_q=(q if act and not hedge_held and d.get("hedge") else 0.0))
        for leg in ("call", "put"):
            L = d.get(leg)
            if L is not None and d.get("call") is not None and d.get("put") is not None:
                otm = max((S - L["K"]) if not L["isc"] else (L["K"] - S), 0) / S
                im += q * (max(0.15 - otm, 0.10) * S + L["mark"] * S)
        prem = sum(q * (d[l]["bid"] or d[l]["mark"]) * S for l in ("call", "put") if d.get(l))
        cost = q * (d["hedge"]["ask"] or d["hedge"]["mark"]) * S if d.get("hedge") and not hedge_held else 0.0
        o.update(prem_usd=prem, hedge_usd=cost); out[cur] = o
    cut = min(1.0, usd / im) if im > 0 else 1.0
    return out, im, cut


def report(pl, usd, hedge_held=False, title="", brief=False):
    sz, im, cut = size(pl, usd, hedge_held)
    if brief:   # yalnızca boyutlar (kontratlar yukarıdaki tam blokta)
        parts = []
        for cur, d in pl["cur"].items():
            o = sz[cur]
            parts.append(f"{cur} {o['q']:g} (teorik {o['Nb']:.3f}, asgari lot {C.DERIBIT['min_lot'][cur]:g}"
                         + (", YETERSİZ" if o["q_pot"] == 0 else "") + ")")
        return (f"  {title}özsermaye {usd:,.0f} USD -> strangle bacak başı & koruma putu: " + " | ".join(parts)
                + f" ; IM ≈ {im:,.0f} USD"), sz
    L = [f"--- 2) DERIBIT {title}(özsermaye {usd:,.0f} USD, 2x) ---",
         f"  Giriş {pl['entry']:%Y-%m-%d %H:%M} UTC (Cuma) | haftalık vade {pl['weekly_expiry']:%Y-%m-%d %H:%M} UTC"
         + ("  [!! giriş saati geçti; araştırma kuralı 09:00 UTC]" if pd.Timestamp.now(tz="UTC").tz_localize(None) > pl["entry"] else "")]
    for cur, d in pl["cur"].items():
        f = d["filter"]; o = sz[cur]
        L.append(f"  {cur}: spot {d['spot']:,.2f} | DVOL {f['last']:.2f} ({f['last_day']:%Y-%m-%d} kapanış; anlık {f['now']:.2f}) "
                 f"vs 365g medyan {f['med']:.2f} -> {'SAT' if f['on'] else 'SATMA (nakitte bekle)'}"
                 + ("  [ön sinyal: kesin karar Perşembe UTC kapanışıyla]" if f["provisional"] else ""))
        for leg, lab in (("call", "KISA call"), ("put", "KISA put"), ("hedge", "UZUN koruma put")):
            x = d.get(leg)
            if x is None: L.append(f"     {lab}: kontrat bulunamadı"); continue
            q = o["hedge_q"] if leg == "hedge" else o["q"]
            qs = f"{q:g} {cur}" if f["on"] else f"0 (filtre açık olsaydı {o['q_pot']:g} {cur})"
            L.append(f"     {lab:16s} {x['name']:24s} Δ(BS) {x['delta']:+.3f} Δ(Deribit) "
                     f"{(x['drb_delta'] if x['drb_delta'] is not None else float('nan')):+.3f} IV %{100 * x['iv']:.1f} "
                     f"bid/ask {x['bid']}/{x['ask']} {cur} -> miktar {qs}")
        L.append(f"     teorik Nb {o['Nb']:.3f} {cur} -> asgari lota yuvarlanmış {o['q_pot']:g}; pozisyon açılırsa prim ≈ {o['prem_usd']:,.0f} USD (bid)"
                 + (f", koruma maliyeti ≈ {o['hedge_usd']:,.0f} USD (ask)" if not hedge_held else
                    (" (koruma zaten canlı: alma)" if hedge_held else "")))
        if o["q_pot"] == 0:
            L.append(f"     !! sermaye asgari lot için yetersiz (BTC 0.1 / ETH 1) -> bu coin işlem dışı")
    L.append(f"  Pozisyon açılırsa standart teminat IM ≈ {im:,.0f} USD ({100 * im / usd:.0f}% özsermaye)"
             + (f" -> IM > özsermaye: tüm yeni bacakları x{cut:.2f} küçült" if cut < 1 else ""))
    return "\n".join(L), sz
