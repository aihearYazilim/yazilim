"""Plain cash-and-carry (long spot / short perp) on BTC, ETH (and BTC+ETH), unconditional and gated
(hold only when trailing-L-day funding > 0). E = notional per leg / equity (E>1 => borrow for spot at 8%/yr)."""
import itertools, pandas as pd, numpy as np, lib

def cc(coins, E=1.0, gate_L=None):
    p = lib.P()
    idx = p["perp"].index
    wp = pd.DataFrame(0.0, index=idx, columns=coins)
    for c in coins:
        on = pd.Series(1.0, index=idx)
        if gate_L:
            on = (p["fund"][c].rolling(gate_L).mean() > 0).astype(float)
        wp[c] = -E / len(coins) * on
    wp = wp.where(p["perp"][coins].notna() & p["spot"][coins].notna(), 0.0)
    return lib.run(wp, -wp)

if __name__ == "__main__":
    rows = []
    for coins, g in itertools.product([["BTCUSDT"], ["ETHUSDT"], ["BTCUSDT", "ETHUSDT"]], [None, 3, 7, 30]):
        rows.append(dict(coins="+".join(coins), gate=g, **lib.summarize(cc(coins, 1.0, g))))
    print(pd.DataFrame(rows).drop(columns=["name", "lev", "ncomb"]).to_string())
