"""Kontrol değişikliği ön-pozisyon simülasyonu.
Kural (ex ante, parametreler h, K, HMAX):
  t0 = kontrol değişikliği (pay devir/satış sözleşmesi imzası ya da yönetim kontrolü devri kararı) ilk KAP açıklaması.
  E  = max(açıklanan pay başı devir fiyatı (TL; USD/EUR ise o günkü kur), açıklama öncesi 6 ay düzeltilmiş günlük AOF ortalaması)
       (SPK II-26.1 m.17 asgari teklif fiyatı tahmini).
  Açıklama devrin TAMAMLANDIĞINI söylüyorsa ve rejim 'kayıt tarihli' ise (t0 >= 2022-01-01) işlem yok (hak sahipliği kaçırıldı).
  Limit L = E*(1-FEE)/((1+FEE)(1+h)). t0 sonrası ilk K seansta: AOF*(1+SLIP) <= L ise AOF+kayma'dan, değilse en düşük <= L ise L'den
  (hacmin yarısı) al; ilk dolan gün tek giriş. Pozisyon <= günlük TL hacmin %1'i.
  Çıkış: (a) teklif var ve hak sahibi (T+2 takas <= kayıt tarihi ya da kayıt tarihi yok): teklif bitişinden 1 seans önce
         piyasa AOF*(1-FEE-SLIP) > teklif*(1-FEE) ise piyasada sat, yoksa teklife ver (ödeme bitiş+2 seans);
         (b) teklif var, hak sahibi değil: kayıt tarihinden sonraki ilk seans AOF'tan sat (devir tamamlandı duyurusu);
         (c) iptal / SPK muafiyeti / teklif yükümlülüğü yok duyurusu: ertesi seans AOF'tan sat;
         (d) hiçbiri HMAX ay içinde olmazsa HMAX'ta AOF'tan sat; veri sonu (2026-10-16) açık pozisyon kapanışla değerlenir."""
import sys, numpy as np, pandas as pd
from cc_common import *
idx = days()
USD = pd.read_csv("/home/user/yazilim/data/bist/USDTRY.csv", index_col=0, parse_dates=True).close
EUR = pd.read_csv(H/"raw/eurtry.csv", index_col=0, parse_dates=True).iloc[:, 0]
REGIME = pd.Timestamp("2022-01-01")
def fx(cur, t):
    if cur in (None, "", "TL") or (isinstance(cur, float) and np.isnan(cur)): return 1.0
    s = USD if cur == "USD" else EUR
    return float(s[s.index <= t].dropna().iloc[-1])
def nxt(t):  # t tarih/saatinden sonra işlem yapılabilen ilk seans indeksi
    return entry_idx(pd.Timestamp(t), idx)
def load(event="spa"):
    """event='spa': imza/anlaşma açıklaması; 'early': varsa daha önceki görüşme/ön protokol açıklaması."""
    D = pd.read_csv(H/"deals.csv", parse_dates=["nego_ts", "spa_ts", "out_ts", "tender_start", "tender_end", "record"])
    if event == "spa":
        D = D[D.spa_ts.notna()].copy(); D["ann_ts"] = D.spa_ts
    else:
        D = D.copy(); D["ann_ts"] = D.nego_ts.fillna(D.spa_ts)
        D.loc[D.nego_ts.notna(), "closed_at_ann"] = 0
    return D.sort_values("ann_ts").reset_index(drop=True)
def deal_info(g):
    s = stitched(g.sym)
    if len(s) == 0: return None
    j0 = nxt(g.ann_ts)
    if j0 >= len(idx): return None
    a6 = avg6(s, g.ann_ts.normalize() + pd.Timedelta(days=1) if (g.ann_ts.hour*60 + g.ann_ts.minute) >= 18*60 + 10 else g.ann_ts.normalize())
    tp = g.tp * fx(g.tp_cur, g.ann_ts) if pd.notna(g.tp) else np.nan
    E = np.nanmax([tp, a6]) if not (np.isnan(tp) and np.isnan(a6)) else np.nan
    pre = s.c[s.index < g.ann_ts.normalize()]
    return dict(s=s, j0=j0, a6=a6, tp=tp, E=E, pre_close=pre.iloc[-1] if len(pre) else np.nan)
def trade(g, h=0.05, K=5, HMAX=15, use="E"):
    I = deal_info(g)
    if I is None or np.isnan(I["E"]): return None, "nodata"
    if bool(g.closed_at_ann) and g.ann_ts >= REGIME: return None, "closed_at_ann"
    s = I["s"]; E = I["E"] if use == "E" else I["tp"]
    if np.isnan(E): return None, "noprice"
    L = E * (1 - FEE) / ((1 + FEE) * (1 + h))
    fill = None
    for d in idx[I["j0"]:I["j0"] + K]:
        if d not in s.index or not s.traded.get(d, False): continue
        x = s.loc[d]
        if x.v * (1 + SLIP) <= L: fill = (d, x.v * (1 + SLIP), x.val); break
        if x.lo <= L: fill = (d, L, 0.5 * x.val); break
    if fill is None: return None, "no_fill"
    d0, px, liq = fill; cost = px * (1 + FEE); k0 = idx.get_loc(d0); m0 = s.mult.asof(d0)
    end_cap = d0 + pd.DateOffset(months=HMAX)
    def vw(d):  # d günü veya sonrası ilk işlem gördüğü gün AOF
        w = s[(s.index >= d) & s.traded]
        return (w.index[0], w.v.iloc[0], w.mult.iloc[0]) if len(w) else (s.index[-1], s.c.iloc[-1], s.mult.iloc[-1])
    out = None
    has_t = pd.notna(g.tender_end) and g.tender_end > d0
    if has_t and g.tender_start <= end_cap + pd.DateOffset(months=12):
        settle = idx[min(k0 + 2, len(idx) - 1)]
        elig = pd.isna(g.record) or settle <= g.record
        if elig:
            je = idx.searchsorted(g.tender_end)
            dm = idx[max(je - 1, k0 + 1)]
            if dm > OOS_END:
                out = None
            else:
                dd, v, m = vw(dm)
                mk = v * (1 - FEE - SLIP) * m / m0; tn = g.tender_price * (1 - FEE) * s.mult.asof(g.tender_end) / m0
                if mk >= tn: out = (dd, mk / cost, "sold_mkt_at_tender")
                else: out = (idx[min(je + 2, len(idx) - 1)], tn / cost, "tendered")
        else:
            dd, v, m = vw(idx[min(idx.searchsorted(g.record, side="right"), len(idx) - 1)])
            out = (dd, v * (1 - FEE - SLIP) * m / m0 / cost, "inelig_sold")
    if out is None and pd.notna(g.out_ts) and g.out_ts > d0 and g.out_ts <= end_cap:
        dd, v, m = vw(idx[min(nxt(g.out_ts), len(idx) - 1)])
        out = (dd, v * (1 - FEE - SLIP) * m / m0 / cost, str(g.outcome))
    if out is None:
        if end_cap <= OOS_END and not (has_t and g.tender_end <= end_cap):
            dd, v, m = vw(end_cap); out = (dd, v * (1 - FEE - SLIP) * m / m0 / cost, "timeout")
        elif has_t and g.tender_end > OOS_END:
            out = (OOS_END, s.c.asof(OOS_END) * (1 - FEE - SLIP) * s.mult.asof(OOS_END) / m0 / cost, "open_mtm")
        else:
            out = (OOS_END, s.c.asof(OOS_END) * (1 - FEE - SLIP) * s.mult.asof(OOS_END) / m0 / cost, "open_mtm")
    dx, gross, why = out
    pth = (s.c * s.mult / m0 * (1 - FEE - SLIP) / cost).loc[d0:dx]
    pth = pth[pth.index < dx]
    path = pd.concat([pth, pd.Series([gross], index=[dx])]); path = path[~path.index.duplicated(keep="last")]
    if why == "tendered":  # teklife verildikten sonra fiyat riski yok: teklif başlangıcından itibaren sabit alacak
        path.loc[path.index >= g.tender_start] = gross
    return dict(d0=d0, path=path, liq_tl=liq, key=g.sym + str(g.ann_ts.date()), deal=g.sym, why=why,
                ret=gross - 1, days=(dx - d0).days, E=E, a6=I["a6"], tp=I["tp"], px=px, pre_close=I["pre_close"]), why
