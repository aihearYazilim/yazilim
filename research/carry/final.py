"""Assemble all candidate series, apply (a) frozen IS selection (data <= 2025-10-16 only) and
(b) monthly rolling walk-forward (trailing 24m, data < month start) per family and pooled; leverage table."""
import pickle, pathlib, itertools, numpy as np, pandas as pd, lib, strat_cc
D = pathlib.Path(__file__).parent / "data"
pd.set_option("display.width", 220); pd.set_option("display.max_columns", 30)

fam = {}
fam["cash&carry BTC/ETH"] = {(tuple(c), g): strat_cc.cc(list(c), 1.0, g) for c, g in itertools.product(
    [("BTCUSDT",), ("ETHUSDT",), ("BTCUSDT", "ETHUSDT")], [None, 3, 7, 30])}
xs = pickle.load(open(D / "xs_grid.pkl", "rb")); xs2 = pickle.load(open(D / "xs_grid2.pkl", "rb"))
fam["XS carry (short top-funding perp + long spot)"] = {**{k: v for k, v in xs.items() if k[0] == "carry"}, **xs2}
fam["XS funding L/S perps"] = {k: v for k, v in xs.items() if k[0] == "ls"}
fam["XS short top-funding perps vs long BTC"] = {k: v for k, v in xs.items() if k[0] == "shortbtc"}
fam["X-exchange spread Binance vs Hyperliquid"] = pickle.load(open(D / "xex_grid.pkl", "rb"))
fam["Pairs stat-arb (cointegration)"] = pickle.load(open(D / "pairs_grid.pkl", "rb"))
NCOMB = sum(len(v) for v in fam.values())
IS_SEL = ("2021-01-01", "2025-10-16")

def frozen(c):
    df = pd.DataFrame(c).fillna(0.0)
    sc = np.log1p(df.loc[IS_SEL[0]:IS_SEL[1]]).sum()
    best = sc.idxmax() if not isinstance(sc.idxmax(), tuple) else sc.idxmax()
    return best, df[best]

def oos_stats(net, start=lib.OOS_START):
    e = lib.eq(net.loc[:lib.OOS_END]); return lib.stats(e, start, lib.OOS_END)

rows, best_series = [], {}
for name, c in fam.items():
    c = {str(k): v for k, v in c.items()}
    b, s = frozen(c)
    st = lib.summarize(s, is_start="2021-01-01")
    rows.append(dict(family=name, selection="frozen best IS (2021-01..2025-10-16)", params=b, **{k: st[k] for k in ["IS_geo", "IS_dd", "OOS_geo", "OOS_dd", "OOS_worst"]}, ncomb=len(c)))
    best_series[(name, "frozen")] = s
    wf, picks = lib.walk_forward(c, train_months=24, switch_cost=0.005, start="2021-01-01")
    st = lib.summarize(wf, is_start="2021-01-01")
    oos_picks = sorted(set(v for k, v in picks.items() if k >= "2025-10"))
    rows.append(dict(family=name, selection="rolling WF 24m (monthly)", params=f"{len(oos_picks)} distinct OOS picks", **{k: st[k] for k in ["IS_geo", "IS_dd", "OOS_geo", "OOS_dd", "OOS_worst"]}, ncomb=len(c)))
    best_series[(name, "wf")] = wf
pool = {f"{n}|{k}": v for n, c in fam.items() for k, v in c.items()}
wf, picks = lib.walk_forward(pool, train_months=24, switch_cost=0.005, start="2021-01-01")
st = lib.summarize(wf, is_start="2021-01-01")
rows.append(dict(family="ALL families pooled", selection="rolling WF 24m (monthly)", params=str({k: v for k, v in picks.items() if k >= "2025-10"})[:300], **{k: st[k] for k in ["IS_geo", "IS_dd", "OOS_geo", "OOS_dd", "OOS_worst"]}, ncomb=NCOMB))
best_series[("pool", "wf")] = wf
res = pd.DataFrame(rows)
print(res.to_string()); print("total combinations:", NCOMB)
res.to_csv(D / "final_table.csv", index=False)

# leverage table for the frozen picks: scale daily net by E (perp-only legs: margin, no borrow;
# spot carry: extra (E-1)*8%/yr borrow). Wipe-out if a levered day loses >= 90%.
lev_rows = []
for (name, sel), s in best_series.items():
    if sel != "frozen": continue
    for E in [1, 2, 3, 5, 10]:
        x = s * E
        if "carry" in name: x = x - (E - 1) * lib.BORROW / 365
        wiped = bool((x.loc[lib.OOS_START:lib.OOS_END] <= -0.9).any())
        x = x.clip(lower=-1.0)
        si, so = lib.stats(lib.eq(x), "2021-01-01", "2025-10-16"), oos_stats(x)
        lev_rows.append(dict(family=name, E=E, IS_geo=si["aylik_geo_%"], IS_dd=si["maxDD_%"], OOS_geo=so["aylik_geo_%"],
                             OOS_dd=so["maxDD_%"], OOS_worst=so["en_kotu_ay_%"], wiped=wiped))
lev = pd.DataFrame(lev_rows); print(lev.to_string()); lev.to_csv(D / "leverage_table.csv", index=False)
pickle.dump(best_series, open(D / "best_series.pkl", "wb"))
