"""Pay alım teklifi arbitrajı.
Kural (a priori): fiyat+tarihler KAP'ta ilk kez yayımlandıktan sonra, teklif bitişinden 2 iş günü öncesine kadar her gün:
  limit L = P*(1-FEE)/(1+FEE)/(1+h)  (h = gerekli brüt marj). Gün içinde AOF <= L ise AOF*(1+SLIP)'ten, değilse en düşük <= L ise L'den al.
  Pay T+2'de teslim -> teklife ver -> ödeme: 'teslimi takip eden 1. iş günü' ise T+3, değilse bitiş+2 iş günü.
  Teklife verene kadar kapanışla değerle; teslimden sonra P*(1-FEE) alacak.
  Gönüllü+fon tavanlı teklif: %50 kabul varsay, kalan bitiş+1 günü AOF'tan satılır.
Spread istatistiği: her deal için ilk işlem günü AOF'a göre brüt/net spread, süre, yıllık."""
import sys, numpy as np, pandas as pd
from common_ss import *
D = pd.read_csv(H/"tof_deals.csv", parse_dates=["start", "end", "first_ts", "record"])
# HURGZ: kayıt tarihi alanı yok ama sonuç bildirimi (291 yatırımcı, 12M pay, piyasa teklifin %28i) yararlanma kısıtı olduğunu gösteriyor
RESTRICTED_IMPLICIT = {"HURGZ"}
idx = days()
def deal_rows():
    rows = []
    for _, g in D.iterrows():
        s = series(g.target + ".E")
        if len(s) == 0: rows.append({"target": g.target, "start": g.start, "nodata": True}); continue
        j0 = entry_idx(g.first_ts, idx)
        if j0 >= len(idx): continue
        last_buy = idx[max(idx.searchsorted(g.end) - 2, 0)]
        win = s.loc[idx[j0]:last_buy]
        pay_end = idx[min(idx.searchsorted(g.end, side="right") + 1, len(idx) - 1)]
        if len(win) == 0: rows.append({"target": g.target, "start": g.start, "nowin": True}); continue
        d0 = win.index[0]; v0 = win.v.iloc[0] if win.v.iloc[0] > 0 else win.c.iloc[0]
        gross = g.price / v0 - 1; net = g.price * (1 - FEE) / (v0 * (1 + FEE + SLIP)) - 1
        dur = (pay_end - d0).days
        below = win[(win.v > 0) & (win.v * (1 + FEE + SLIP) < g.price * (1 - FEE))]
        rows.append({"target": g.target, "kind": g.kind, "first_ts": g.first_ts, "d0": d0, "end": g.end, "offer": g.price,
                     "vwap_d0": v0, "gross_d0%": 100*gross, "net_d0%": 100*net, "days_to_pay": dur,
                     "ann_net%": 100*((1+net)**(365/max(dur,1))-1) if net > -1 else np.nan,
                     "days_net_pos": len(below), "win_days": len(win), "tl_vol_below": below.val.sum(),
                     "close_after_end_vs_offer%": 100*(s.c.asof(g.end + pd.Timedelta(days=10))/g.price - 1)})
    return pd.DataFrame(rows)
def trades(h=0.005, mode="post"):
    """mode='post': duyurudan sonra al (yalnız yararlanma kısıtı olmayan teklifler).
    mode='record': kayıt (hak sahipliği) tarihinden 2-6 iş günü önce al (T+2 takas) ve teklife kadar tut — GERİYE BAKIŞLI üst sınır."""
    T = []
    for _, g in D.iterrows():
        s = series(g.target + ".E")
        if len(s) == 0: continue
        if mode == "post":
            if g.target in RESTRICTED_IMPLICIT: continue
            j0 = entry_idx(g.first_ts, idx)
            if j0 >= len(idx): continue
            if pd.notna(g.record) and g.record < idx[j0]: continue
            last_buy = idx[max(idx.searchsorted(g.end) - 2, 0)]
        else:
            if pd.isna(g.record): continue
            jr = idx.searchsorted(g.record, side="right") - 1   # kayıt günü (veya öncesi son seans)
            j0 = max(jr - 6, 0); last_buy = idx[max(jr - 2, 0)]
        je = idx.searchsorted(g.end)
        pay_end = idx[min(je + 2, len(idx) - 1)]
        L = g.price * (1 - FEE) / (1 + FEE) / (1 + h)
        part = 0.5 if (g.kind == "Gönüllü" and g.fund_cap) else 1.0
        for d in s.loc[idx[j0]:last_buy].index:
            x = s.loc[d]
            if not (x.v > 0 and x.lo > 0): continue
            prevc = s.c[s.index < d]
            if mode == "record" and (len(prevc) == 0 or prevc.iloc[-1] > L): continue   # karar t-1 kapanışında
            if x.v * (1 + SLIP) <= L: fill = x.v * (1 + SLIP); liq = x.val
            elif x.lo <= L: fill = L; liq = 0.5 * x.val
            else: continue
            cost = fill * (1 + FEE)
            k = idx.searchsorted(d)
            tdel = idx[min(k + 2, len(idx) - 1)]
            pay = pay_end   # muhafazakâr: ödeme teklif bitişi + 2 iş günü
            if mode == "record": tdel = idx[min(idx.searchsorted(g.start), len(idx) - 1)]  # teklif başlayana kadar piyasa riski
            pth = s.c.loc[d:tdel] / cost
            pth = pth[pth.index < tdel]
            rec = g.price * (1 - FEE) / cost
            fut = pd.Series(rec, index=[x for x in idx[(idx >= tdel) & (idx <= pay)]])
            if part < 1:
                sell_d = idx[min(je + 1, len(idx) - 1)]
                vs = s.v.asof(sell_d) * (1 - FEE - SLIP) / cost
                fut = pd.Series(part * rec + (1 - part) * vs, index=fut.index)
            path = pd.concat([pth, fut]); path = path[~path.index.duplicated(keep="last")]
            T.append({"d0": d, "path": path, "liq_tl": liq, "key": g.target + str(g.start.date()), "deal": g.target})
    return T
if __name__ == "__main__":
    R = deal_rows(); pd.set_option("display.width", 250); pd.set_option("display.max_rows", 200)
    R.to_csv(H/"results"/"tof_deal_stats.csv", index=False)
    print(R.round(2).to_string())
    out = []
    for mode in ["post", "record"]:
      for h in [0.0, 0.005, 0.01, 0.02]:
        T = trades(h, mode)
        for cap in [100_000, 1_000_000]:
            for liq in [0.01, 0.05]:
                eq, log = simulate(T, cap, max_frac=0.5, liq=liq)
                rr = report(eq, log, f"{mode} h={h} cap={cap} liq={liq}"); rr["deals"] = len({t["deal"] for t in T})
                rr["deals_traded"] = ",".join(sorted({o["deal"] + ("*" if o["d0"] >= OOS_START else "") for o in log}))
                out.append(rr); print(rr, flush=True)
                if h == 0.01 and liq == 0.01: eq.to_csv(H/"results"/f"tof_eq_{mode}_{cap}.csv")
    pd.DataFrame(out).to_csv(H/"results"/"tof_grid.csv", index=False)
