import sys, pandas as pd
E = pd.read_csv("cand_auto.csv", parse_dates=["ts"])
a, b = sys.argv[1], sys.argv[2]
for ep, g in E.groupby("ep", sort=False):
    r = g.iloc[0]
    if not (a <= str(r.ts) < b): continue
    fl = "".join(k[0].upper() if g[k].any() else "." for k in ["ten", "cc", "spa", "nego"])
    print(f"[{ep}] {r.filer[:12]} {r.ts:%Y-%m-%d %H:%M} {fl} n={len(g)}")
    for _, x in g.head(3).iterrows(): print(f"  {x.ts:%y%m%d} {x.idx} {str(x.summary)[:75]}")
    print("  >", r.text[:170])
