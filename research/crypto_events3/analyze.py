"""Selection (IS-only rules), burst-capture diagnostics, neighbours, walk-forward gate selection, deflated Sharpe."""
import sys, pathlib, pickle, pandas as pd, numpy as np
from scipy.stats import norm, skew, kurtosis
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import gate as g, gate_grid as gr
pd.set_option("display.width", 320); pd.set_option("display.max_rows", 300); pd.set_option("display.max_columns", 40)
G = pd.read_csv(H / "raw/grid.csv", index_col=0); SER = pickle.load(open(H / "raw/series.pkl", "rb"))
G["IS_calmar"] = G.IS_usd / -G.IS_dd
gated = G.drop(["UNGATED s=0.2", "UNGATED s=0.1"])
C = ["IS_usd", "IS_try", "IS_dd", "IS_worst", "IS_sr", "IS_n", "OOS_usd", "OOS_try", "OOS_dd", "OOS_worst", "OOS_sr", "OOS_n",
     "OOS_25-10..26-02", "OOS_26-03..05", "OOS_26-06..10"]
picks = {"S1 max IS geo": gated.IS_usd.idxmax(), "S2 max IS Sharpe": gated.IS_sr.idxmax(), "S3 max IS calmar": gated.IS_calmar.idxmax()}
for m in ["0/20", "tri"]:
    x = gated[gated.index.str.endswith("|" + m)]; picks[f"S1[{m}] max IS geo"] = x.IS_usd.idxmax(); picks[f"S3[{m}] max IS calmar"] = x.IS_calmar.idxmax()
print("== IS-selected picks"); print(pd.concat([G.loc[["UNGATED s=0.2", "UNGATED s=0.1"], C], G.loc[list(picks.values()), C].set_axis([f"{k}: {v}" for k, v in picks.items()])]).to_string())

# burst capture: share of book trades the gate is ON for, by period (trade-level, all book trades)
PER = {"pre-burst IS 22-01..24-12": ("2022-01-01", "2024-12-31"), "IS burst 25-01..05": ("2025-01-01", "2025-05-31"),
       "IS 25-06..10-16": ("2025-06-01", "2025-10-16"), "OOS 25-10..26-02": ("2025-10-17", "2026-02-28"),
       "OOS burst 26-03..05": ("2026-03-01", "2026-05-31"), "OOS 26-06..10": ("2026-06-01", "2026-10-16")}
def onshare(sz):
    return {p: round(100 * np.mean([sz[t["id"]] > 0 for t in g.TRS if pd.Timestamp(a) <= t["d0"] <= pd.Timestamp(b)]), 0) for p, (a, b) in PER.items()}
rows = {}
for c in ["OWN_MTM|N=30|>0", "OWN_MTM|N=45|>0", "OWN_MTM|N=60|>0", "OWN_CLOSED|N=30|>0", "OWN_HIT|N=45|>0.5", "EVT|N=30|hi_q0.67", "EVT|N=90|hi_q0.5",
          "BREADTH|M=50|<0.4", "ALTBTC_EW|N=30|<0", "ALTBTC_VW|N=60|<0", "MKTFUND|N=7|hi_q0.5", "TRDFUND|N=7|>0.0"]:
    rows[c] = onshare(gr.CFG[c + "|0/20"])
pt = pd.DataFrame([(t["d0"], t["ret"]) for t in g.TRS], columns=["d", "r"])
rows["(book trades n)"] = {p: int(((pt.d >= a) & (pt.d <= b)).sum()) for p, (a, b) in PER.items()}
rows["(mean trade ret %)"] = {p: round(100 * pt[(pt.d >= a) & (pt.d <= b)].r.mean(), 2) for p, (a, b) in PER.items()}
print("== % of book trades with gate ON, by period"); print(pd.DataFrame(rows).T.to_string())

# conditional trade returns: mean unit trade return when gate ON vs OFF (IS / OOS) - is there any predictive power?
rows = {}
for c in gr.CONDS:
    cond = gr.CONDS[c]; r = {}
    for nm, a, b in g.WIN:
        x = pt[(pt.d >= a) & (pt.d <= b)]; on = np.array([cond[i] for i in x.index])
        r[f"{nm}_on"] = x.r[on].mean() * 100; r[f"{nm}_off"] = x.r[~on].mean() * 100; r[f"{nm}_non"] = on.sum()
    rows[c] = r
CR = pd.DataFrame(rows).T; CR["IS_diff"] = CR.IS_on - CR.IS_off; CR["OOS_diff"] = CR.OOS_on - CR.OOS_off
print("== trade-level: mean unit ret ON-OFF (pp). corr(IS_diff, OOS_diff) over", len(CR), "conds:", round(CR[["IS_diff", "OOS_diff"]].corr().iloc[0, 1], 2))
print("share of conds with same sign IS/OOS diff:", round((np.sign(CR.IS_diff) == np.sign(CR.OOS_diff)).mean(), 2))
print(CR.sort_values("IS_diff", ascending=False).round(2).head(12).to_string()); print(CR.sort_values("IS_diff").round(2).head(6).to_string())
CR.round(3).to_csv(H / "raw/cond_trade_ret.csv")

# neighbours of picks
def neigh(cfg):
    fam = cfg.split("|")[0]; mode = cfg.split("|")[-1]; th = cfg.split("|")[2]
    return G[G.index.str.startswith(fam + "|") & G.index.str.endswith("|" + mode)]
print("== neighbours (same family+mode)")
for k, v in picks.items():
    nb = neigh(v); print(k, v, "| n", len(nb), "IS_usd med", nb.IS_usd.median(), "OOS_usd med/min/max", nb.OOS_usd.median(), nb.OOS_usd.min(), nb.OOS_usd.max(),
                        "Jun-Oct med", nb["OOS_26-06..10"].median())
print(neigh("OWN_MTM|N=45|>0|0/20")[C].to_string())
print(neigh("EVT|N=30|hi_q0.8|0/20")[C].to_string())

# walk-forward: each month choose config with best trailing-24m geo (IS series before OOS, then the fresh OOS series)
def cont(k):
    a = SER[k]["IS"]["2022-01-01":"2025-10-16"]; b = SER[k]["OOS"]["2025-10-17":"2026-10-16"]; return pd.concat([a, b])
CS = pd.DataFrame({k: cont(k) for k in G.index}); M = (1 + CS).resample("ME").prod() - 1
months = M.loc["2025-10-31":].index
for L in [12, 24]:
  for pool_nm, pool in [("all", list(G.index)), ("0/20+tri", [k for k in G.index if k.endswith("0/20") or k.endswith("tri")])]:
    wf = []; ch = []
    for m in months:
        hist = M.loc[:m - pd.offsets.MonthEnd(1), pool].tail(L); best = ((1 + hist).prod()).idxmax(); ch.append(best)
        x = CS.loc[(CS.index > m - pd.offsets.MonthEnd(1)) & (CS.index <= m), best]; wf.append(x)
    wf = pd.concat(wf); st = g.stats(wf, "2025-10-17", "2026-10-16"); rt = (1 + wf) * (1 + g.PF.fx[wf.index]) - 1
    print(f"== WF trailing {L}m pool={pool_nm}: OOS usd {st['geo']} try {g.stats(rt,'2025-10-17','2026-10-16')['geo']} dd {st['dd']} worst {st['worst']}",
          "| Jun-Oct26", round(((1 + wf['2026-06-01':]).prod() - 1) * 100, 1), "| picks:", pd.Series(ch).value_counts().head(4).to_dict())

# deflated Sharpe (Bailey & Lopez de Prado 2014), daily returns
def dsr(r, N, V):
    r = r[r != 0] if False else r; T_ = len(r); sr = r.mean() / r.std(); g3 = skew(r); g4 = kurtosis(r, fisher=False)
    em = 0.5772156649
    sr0 = np.sqrt(V) * ((1 - em) * norm.ppf(1 - 1 / N) + em * norm.ppf(1 - 1 / (N * np.e)))
    z = (sr - sr0) * np.sqrt(T_ - 1) / np.sqrt(1 - g3 * sr + (g4 - 1) / 4 * sr ** 2)
    psr = (sr) * np.sqrt(T_ - 1) / np.sqrt(1 - g3 * sr + (g4 - 1) / 4 * sr ** 2)
    return dict(SR_ann=round(sr * np.sqrt(365), 2), SR0_ann=round(sr0 * np.sqrt(365), 2), PSR0=round(norm.cdf(psr), 4), DSR=round(norm.cdf(z), 4), T=T_, skew=round(g3, 2), kurt=round(g4, 1))
isr = pd.Series({k: SER[k]["IS"]["2022-01-01":"2025-10-16"].pipe(lambda x: x.mean() / x.std()) for k in G.index})
osr = pd.Series({k: SER[k]["OOS"]["2025-10-17":"2026-10-16"].pipe(lambda x: x.mean() / x.std()) for k in G.index})
NT = 7050 + len(G)
print(f"== DSR: trials N={NT}; var of daily SR across my {len(G)} configs IS={isr.var():.2e} OOS={osr.var():.2e}; ann SD IS {isr.std()*np.sqrt(365):.2f} OOS {osr.std()*np.sqrt(365):.2f}")
rows = {}
for k in ["UNGATED s=0.2", "UNGATED s=0.1"] + list(dict.fromkeys(picks.values())):
    for nm in ["IS", "OOS"]:
        r = SER[k][nm]["2022-01-01":"2025-10-16"] if nm == "IS" else SER[k][nm]["2025-10-17":"2026-10-16"]
        for VV, lab in [(isr.var(), "V=gate-grid"), ((1.0 / np.sqrt(365)) ** 2, "V=(1.0 ann)^2")]:
            rows[(k, nm, lab)] = dsr(r, NT, VV)
print(pd.DataFrame(rows).T.to_string())
