"""Intra-week mark-to-market + Deribit margin check using Binance hourly candles (high/low/close).
Each filter-ON currency sleeve = half of equity; notional = size * sleeve equity (coins = size*E/S0).
Liability revalued with BS on spot, per-leg entry IV * (1 + k*|ln S/S0|) (vol rises with the move), tau to expiry.
Margin models (USD, USDC-collateral assumed):
  STD  (Deribit standard, inverse options): MM per short option = (0.075 + mark_coin) * S  ->  MM = N*0.075*S*2legs + L
        IM at entry = sum legs (max(0.15 - OTM/S, 0.10) + mark_coin) * S * N
  PM   (portfolio-margin approximation): MM = worst extra loss over spot shocks within +-12% (BTC) / +-14% (ETH)
        with vol +30% relative (approx 0.8 x the +-16%/vol-up risk-matrix initial margin)
Liquidation: if equity < MM at an hourly high/low (or close), position is closed at stressed BS value
  + 10% of option value slippage + 0.19% of notional liquidation fee (STD) / same (PM). Sleeve then sits in cash."""
from common import R, ORIG
import numpy as np, pandas as pd, sys
from bs import bs_price
from variants import cost_leg, stats, TICK, FEE
H = {c: pd.read_csv(ORIG.parents[1]/"data/crypto_1h"/f"{c}.csv", index_col=0, parse_dates=True) for c in ("BTC","ETH")}
SHOCK = {"BTC": 0.12, "ETH": 0.14}

def week(e, size, k, model, use_hl=True, h=0.05, d=.3):
    S0, F, T, S = e["S0"], e["F"], e["T"], e["S"]
    legs = []
    prem_net = 0.0
    for isc, dl in ((False, -d), (True, d)):
        K = e["sm"].strike(dl, isc); v = float(e["sm"].iv(K))
        mark = float(bs_price(F, K, T, v, isc)) * S0 / F
        half = max(h*mark, TICK*S0); fee = min(FEE*S0, .125*mark)
        prem_net += mark - half - fee
        legs.append((K, v, isc, mark))
    N = size / S0                     # coins per 1 USD of sleeve equity
    cash = 1.0 + N * prem_net
    im = N * sum((max(0.15 - max((S0-K) if not isc else (K-S0), 0)/S0, 0.10)*S0 + m) for K, v, isc, m in legs)
    t0 = pd.Timestamp(e["day"]) + pd.Timedelta(hours=9)        # first full hour after entry
    t1 = pd.Timestamp(e["expiry"]) + pd.Timedelta(hours=7)     # 07:00 candle ends at 08:00 settlement
    hh = H[e["cur"]].loc[t0:t1]
    def liab(Sx, tau, extra=1.0):
        tot = 0
        for K, v, isc, m in legs:
            vv = v * (1 + k*abs(np.log(Sx/S0))) * extra
            tot += float(bs_price(Sx, K, max(tau, 1e-6), vv, isc))
        return N * tot
    worst_eq = np.inf; worst_ratio = np.inf
    for ts, row in hh.iterrows():
        tau = ((pd.Timestamp(e["expiry"]) + pd.Timedelta(hours=8)) - (ts + pd.Timedelta(hours=1))).total_seconds()/(365*86400)
        pts = [row.low, row.high, row.close] if use_hl else [row.close]
        for Sx in pts:
            L = liab(Sx, tau); eq = cash - L
            if model == "STD":
                mm = N * 0.075 * Sx * 2 + L
            elif model == "PM":
                sh = SHOCK[e["cur"]]
                mm = max(liab(Sx*(1+s), tau, 1.3) for s in (-sh, -sh/2, 0, sh/2, sh)) - L
            else:
                mm = -np.inf
            worst_eq = min(worst_eq, eq)
            if eq < mm:
                Lx = liab(Sx, tau) * 1.10 + 0.0019 * N * Sx * 2
                return cash - Lx - 1.0, True, im, ts, Sx/S0 - 1
    # held to expiry: original settlement accounting
    r = 0
    for K, v, isc, m in legs:
        intr = max(S-K,0) if isc else max(K-S,0)
        r += cost_leg(m, S0, S, K, isc, max(h*m, TICK*S0)) 
    return size * r / S0, False, im, None, worst_eq - 1.0

def run(size, k, model, use_hl=True, combine="isolated"):
    rows = []
    for e in R.ENT["W"]:
        if not np.isfinite(e["S"]): continue
        f = R.FEAT[(e["cur"], e["day"])]
        if not f["dvol"] > f["dvmed"]:
            rows.append(dict(day=e["day"], expiry=e["expiry"], cur=e["cur"], r=0.0, liq=False, im=0, info=None)); continue
        r, liq, im, ts, info = week(e, size, k, model, use_hl)
        rows.append(dict(day=e["day"], expiry=e["expiry"], cur=e["cur"], r=r, liq=liq, im=im, info=info, ts=ts))
    U = pd.DataFrame(rows)
    s = U.groupby("day").agg(expiry=("expiry","first"), r=("r","mean")); s["r"] = s.r.clip(lower=-1)
    return U, s

if __name__ == "__main__":
    OOS0 = "2025-10-17"; out = []
    for size in (2, 3):
        for k in (0.0, 2.0, 4.0):
            for model in ("NONE", "STD", "PM"):
                if model == "NONE" and k: continue
                U, s = run(size, k, model)
                a = stats(s[s.index < OOS0]); b = stats(s[s.index >= OOS0])
                on = U[U.im > 0]
                L = U[U.liq]
                out.append(dict(size=size, k=k, model=model, liq_IS=int((L.day < OOS0).sum()), liq_OOS=int((L.day >= OOS0).sum()),
                                IM_entry_med=on.im.median(), IM_entry_max=on.im.max(),
                                IS_geo=a["geo"], IS_dd=a["dd"], OOS_geo=b["geo"], OOS_dd=b["dd"], OOS_worst_wk=b["worst_wk"]))
                if model != "NONE" and len(L) and k == 2.0:
                    print(f"size {size} k {k} {model} liquidations:")
                    print(L[["cur","day","ts","info","r"]].round(4).to_string())
    pd.set_option("display.width", 220)
    print(pd.DataFrame(out).round(4).to_string())
