"""Option premium selling backtest on real Deribit marks (entry) and Deribit delivery prices (settlement).
All returns in USD on USD (stablecoin) equity. Hold to expiry. Fridays 08:05+ UTC entries."""
import pathlib, numpy as np, pandas as pd, datetime as dt
from bs import bs_price, bs_delta, strike_for_delta
D = pathlib.Path(__file__).parent / "data"
OOS0 = "2025-10-17"
TICK = 0.0001        # coin, Deribit min tick for BTC/ETH options (far OTM)
FEE = 0.0003         # of underlying per option, capped 12.5% of premium
DFEE = 0.00015       # delivery fee, capped 12.5% of option value
PERP_FEE = 0.001     # protocol: crypto futures 0.10%/trade for delta hedges

def load():
    ch = pd.read_csv(D / "chains.csv.gz")
    deliv = {c: pd.read_csv(D / f"deliv_{c.lower()}_usd.csv").set_index("date").delivery_price for c in ("BTC", "ETH")}
    dv = {c: pd.read_csv(D / f"dvol_{c}.csv").set_index("date").close for c in ("BTC", "ETH")}
    px = {}
    for c in ("BTC", "ETH"):
        d = pd.read_csv(pathlib.Path(__file__).resolve().parents[2] / "data/crypto" / f"{c}.csv", index_col=0, parse_dates=True).close
        px[c] = d
    h = {}
    for c in ("BTC", "ETH"):
        x = pd.read_csv(pathlib.Path(__file__).resolve().parents[2] / "data/crypto_1h" / f"{c}.csv", index_col=0, parse_dates=True).close
        h[c] = x
    return ch, deliv, dv, px, h

class Smile:
    def __init__(self, g, F, T):
        x = np.log(g.strike.values / F)
        s = pd.Series(g.miv.values, index=x).groupby(level=0).median().sort_index()
        self.x, self.v, self.F, self.T = s.index.values, s.values, F, T
    def iv(self, K):
        return np.interp(np.log(K / self.F), self.x, self.v)  # flat extrapolation
    def strike(self, delta, isc):
        K = self.F
        for _ in range(30):
            K = strike_for_delta(self.F, self.T, float(self.iv(K)), delta, isc)
        return float(K)

def build_entries(ch, tenor):
    """returns list of (cur, day, expiry, smile)."""
    out = []
    ch = ch.copy()
    for (cur, day), g in ch.groupby(["cur", "day"]):
        d = dt.date.fromisoformat(day)
        exps = sorted(g.expiry.unique())
        if tenor == "W":
            tgt = (d + dt.timedelta(days=7)).isoformat()
            if tgt not in exps: continue
        else:  # monthly: only on last-Friday days, target = next month's last Friday
            if (d + dt.timedelta(days=7)).month == d.month: continue
            nxt = [e for e in exps if 21 <= (dt.date.fromisoformat(e) - d).days <= 42 and
                   (dt.date.fromisoformat(e) + dt.timedelta(days=7)).month != dt.date.fromisoformat(e).month]
            if not nxt: continue
            tgt = nxt[0]
        ge = g[g.expiry == tgt]
        if len(ge) < 4: continue
        S0 = float(ge.S.iloc[0]); T = float(np.median(ge["T"]))
        b = np.clip(np.log(float(ge.F.iloc[0]) / S0) / T, -0.2, 0.6); F = S0 * np.exp(b * T)
        # smile: OTM options only
        otm = ge[((ge.cp == "P") & (ge.strike <= F * 1.02)) | ((ge.cp == "C") & (ge.strike >= F * 0.98))]
        if len(otm) < 3: continue
        out.append(dict(cur=cur, day=day, expiry=tgt, F=F, S0=S0, T=T, sm=Smile(otm, F, T),
                        xmin=float(np.log(otm.strike.min() / F)), xmax=float(np.log(otm.strike.max() / F))))
    return out

def leg(e, K, isc, S, h, skew_add=0.0):
    """USD per 1 coin of options SOLD: premium received net of spread & fee, minus payoff & delivery fee.
    skew_add: extra vol points added to the price (sensitivity)."""
    F, T = e["F"], e["T"]
    v = float(e["sm"].iv(K)) + skew_add
    mark = float(bs_price(F, K, T, v, isc)) * e["S0"] / F   # USD cash value of coin premium at spot
    half = max(h * mark, TICK * e["S0"])
    fee = min(FEE * e["S0"], 0.125 * mark)
    intr = max(S - K, 0) if isc else max(K - S, 0)
    dfee = min(DFEE * S, 0.125 * intr) if intr > 0 else 0.0
    sold = mark - half - fee - intr - dfee     # P&L for short
    bought = -(mark + half) - fee + intr - dfee  # P&L for long
    return sold, bought, mark, v
