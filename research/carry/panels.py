"""Build daily panels (UTC days). Day d = [d 00:00, d+1 00:00).
funding[d] = sum of funding rates settled in (d 00:00, d+1 00:00]  -> earned by a position held through day d
(position decided at close of d-1, i.e. at d 00:00). Short perp receives +funding."""
import pathlib, numpy as np, pandas as pd
D = pathlib.Path(__file__).parent / "data"
DAY = 86400000

def _fund(path):
    f = pd.read_csv(path)
    day = (f.ts - 1) // DAY * DAY
    s = f.groupby(day).rate.sum()
    s.index = pd.to_datetime(s.index, unit="ms")
    return s

def _kl(path):
    k = pd.read_csv(path)
    k.index = pd.to_datetime(k.ts, unit="ms").dt.normalize()
    return k[~k.index.duplicated()]

def build():
    out = D / "panels.pkl"
    if out.exists():
        return pd.read_pickle(out)
    F, P, PV, S, SV = {}, {}, {}, {}, {}
    for p in (D / "funding").glob("*.csv"):
        F[p.stem] = _fund(p)
    for p in (D / "perp").glob("*.csv"):
        k = _kl(p); P[p.stem] = k.close; PV[p.stem] = k.qvol
    for p in (D / "spot").glob("*.csv"):
        k = _kl(p); S[p.stem] = k.close; SV[p.stem] = k.qvol
    res = {n: pd.DataFrame(x).sort_index() for n, x in
           dict(fund=F, perp=P, perpvol=PV, spot=S, spotvol=SV).items()}
    idx = pd.date_range("2019-09-01", res["perp"].index.max(), freq="D")
    res = {n: v.reindex(idx) for n, v in res.items()}
    pd.to_pickle(res, out)
    return res
