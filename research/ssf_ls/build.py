"""Build continuous front-month single-stock-futures (SSF) panel from raw/ssf_panel.pkl.

Roll rule: at close of day t we hold, for each underlying, the nearest-expiry contract whose expiry is more than
ROLL_TD trading days away (i.e. roll ROLL_TD trading days before expiry, into the next listed month).
Daily return on day t of the contract chosen at t-1: settle_t / prev_settle_t - 1 (prev_settle is published by
the exchange already adjusted for corporate actions, so splits/bonus issues do not create jumps).
Outputs (wide, index = BIST trading days, columns = underlyings), saved to raw/cont.pkl:
  fret   : daily futures return of the held contract (NaN if no contract)
  roll   : True on day t if the held contract changes at t close (roll trade needed)
  fval   : TL traded value of the front (held) contract on t
  fvalall: TL traded value of all SSF months of that underlying on t
  oi     : open interest (contracts) of the held contract
  fset   : settle of held contract; fexp : expiry; and XU030 index-future continuous return 'xu030'.
"""
import pathlib, pickle, numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
ROLL_TD = 3


def build(roll_td=ROLL_TD):
    df = pd.read_pickle(H / "raw/ssf_panel.pkl")
    days = pd.DatetimeIndex(sorted(df.date.unique()))
    dpos = pd.Series(np.arange(len(days)), index=days)
    # trading-day index of expiry (expiry may fall on a non-bulletin day -> searchsorted)
    df["exp_pos"] = days.searchsorted(df["expiry"])
    df["t_pos"] = dpos.reindex(df["date"]).values
    df["ttl"] = df["exp_pos"] - df["t_pos"]          # trading days to expiry
    out = {k: {} for k in ["fret", "roll", "fval", "fvalall", "oi", "fset", "fexp", "fclose"]}
    for und, g in df.groupby("und"):
        g = g.sort_values(["date", "expiry"])
        piv_set = g.pivot(index="date", columns="code", values="settle")
        piv_prev = g.pivot(index="date", columns="code", values="prev_settle")
        piv_val = g.pivot(index="date", columns="code", values="value")
        piv_oi = g.pivot(index="date", columns="code", values="oi")
        piv_cl = g.pivot(index="date", columns="code", values="close")
        elig = g[g.ttl > roll_td].sort_values(["date", "expiry"]).groupby("date").first()
        held = elig["code"]                                          # contract held at close of t
        exp = elig["expiry"]
        dd = held.index
        prev_held = held.shift(1)
        r = pd.Series(np.nan, index=dd)
        for i, d in enumerate(dd):
            c = prev_held.iloc[i]
            if isinstance(c, str) and c in piv_set.columns:
                s, p = piv_set.at[d, c], piv_prev.at[d, c]
                if pd.notna(s) and pd.notna(p) and p > 0:
                    r.iloc[i] = s / p - 1
        out["fret"][und] = r
        out["roll"][und] = (held != prev_held) & prev_held.notna()
        out["fval"][und] = pd.Series([piv_val.at[d, c] for d, c in held.items()], index=dd)
        out["fvalall"][und] = piv_val.sum(axis=1)
        out["oi"][und] = pd.Series([piv_oi.at[d, c] for d, c in held.items()], index=dd)
        out["fset"][und] = pd.Series([piv_set.at[d, c] for d, c in held.items()], index=dd)
        out["fclose"][und] = pd.Series([piv_cl.at[d, c] for d, c in held.items()], index=dd)
        out["fexp"][und] = exp
    W = {k: pd.DataFrame(v).reindex(days) for k, v in out.items()}
    W["roll"] = W["roll"].fillna(False).astype(bool)
    with open(H / f"raw/cont_r{roll_td}.pkl", "wb") as f:
        pickle.dump(W, f)
    return W


def load(roll_td=ROLL_TD):
    p = H / f"raw/cont_r{roll_td}.pkl"
    if not p.exists():
        return build(roll_td)
    with open(p, "rb") as f:
        return pickle.load(f)


if __name__ == "__main__":
    W = build()
    r = W["fret"]
    print(r.shape, r.notna().sum(axis=1).resample("YE").mean().round(0).to_dict())
    big = r.abs() > 0.25
    print("abs ret > 25%:", int(big.sum().sum()))
    print(r[big].stack().sort_values().head(10))
