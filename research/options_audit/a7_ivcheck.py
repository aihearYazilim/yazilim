"""Sanity: recomputed mark IV vs Deribit's own mark IV; ATM weekly IV vs DVOL; implied vs realised weekly vol by regime."""
from common import R
import numpy as np, pandas as pd
ch = R.ch
d = ch.miv - ch.iv/100
print("miv - deribit iv (vol pts): median %.4f, p5 %.4f, p95 %.4f" % (d.median(), d.quantile(.05), d.quantile(.95)))
H = {c: pd.read_csv(R.pathlib.Path(R.__file__).resolve().parents[2]/"data/crypto_1h"/f"{c}.csv", index_col=0, parse_dates=True).close for c in ("BTC","ETH")}
rows = []
for e in R.ENT["W"]:
    if not np.isfinite(e["S"]): continue
    f = R.FEAT[(e["cur"], e["day"])]
    atm = float(e["sm"].iv(e["F"]))
    p = H[e["cur"]].loc[pd.Timestamp(e["day"])+pd.Timedelta(hours=8):pd.Timestamp(e["expiry"])+pd.Timedelta(hours=8)]
    rv = np.log(p).diff().std()*np.sqrt(24*365)
    rows.append(dict(cur=e["cur"], day=e["day"], atm=atm, dvol=f["dvol"]/100, rv=rv, on=f["dvol"]>f["dvmed"], absmove=abs(np.log(e["S"]/e["S0"]))))
X = pd.DataFrame(rows)
print("ATM weekly IV / DVOL(prev close): median %.3f" % (X.atm/X.dvol).median())
X["vrp"] = X.atm - X.rv
print(X.groupby("on").agg(atm=("atm","mean"), rv=("rv","mean"), vrp=("vrp","mean"), vrp_med=("vrp","median"), absmove=("absmove","mean"), n=("atm","size")).round(4))
print("expected |move| under ATM IV ~ 0.8*iv*sqrt(7/365):", (0.8*X.atm*np.sqrt(7/365)).groupby(X.on).mean().round(4).to_dict())
