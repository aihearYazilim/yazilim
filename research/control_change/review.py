import re, sys, pandas as pd
X = pd.read_csv("cand.csv", parse_dates=["ts"])
NEGS = re.compile(r"^\s*(bağlı ortaklığımız|iştirakimiz|şirketimizin (%\s?100 )?bağlı ortaklığı|şirketimiz tarafından .{0,80}(devral|satın))", re.I)
POS = re.compile(r"pay alım teklif|çağrı|yönetim kontrol|kontrol(ün)? değiş|hakim ortak|hâkim ortak|ana ortak|imtiyazlı|% ?[5-9]\d[,.]?\d* (oranında|oranındaki|payın|pay)", re.I)
a, b = int(sys.argv[1]), int(sys.argv[2])
for ep, g in X.groupby("ep"):
    if not (a <= ep < b): continue
    sc = sum(bool(POS.search(t)) for t in g.text) - sum(bool(NEGS.search(t)) for t in g.text)
    if sc < 1: continue
    r = g.iloc[0]
    print(f"[{ep}] {r.filer} {r.ts:%Y-%m-%d %H:%M} n={len(g)} sc={sc}")
    for _, x in g.head(4).iterrows(): print(f"   {x.ts:%y%m%d} {x.idx} {x.summary[:70]}")
    t = r.text; print("   >", t[:240])
