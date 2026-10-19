"""Cross-sectional funding carry strategies on Binance USDT-M perps (+ spot hedge).
Signal: trailing L-day mean funding (data <= t). Universe at t: perp (and spot for hedged-with-spot variants)
trailing-30d median quote volume >= VOLMIN (liquidity: positions << 1% of daily volume for $100k)."""
import sys, itertools, numpy as np, pandas as pd, lib

VOLMIN_PERP, VOLMIN_SPOT = 2e7, 5e6

def universe(need_spot):
    p = lib.P()
    ok = p["perpvol"].rolling(30, min_periods=20).median() >= VOLMIN_PERP
    ok &= p["perp"].notna() & p["fund"].notna()
    ok &= p["perp"].notna().rolling(60).sum() >= 60          # >= 60 days listed (avoid fresh listings)
    if need_spot:
        sv = p["spotvol"].reindex(columns=ok.columns)
        ok &= (sv.rolling(30, min_periods=20).median() >= VOLMIN_SPOT) & p["spot"].reindex(columns=ok.columns).notna()
    return ok

def targets(mode, L, K, H, thr, E, stop=False):
    """mode: 'carry' short top-K perp + long same spot; 'ls' long bottom-K / short top-K perps;
    'shortbtc' short top-K perps, long BTC perp; returns (wp, ws)."""
    p = lib.P()
    uni = universe(mode == "carry")
    sig = p["fund"].rolling(L, min_periods=L).mean().where(uni)
    days = sig.index
    n = sig.notna().sum(1)
    rk_top = sig.rank(axis=1, ascending=False, method="first")
    top = (rk_top <= K) & (sig > thr / 365)          # thr annualised; fund is per-day sum
    top = top & (n >= 2 * K).values[:, None]
    wp = -top.astype(float) * E / K                    # partial investment if fewer pass the threshold
    if mode == "ls":
        rk_bot = sig.rank(axis=1, ascending=True, method="first")
        bot = (rk_bot <= K) & (n >= 2 * K).values[:, None]
        ntop = top.sum(1)
        wp = (-top.astype(float)).div(ntop.replace(0, np.nan), axis=0).fillna(0) * E
        wp = wp + bot.astype(float).mul((ntop > 0).astype(float), axis=0) * E / K
    reb = pd.Series(np.arange(len(days)) % H == 0, index=days)
    wp = wp.where(reb, np.nan).ffill().fillna(0.0)
    if stop:  # daily risk exit: drop a short-perp leg while the last day's funding is negative (signal known at t)
        wp = wp.where(~((wp < 0) & (p["fund"].reindex(columns=wp.columns) < 0)), 0.0)
    # positions in coins that drop out of the data are closed
    wp = wp.where(p["perp"].notna(), 0.0)
    ws = None
    if mode == "carry":
        ws = (-wp).where(p["spot"].reindex(columns=wp.columns).notna(), 0.0)
        wp = wp.where(ws != 0, 0.0)
    if mode == "shortbtc":
        wp["BTCUSDT"] = wp["BTCUSDT"] - wp.drop(columns="BTCUSDT").sum(1)
    return wp, ws

GRID = dict(mode=["carry", "ls", "shortbtc"], L=[1, 3, 7, 14, 30], K=[3, 5, 10], H=[1, 3, 7], thr=[0.0, 0.10])
GRID2 = dict(mode=["carry"], L=[1, 3, 7, 14, 30], K=[3, 5, 10], H=[1, 3, 7], thr=[0.0, 0.10], stop=[True])

def run_grid(grid=GRID, E=1.0):
    out = {}
    for k in itertools.product(*grid.values()):
        wp, ws = targets(*k[:5], E, *k[5:])
        out[k] = lib.run(wp, ws)
    return out

if __name__ == "__main__":
    import pickle, pathlib
    which = sys.argv[1] if len(sys.argv) > 1 else "1"
    res = run_grid(GRID if which == "1" else GRID2)
    pickle.dump(res, open(pathlib.Path(__file__).parent / "data" / f"xs_grid{'' if which == '1' else which}.pkl", "wb"))
    rows = [dict(key=k, **lib.summarize(v)) for k, v in res.items()]
    df = pd.DataFrame(rows).sort_values("IS_geo", ascending=False)
    pd.set_option("display.width", 200); pd.set_option("display.max_rows", 300)
    print(df.drop(columns=["name", "lev", "ncomb"]).to_string())
