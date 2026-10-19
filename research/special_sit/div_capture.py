"""Temettü yakalama: hak kullanım (ex) gününden önceki kapanışta al, ex günü AOF'tan sat; net temettü (stopaj sonrası, İş Yatırım NET oranı) tahsil.
Ödeme genelde ex günü (BIST'te hak kullanım = ödeme günü), yani sermaye 1 gün bağlı. Kural: net temettü verimi > h (t-1 kapanışına göre)."""
import json, glob, numpy as np, pandas as pd
from common_ss import *
L = []
for f in glob.glob(str(H/"raw/isy_sermaye/*.json")):
    t = pathlib.Path(f).stem
    for x in json.loads(open(f).read() or "[]"):
        if x.get("SHT_KODU") == "04" and (x.get("SHHE_NAKIT_TM_ORAN") or 0) > 0 and x["SHHE_TARIH"] > 0:
            L.append({"sym": t, "ex": pd.to_datetime(x["SHHE_TARIH"] + 3*3600*1000, unit="ms").normalize(),
                      "gross": x["SHHE_NAKIT_TM_ORAN"] / 100, "net": (x.get("SHHE_NAKIT_TM_ORAN_NET") or x["SHHE_NAKIT_TM_ORAN"] * 0.9) / 100})
E = pd.DataFrame(L).drop_duplicates(["sym", "ex"]); E = E[(E.ex >= "2019-01-03") & (E.ex <= OOS_END)]
P = panel(); S = P[P.suf == "E"].set_index(["sym", "date"]).sort_index(); idx = days(); c = FEE + SLIP
rows = []
for _, e in E.iterrows():
    k = idx.searchsorted(e.ex)
    if k == 0 or k >= len(idx) or idx[k] != e.ex: continue
    dp = idx[k - 1]
    try: x0 = S.loc[(e.sym, dp)]; x1 = S.loc[(e.sym, e.ex)]
    except KeyError: continue
    if isinstance(x0, pd.DataFrame): x0 = x0.iloc[0]
    if isinstance(x1, pd.DataFrame): x1 = x1.iloc[0]
    if not (x0.c > 0 and x1.v > 0): continue
    implied = x0.c - x1.pc  # bültende ex gün önceki kapanış temettüye göre düzeltilmiş
    ret = (x1.v * (1 - c) + e.net) / (x0.c * (1 + c)) - 1
    rows.append({"drop": (x0.c - x1.v) / e.gross, "sym": e.sym, "ex": e.ex, "dp": dp, "yld_net": e.net / x0.c, "yld_gross": e.gross / x0.c, "implied_div": implied, "gross": e.gross,
                 "ret": ret, "ret_nocost": (x1.v + e.net) / x0.c - 1, "val": x0.val})
R = pd.DataFrame(rows); R.to_csv(H/"results"/"div_events.csv", index=False)
# bültendeki önceki kapanış düzeltilmemiş -> ex tarihi kontrolü: ham fiyat düşüşü / brüt temettü
R["drop_over_div"] = (R.ret_nocost + 1) * 0 + 0
import numpy as np
R = R[R.yld_gross < 0.5]
print(len(R), "olay; ortalama (ham AOF düşüşü) / brüt temettü oranı ~ 1 olmalı")
print("medyan düşüş/temettü:", R["drop"].median().round(2), " yld>3% için:", R[R.yld_gross > 0.03]["drop"].median().round(2))
for h in [0.0, 0.03, 0.05, 0.08]:
    x = R[R.yld_net > h]
    print(f"h={h}: n={len(x)} mean={100*x.ret.mean():.2f}% med={100*x.ret.median():.2f}% nocost_mean={100*x.ret_nocost.mean():.2f}% "
          f"IS={100*x[x.ex<OOS_START].ret.mean():.2f}% OOS={100*x[x.ex>=OOS_START].ret.mean():.2f}% (n_oos={len(x[x.ex>=OOS_START])})")
out = []
for h in [0.0, 0.03, 0.05, 0.08]:
    x = R[R.yld_net > h]
    T = [{"d0": r.dp, "path": pd.Series([1 - c, 1 + r.ret], index=[r.dp, r.ex]), "liq_tl": r.val, "key": r.sym + str(r.ex.date())} for r in x.itertuples()]
    for cap in [100_000, 1_000_000]:
        eq, log = simulate(T, cap, max_frac=0.25, liq=0.01); rr = report(eq, log, f"div h={h} cap={cap}"); out.append(rr); print(rr)
pd.DataFrame(out).to_csv(H/"results"/"div_grid.csv", index=False)
