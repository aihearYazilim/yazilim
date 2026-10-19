"""BIST30 dönemsel değişiklik vekili (bülten 2019+): çeyrek sonundan 10 işlem günü önce 63g ort. işlem hacmine göre
ilk 30'a yeni girenler (önceki çeyrekte ilk 30'da değildi). Eşit ağırlık, o gün kapanışta al -> (a) çeyrek son günü kapanış,
(b) yeni çeyreğin 5. işlem günü kapanışta sat. Hisse maliyeti %0.24/taraf. Getiri PPF fazlası ve XU030 fazlası raporlanır.
Not: gerçek kriter halka açık piyasa değeri + hacim; bu yalnızca vekil."""
import numpy as np, pandas as pd
import common as c
P = pd.read_pickle(c.ROOT / "research/special_sit/panel.pkl")
P = P[(P.suf == "E") & (P.itype == "MSPOTEQT") & (P.c > 0) & (P.pc > 0)].drop_duplicates(["date", "sym"])
C = P.pivot(index="date", columns="sym", values="c"); PC = P.pivot(index="date", columns="sym", values="pc")
V = P.pivot(index="date", columns="sym", values="val")
r = (C / PC - 1); r = r.mask(r.abs() > 0.11).fillna(0)
idx = C.index; F = c.features(idx, c.holidays(idx)); cash = c.cash_per_day(idx)
m = c.market(); x30 = m.x30.reindex(idx).fillna(0)
liq = V.rolling(63, min_periods=40).mean()
qe_pre = idx[(F.tdm_rev == 10) & F.month.isin([3, 6, 9, 12])]
prev = None; rows = []
for d in qe_pre:
    top = set(liq.loc[d].nlargest(30).index)
    if prev is not None:
        new = sorted(top - prev)
        i0 = idx.get_loc(d); qe = idx[i0 + 9]; 
        for nm, i1 in [("to_qend", i0 + 9), ("to_q+5", min(i0 + 14, len(idx) - 1))]:
            seg = slice(i0 + 1, i1 + 1)
            g = (1 + r.iloc[seg][new]).prod() - 1
            gr = g.mean() - 2 * c.STK_COST
            cs = (1 + cash.iloc[seg]).prod() - 1; xs = (1 + x30.iloc[seg]).prod() - 1
            rows.append(dict(date=d, var=nm, n=len(new), net=gr, ex_cash=gr - cs, ex_x30=gr - xs))
    prev = top
R = pd.DataFrame(rows); R["oos"] = R.date >= c.OOS_START
pd.set_option("display.width", 200)
print(R.groupby(["var", "oos"])[["n", "net", "ex_cash", "ex_x30"]].agg(["mean", "count"]).round(4))
for v in ["to_qend", "to_q+5"]:
    x = R[(R["var"] == v) & ~R.oos].ex_cash; print(v, "IS t(ex_cash)=", round(x.mean() / x.std() * np.sqrt(len(x)), 2))
