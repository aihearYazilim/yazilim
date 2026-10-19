"""EM carry cross-section: build per-currency daily panels (business-day index).

Sources (downloaded into data/, see fetch commands in README section of the final report):
  FX      : Yahoo chart API  <CCY>=X  daily (USD/CCY, i.e. local units per USD)
  policy  : BIS WS_CBPOL daily (D.<CC>); EG/KZ from IMF IFS via DBnomics (FPOLM_PA, EG pre-2011 FIDR_PA),
            KZ 2021+ base-rate decisions hand-entered (approximate).
  CPI y/y : BIS WS_LONG_CPI (M.<CC>.771); EG/KZ IMF IFS PCPI_PC_CP_A_PT.
  US rate : BIS WS_CBPOL D.US (fed funds target mid-point).
  TRY     : reuses research/try_carry/data/panel.csv (the exact R3 inputs) for comparability.

FX processing identical in spirit to try_carry/data_prep.py:
  - Yahoo close is often stale after 2011 (close==open) -> end-of-day mark = NEXT bar's open.
  - weekend bars folded into the next Monday.
  - Yahoo highs contain many bad ticks (2006 BRL/COP/CLP/ARS 5-7% spikes, IDR 2006 x1000, EGP 2008 x20).
    Two high series are kept:
      high_raw : high clamped to <= 1.25 * max(prev mark, mark)  (the original R3 rule)
      high     : high clamped to <= max(prev,mark) * (1 + max(2%, 5 * sigma20_daily))  (bad-tick filter)
    Results are reported on `high`; `high_raw` is a robustness check (it can only add spurious liquidations).
Timing:
  - policy rate: BIS daily value shifted +1 business day (decision effective next day, no same-day use).
  - CPI y/y of month m is usable from day 20 of month m+1 (conservative publication lag).
"""
import json, pathlib, numpy as np, pandas as pd

H = pathlib.Path(__file__).resolve().parent
D = H / "data"
END = "2026-10-16"
CCYS = {  # ccy: (BIS/IMF country code, sample end override)
    "BRL": ("BR", None), "ZAR": ("ZA", None), "MXN": ("MX", None), "INR": ("IN", None), "IDR": ("ID", None),
    "RUB": ("RU", "2022-02-18"), "ARS": ("AR", None), "COP": ("CO", None), "CLP": ("CL", None),
    "HUF": ("HU", None), "PLN": ("PL", None), "EGP": ("EG", None), "KZT": ("KZ", None),
}
KZ_TAIL = [("2021-07-26", 9.25), ("2021-09-13", 9.5), ("2021-10-25", 9.75), ("2022-01-24", 10.25),
           ("2022-02-24", 13.5), ("2022-04-25", 14.0), ("2022-07-25", 14.5), ("2022-10-26", 16.0),
           ("2022-12-05", 16.75), ("2023-08-28", 16.5), ("2023-10-06", 16.0), ("2023-11-24", 15.75),
           ("2024-01-19", 15.25), ("2024-03-01", 14.75), ("2024-07-12", 14.25), ("2024-11-29", 15.25),
           ("2025-03-07", 16.5), ("2025-10-10", 18.0)]


def bis_daily(cc):
    d = pd.read_csv(D / f"cbpol_{cc}.csv", usecols=["TIME_PERIOD", "OBS_VALUE"])
    d.index = pd.to_datetime(d.TIME_PERIOD, errors="coerce")
    return d.OBS_VALUE[d.index.notna()].dropna().sort_index()


def bis_cpi(cc):
    d = pd.read_csv(D / f"cpi_{cc}.csv", usecols=["TIME_PERIOD", "OBS_VALUE"])
    d.index = pd.to_datetime(d.TIME_PERIOD + "-01")
    return d.OBS_VALUE.dropna().sort_index()


def imf(cc, code):
    j = json.load(open(D / f"dbn_{cc}_{code}.json"))["series"]["docs"][0]
    s = pd.Series(j["value"], index=pd.to_datetime([p + "-01" for p in j["period"]]))
    return pd.to_numeric(s, errors="coerce").dropna()


def fx(ccy):
    j = json.load(open(D / f"yh_{ccy}.json"))["chart"]["result"][0]
    q = j["indicators"]["quote"][0]
    ts = pd.to_datetime(j["timestamp"], unit="s") + pd.Timedelta(hours=2)
    df = pd.DataFrame({k: q[k] for k in ["open", "high", "low", "close"]}, index=ts.normalize())
    df = df[~df.index.duplicated(keep="last")].dropna()
    df = df[(df > 0).all(axis=1)]
    # unit/scale breaks (e.g. IDR open/high quoted /1000 for weeks in 2006): per column, rescale by the power of 10
    # vs a rolling median of close; then open/high/low outside [0.7, 1.4] x the bar's close are treated as missing.
    med = df["close"].rolling(61, center=True, min_periods=5).median()
    for col in ["close", "open", "high", "low"]:
        k = np.round(np.log10(med / df[col]))
        df[col] = df[col] * 10 ** k.where(k.abs() >= 2, 0.0)
        if col != "close":
            ratio = df[col] / df["close"]
            df.loc[(ratio < 0.7) | (ratio > 1.4), col] = np.nan
    df["mark"] = df["open"].shift(-1).fillna(df["close"])
    df["mark"] = df["mark"].fillna(df["close"]).ffill()
    df["high"] = df["high"].fillna(df[["open", "close"]].max(axis=1)).fillna(df["mark"])
    bd = df.index.where(df.index.dayofweek < 5, df.index + pd.offsets.BDay(1))
    g = df.groupby(bd)
    df = pd.DataFrame({"high_raw": g["high"].max(), "close": g["mark"].last()})
    # isolated bad marks (spike-and-revert, e.g. ZAR 2024-11-14 14.86 between 18.2s; COP 2014-02-19):
    # compare with the centred 7-day median (data-cleaning only; genuine step jumps survive because the
    # median follows a persistent level shift).
    bad = pd.Series(False, df.index)
    for _ in range(3):   # iterate: consecutive/alternating bad ticks (ZAR Jan-2025)
        c = df["close"].where(~bad).ffill()
        m7 = c.rolling(7, center=True, min_periods=3).median()
        rsig = np.log(c).diff().abs().rolling(120, min_periods=20).median().bfill() * 1.4826   # robust sigma
        dev = np.log(c / m7).abs()
        bad = bad | (dev > np.maximum(0.04, 8 * rsig))
    df.loc[bad, "close"] = np.nan
    df["close"] = df["close"].ffill()
    df["badmark"] = bad.astype(int)
    prev = df["close"].shift(1).fillna(df["close"])
    ref = np.maximum(prev, df["close"])
    df["high_raw"] = np.minimum(np.maximum(df["high_raw"], ref), ref * 1.25)
    sig = np.log(df["close"]).diff().rolling(20, min_periods=10).std().shift(1).fillna(0.01)
    cap = np.maximum(0.02, 5 * sig)
    df["high"] = np.minimum(df["high_raw"], ref * (1 + cap))
    return df


def step_series(pairs, idx):
    s = pd.Series(np.nan, idx)
    for dt, v in pairs:
        s[s.index > pd.Timestamp(dt)] = v
    return s


def build_one(ccy, cc, end_override):
    f = fx(ccy)
    if cc == "EG":
        pol_m = imf("EG", "FPOLM_PA")
        pol_m = pd.concat([imf("EG", "FIDR_PA").loc[:"2011-10"], pol_m])
        pol = pol_m  # monthly; month m value used from the 1st of m+1 (no look-ahead within month)
        pol.index = pol.index + pd.DateOffset(months=1)
        cpi = imf("EG", "PCPI_PC_CP_A_PT")
        polsrc = "monthly"
    elif cc == "KZ":
        pol_m = imf("KZ", "FPOLM_PA")
        pol_m.index = pol_m.index + pd.DateOffset(months=1)
        pol = pol_m
        cpi = imf("KZ", "PCPI_PC_CP_A_PT")
        cpi = cpi[~((cpi.index >= "2000-01-01") & (cpi.abs() > 60))]   # 2020-12 series-break artefact (108%)
        polsrc = "monthly"
    else:
        pol = bis_daily(cc)
        cpi = bis_cpi(cc)
        polsrc = "daily"
    us = bis_daily("US")
    end = min(pd.Timestamp(end_override or END), pd.Timestamp(END))
    cpi_av = cpi.copy()
    cpi_av.index = cpi_av.index + pd.DateOffset(months=1) + pd.Timedelta(days=19)
    pol_end = pol.index[-1] + pd.Timedelta(days=60 if polsrc == "monthly" else 120)
    if cc == "KZ":
        pol_end = pd.Timestamp(END)
    end = min(end, cpi_av.index[-1] + pd.DateOffset(months=3), pol_end)
    start = max(f.index[0], pol.index[0], cpi_av.index[0], pd.Timestamp("2004-01-01"))
    idx = pd.bdate_range(start, end)

    def asof(s, shift_bd):
        x = s.reindex(idx.union(s.index)).ffill().reindex(idx)
        return x.shift(shift_bd) if shift_bd else x
    out = f.reindex(idx)
    out["badmark"] = out["badmark"].fillna(0)
    out["gap"] = (out["close"].isna() | (out["badmark"] == 1)).astype(int)   # no (valid) Yahoo bar that day
    out["close"] = out["close"].ffill()
    out["high"] = out["high"].fillna(out["close"]); out["high_raw"] = out["high_raw"].fillna(out["close"])
    out["pol"] = asof(pol, 1)
    if cc == "KZ":
        tail = step_series(KZ_TAIL, idx)
        out.loc[idx >= "2021-07-27", "pol"] = tail[idx >= "2021-07-27"].ffill()
    out["us"] = asof(us, 1)
    out["cpi"] = asof(cpi_av, 0)
    out = out.dropna()
    out.to_csv(D / f"panel_{ccy}.csv")
    return out


def build_try():
    p = pd.read_csv(H.parent / "try_carry/data/panel.csv", index_col=0, parse_dates=True).loc[:END]
    out = pd.DataFrame({"high_raw": p["high"], "close": p["close"], "high": p["high"],
                        "pol": p["pol"], "us": p["fed"], "cpi": p["cpi"]}, index=p.index).dropna()
    out["gap"] = 0
    out.to_csv(D / "panel_TRY.csv")
    return out


if __name__ == "__main__":
    for ccy, (cc, e) in CCYS.items():
        o = build_one(ccy, cc, e)
        real = o.pol - o.cpi
        print(f"{ccy}: {o.index[0].date()}..{o.index[-1].date()} n={len(o)}  pol {o.pol.min():.1f}-{o.pol.max():.1f}"
              f"  real>5 frac={np.mean(real > 5):.2f} real>0 frac={np.mean(real > 0):.2f}"
              f"  #high capped vs raw={int((o.high < o.high_raw - 1e-12).sum())}")
    o = build_try()
    print(f"TRY: {o.index[0].date()}..{o.index[-1].date()} n={len(o)} real>5 frac={np.mean(o.pol - o.cpi > 5):.2f}")
