"""Sabit (IS'de seçilmiş) takvim overlay stratejileri, IS/OOS istatistikleri, deflated Sharpe, walk-forward TOM, sepet versiyonu."""
import numpy as np, pandas as pd
from scipy import stats as st
import common as c
from scan import signals, overlay, overnight_overlay
from engine import stats

m = c.market(); F = c.features(m.index); idx = m.index; S = signals(F)
ex = m.x30 - m.cash
IS = (idx >= c.IS_START) & (idx < c.OOS_START); OOS = (idx >= c.OOS_START) & (idx <= c.OOS_END)

def equity(ov, lev=1.0):
    """PPF + lev * overlay (vadeli teminat PPF'te kalır)."""
    return (1 + m.cash + lev * ov).cumprod()

def summarize(name, ov, lev=1.0, ntr=None):
    eq = equity(ov, lev); mmf = (1 + m.cash).cumprod()
    a = stats(eq, c.IS_START, c.OOS_START - pd.Timedelta(days=1)); b = stats(eq, c.OOS_START, c.OOS_END)
    am = stats(mmf, c.IS_START, c.OOS_START - pd.Timedelta(days=1)); bm = stats(mmf, c.OOS_START, c.OOS_END)
    o_is, o_oos = ov[IS], ov[OOS]
    return dict(strategy=name, lev=lev, IS_geo=a["aylik_geo_%"], IS_excess_mo=round(a["aylik_geo_%"] - am["aylik_geo_%"], 2),
                IS_maxDD=a["maxDD_%"], IS_SR_ov=round(o_is.mean() / o_is.std() * np.sqrt(252), 2),
                OOS_geo=b["aylik_geo_%"], OOS_excess_mo=round(b["aylik_geo_%"] - bm["aylik_geo_%"], 2), OOS_maxDD=b["maxDD_%"],
                OOS_worst=b["en_kotu_ay_%"], OOS_SR_ov=round(o_oos.mean() / o_oos.std() * np.sqrt(252), 2) if o_oos.std() > 0 else 0,
                trades_IS=ntr[0] if ntr else None, trades_OOS=ntr[1] if ntr else None)

def ntrades(sig):
    s = sig.astype(int); e = (s.diff() == 1)
    return int(e[IS].sum()), int(e[OOS].sum())

def deflated_sr(sr_best, sr_trials, T, skew=0.0, kurt=3.0):
    """Bailey & López de Prado (2014). SR'ler dönem başına (günlük)."""
    N = len(sr_trials); v = np.var(sr_trials, ddof=1); g = 0.5772
    sr0 = np.sqrt(v) * ((1 - g) * st.norm.ppf(1 - 1 / N) + g * st.norm.ppf(1 - 1 / (N * np.e)))
    z = (sr_best - sr0) * np.sqrt(T - 1) / np.sqrt(1 - skew * sr_best + (kurt - 1) / 4 * sr_best ** 2)
    return st.norm.cdf(z), sr0

if __name__ == "__main__":
    pd.set_option("display.width", 250); pd.set_option("display.max_columns", 30)
    rows = []
    # 0) referanslar
    rows.append(summarize("MMF only", ex * 0))
    allin = pd.Series(True, index=idx)
    rows.append(summarize("Buy&hold XU030 futures", overlay(allin, ex), ntr=ntrades(allin)))
    # 1) TOM (IS en iyi bölge merkezi: son 2 + ilk 4 işlem günü). Komşular raporlanır.
    for k, j in [(2, 4), (2, 5), (1, 4), (3, 4), (2, 3), (0, 4)]:
        s = S[f"tom_L{k}_F{j}"]; rows.append(summarize(f"TOM L{k} F{j}", overlay(s, ex), ntr=ntrades(s)))
    # 2) bileşik: TOM L2F4, çarşamba ve PPK-ertesi hariç (IS'de en negatif iki takvim etkisi)
    comp = S["tom_L2_F4"] & ~S["dow_Wed"] & ~S["mpc_post1"]
    rows.append(summarize("TOM L2F4 ex Wed ex MPC+1", overlay(comp, ex), ntr=ntrades(comp)))
    # 2b) long/short: TOM'da uzun, diğer günlerde nötr; PPK ertesi kısa
    ls = overlay(S["tom_L2_F4"], ex) - overlay(S["mpc_post1"], ex) * 1.0
    rows.append(summarize("TOM L2F4 long + short MPC+1", ls))
    # 3) gece tutma (vadeli, her gün 2 taraf maliyet)
    rows.append(summarize("Overnight long all days (fut)", overnight_overlay(allin, m.x30_on - m.cash), ntr=(int(IS.sum()), int(OOS.sum()))))
    rows.append(summarize("Overnight Tue+Thu (fut)", overnight_overlay(S["dow_Tue"] | S["dow_Thu"], m.x30_on - m.cash)))
    # 4) walk-forward TOM: her yıl başı son 5 yılın en iyi (k,j) (overlay Sharpe) -> o yıl
    wf = pd.Series(0.0, index=idx); choice = {}
    for y in range(2015, 2027):
        y0 = pd.Timestamp(f"{y}-01-01") if y < 2026 else pd.Timestamp(f"{y}-01-01")
        tr = (idx >= pd.Timestamp(f"{y-5}-01-01")) & (idx < y0) & (idx < c.OOS_START)
        best, bsr = None, -9
        for k in range(6):
            for j in range(6):
                if k == j == 0: continue
                o = overlay(S[f"tom_L{k}_F{j}"], ex)[tr]; sr = o.mean() / o.std()
                if sr > bsr: best, bsr = (k, j), sr
        choice[y] = best
        te = (idx >= y0) & (idx < pd.Timestamp(f"{y+1}-01-01"))
        wf[te] = overlay(S[f"tom_L{best[0]}_F{best[1]}"], ex)[te]
    print("WF TOM choices:", choice)
    r = summarize("WF TOM (5y trailing, yearly)", wf); rows.append(r)
    # kaldıraçlı TOM
    for L in [2, 3]:
        rows.append(summarize("TOM L2 F4", overlay(S["tom_L2_F4"], ex), lev=L))
    R = pd.DataFrame(rows); print(R.to_string(index=False)); R.to_csv(c.H / "results_strat.csv", index=False)

    # deflated Sharpe: 88 takvim sinyali + 7 gece/gün içi = 95 overlay (günlük SR)
    srs = []
    for k, s in S.items():
        o = overlay(s, ex)[IS]; srs.append(o.mean() / o.std())
    for d in range(5):
        o = overnight_overlay(S[f"dow_{['Mon','Tue','Wed','Thu','Fri'][d]}"], m.x30_on - m.cash)[IS]; srs.append(o.mean() / o.std())
    o = overnight_overlay(allin, m.x30_on - m.cash)[IS]; srs.append(o.mean() / o.std())
    o = (m.x30_id - 2 * c.FUT_COST)[IS]; srs.append(o.mean() / o.std())
    srs = np.array(srs); i = np.nanargmax(srs)
    ob = overlay(S["tom_L2_F5"], ex)[IS]
    best_sr = srs[i]; T = IS.sum()
    p, sr0 = deflated_sr(best_sr, srs, T, st.skew(ob), st.kurtosis(ob, fisher=False))
    print(f"\nTrials={len(srs)}  best daily SR={best_sr:.4f} (ann {best_sr*np.sqrt(252):.2f})  SR0 (expected max under null)={sr0:.4f} (ann {sr0*np.sqrt(252):.2f})  DSR prob={p:.3f}")
    ob = overlay(S["tom_L2_F4"], ex)[IS]; sr = ob.mean() / ob.std()
    p2, _ = deflated_sr(sr, srs, T, st.skew(ob), st.kurtosis(ob, fisher=False)); print(f"TOM L2F4 DSR prob={p2:.3f}")
    # yıllık TOM L2F4 overlay getirisi (stabilite)
    o = overlay(S["tom_L2_F4"], ex); print("\nTOM L2F4 overlay by year (%):"); print((o.groupby(idx.year).sum() * 100).round(1).to_dict())
    o = overnight_overlay(allin, m.x30_on - m.cash); print("Overnight fut overlay by year (%):"); print((o.groupby(idx.year).sum() * 100).round(1).to_dict())
    print("Overnight gross x30_on mean bp by year:", (m.x30_on.groupby(idx.year).mean() * 1e4).round(1).to_dict())
    print("Intraday gross x30_id mean bp by year:", (m.x30_id.groupby(idx.year).mean() * 1e4).round(1).to_dict())
