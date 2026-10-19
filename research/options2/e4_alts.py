"""E4: SOL / XRP USDC-linear Deribit options (history from 2024-03).  Weekly Friday 30d strangle, hold to expiry.
Filters: own 7d ATM IV > its trailing median (look 180d, >= 60 obs, from 24h-before-09:00 trade marks) or
BTC DVOL > 365d median (the BTC/ETH rule, no new parameter).  IS = 2024-04..2025-10-16 (only ~18 months)."""
import pickle, numpy as np, pandas as pd
import eng, exp, strat
dd = eng.data()
SM, EXP = pickle.load(open(eng.D / "raw/usdc_smiles.pkl", "rb"))
dd["SM"].update(SM); dd["EXP"].update(EXP)
for u in ("SOL", "XRP"):
    dd["H"][u] = pd.read_csv(eng.ROOT / "data/crypto_1h" / f"{u}.csv", index_col=0, parse_dates=True)
    dd["deliv"][u] = pd.read_csv(eng.D / "raw" / f"deliv_{u.lower()}_usdc.csv").set_index("date").delivery_price
# own ATM-7d IV history per (u, day)
atm = {}
for (u, day), exs in EXP.items():
    t0 = pd.Timestamp(day) + pd.Timedelta(hours=9)
    c = [e for e in exs if 4 <= (e - t0).total_seconds() / 86400 <= 10]
    if not c: continue
    x, v, b, T = SM[(u, day, c[0])]
    if x.min() < 0 < x.max(): atm[(u, day)] = float(np.interp(0, x, v))
A = pd.Series(atm); A.index = pd.MultiIndex.from_tuples(A.index)
def f_own(look=180, minobs=60):
    def f(cur, day):
        if cur in ("BTC", "ETH"): return strat.f_dvol()(cur, day)
        s = A.loc[cur]; s = s[s.index < day]  # strictly before today
        s = s.iloc[-look:]
        if len(s) < minobs or (cur, day) not in A.index: return False
        return A.loc[(cur, day)] > s.median()
    return f
def f_btc(cur, day):
    return strat.f_dvol()("BTC" if cur not in ("BTC", "ETH") else cur, day)
PER = (("IS", "2024-04-05", eng.OOS0), ("OOS", eng.OOS0, eng.OOS1))
exp.PER = PER
C = []
for curs in (("SOL",), ("XRP",), ("SOL", "XRP"), ("BTC", "ETH"), ("BTC", "ETH", "SOL", "XRP")):
    for fn, f in (("own", f_own()), ("own90", f_own(90, 40)), ("btcdvol", f_btc), ("none", strat.f_none)):
        for size in (1.0, 2.0, 3.0):
            C.append(("+".join(curs) + f"|{fn}|s{size}", dict(curs=curs, filt=f, size=size, start="2024-04-05", fname=fn)))
_make = exp.make
def make(p):
    s = _make(p); s.curs = p["curs"]; return s
exp.make = make
print(len(C)); df = exp.run_all(C, "e4")
pd.set_option("display.width", 250)
print(df[["name", "IS_geo", "IS_dd_mtm", "IS_worst_wk", "IS_liq", "IS_act", "OOS_geo", "OOS_dd_mtm", "OOS_worst_wk", "OOS_act"]].sort_values("name").round(4).to_string())
