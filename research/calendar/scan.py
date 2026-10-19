"""Takvim/akış anomalisi taraması (IS = 2010-01-01..2025-10-16, XU030; XU100 ve OOS yalnızca rapor).
Her sinyal: d-1 kapanışında bilinen takvim kuralı -> d günü XU030 vadeli uzun (getiri = endeks - PPF), aksi halde sadece PPF.
Test istatistiği: (a) sinyal günü - diğer günler fark t'si (Welch), (b) overlay net (maliyet sonrası) günlük getirinin t'si."""
import numpy as np, pandas as pd
from scipy import stats as st
import common as c

m = c.market(); F = c.features(m.index)
idx = m.index

def signals(F):
    S = {}
    for d in range(5): S[f"dow_{['Mon','Tue','Wed','Thu','Fri'][d]}"] = F.dow == d
    for k in range(6):
        for j in range(6):
            if k == 0 and j == 0: continue
            S[f"tom_L{k}_F{j}"] = (F.tdm_rev <= k) | (F.tdm <= j)
    ph = F.pre_hol
    S["prehol_any"] = ph != ""
    S["prehol_relig"] = ph.str.contains("ramazan|kurban")
    S["prehol_ramazan"] = ph.str.contains("ramazan"); S["prehol_kurban"] = ph.str.contains("kurban")
    S["prehol_nat"] = ph.str.contains("nat"); S["prehol_newyear"] = ph.str.contains("newyear")
    S["prehol2_any"] = F.pre_hol2 != ""; S["prehol3_any"] = F.pre_hol3 != ""
    S["prehol_win3"] = (ph != "") | (F.pre_hol2 != "") | (F.pre_hol3 != "")
    S["posthol_any"] = F.post_hol != ""; S["posthol_relig"] = F.post_hol.str.contains("ramazan|kurban")
    for mo in range(1, 13): S[f"month_{mo:02d}"] = F.month == mo
    S["sep_oct"] = F.month.isin([9, 10]); S["halloween_NovApr"] = F.month.isin([11, 12, 1, 2, 3, 4])
    S["div_season_AprJun"] = F.month.isin([4, 5, 6])
    S["q_end"] = F.q_end; S["q_end_L3"] = F.month.isin([3, 6, 9, 12]) & (F.tdm_rev <= 3)
    S["q_first"] = F.q_first; S["y_end"] = F.y_end
    S["msci"] = F.msci; S["msci_pre1"] = np.roll(F.msci.values, -1)
    S["expiry"] = F.expiry; S["expiry_pre1"] = np.roll(F.expiry.values, -1)
    S["mpc"] = F.mpc; S["mpc_pre1"] = F.mpc_pre1; S["mpc_pre2"] = F.mpc_pre2; S["mpc_post1"] = F.mpc_post1
    S["mpc_win_pre2_0"] = F.mpc | F.mpc_pre1 | F.mpc_pre2
    S["cpi"] = F.cpi; S["cpi_pre1"] = F.cpi_pre1
    return {k: pd.Series(np.asarray(v, bool), index=F.index) for k, v in S.items()}

def overlay(sig, ex, cost=c.FUT_COST):
    """sig: bool (d günü pozisyonda). ex: endeks-PPF günlük. Net fazla getiri serisi (PPF üstü)."""
    s = sig.astype(float)
    trades = s.diff().abs().fillna(s.iloc[0])
    return s * ex - trades * cost

def overnight_overlay(sig, ex_on, cost=c.FUT_COST):
    """gece tutma: d-1 kapanışta al, d açılışta sat. Her gün 2 taraf maliyet. Nakit getirisi gece için ~tam gün varsayılır."""
    s = sig.astype(float)
    return s * ex_on - s * 2 * cost

def describe(name, sig, r, cash, ov, mask):
    ex = (r - cash)[mask]; s = sig[mask]; o = ov[mask]
    a, b = ex[s], ex[~s]
    t_diff = st.ttest_ind(a, b, equal_var=False).statistic if len(a) > 5 else np.nan
    t_ov = o.mean() / o.std() * np.sqrt(len(o)) if o.std() > 0 else np.nan
    yrs = len(o) / 252
    return dict(sig=name, n=int(s.sum()), mean_in_bp=a.mean() * 1e4, mean_out_bp=b.mean() * 1e4, t_diff=t_diff,
                ov_ann_pct=o.sum() / yrs * 100, ov_sr=o.mean() / o.std() * np.sqrt(252), t_ov=t_ov,
                hit=(a > 0).mean())

if __name__ == "__main__":
    S = signals(F)
    IS = (idx >= c.IS_START) & (idx < c.OOS_START); OOS = (idx >= c.OOS_START) & (idx <= c.OOS_END)
    ex = m.x30 - m.cash
    rows = []
    for k, sig in S.items():
        ov = overlay(sig, ex)
        d = describe(k, sig, m.x30, m.cash, ov, IS)
        d2 = describe(k, sig, m.x30, m.cash, ov, OOS)
        d["oos_mean_in_bp"] = d2["mean_in_bp"]; d["oos_ov_ann_pct"] = d2["ov_ann_pct"]; d["oos_n"] = d2["n"]
        d["x100_t_diff"] = describe(k, sig, m.x100, m.cash, overlay(sig, m.x100 - m.cash), IS)["t_diff"]
        # 2005-2009 (IS öncesi ek kontrol, seçimde kullanılmaz)
        d["pre2010_t_diff"] = describe(k, sig, m.x30, m.cash, ov, idx < c.IS_START)["t_diff"]
        rows.append(d)
    # gece / gün içi
    allday = pd.Series(True, index=idx)
    exon = m.x30_on - m.cash; exid = m.x30_id
    for nm, sig, o in [("overnight_all", allday, overnight_overlay(allday, exon)),
                       ("intraday_all", allday, exid - 2 * c.FUT_COST)] + \
                      [(f"overnight_{['Mon','Tue','Wed','Thu','Fri'][d]}", F.dow == d, overnight_overlay(F.dow == d, exon)) for d in range(5)]:
        o = o[IS]
        rows.append(dict(sig=nm, n=int(sig[IS].sum()), mean_in_bp=(m.x30_on if "overnight" in nm else m.x30_id)[IS & sig.values].mean() * 1e4,
                         ov_ann_pct=o.sum() / (len(o) / 252) * 100, ov_sr=o.mean() / o.std() * np.sqrt(252),
                         t_ov=o.mean() / o.std() * np.sqrt(len(o)),
                         t_diff=st.ttest_1samp((m.x30_on if "overnight" in nm else m.x30_id)[IS & sig.values], 0).statistic,
                         oos_mean_in_bp=(m.x30_on if "overnight" in nm else m.x30_id)[OOS & sig.values].mean() * 1e4,
                         oos_ov_ann_pct=(overnight_overlay(sig, exon) if "overnight" in nm else exid - 2 * c.FUT_COST)[OOS].sum() * 100))
    R = pd.DataFrame(rows)
    N = len(R)
    R["p_diff"] = 2 * st.norm.sf(R.t_diff.abs())
    R["bonf_sig"] = R.p_diff < 0.05 / N
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 200)
    R.to_csv(c.H / "results_scan.csv", index=False)
    print("N tests:", N, " Bonferroni |t| >", round(st.norm.isf(0.025 / N), 2))
    print(R.sort_values("t_diff", key=abs, ascending=False).round(3).to_string(index=False))
