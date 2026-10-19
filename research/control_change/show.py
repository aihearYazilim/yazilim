import sys, re, pathlib, pandas as pd
from classify import body
D = pd.read_pickle(pathlib.Path(__file__).parent/"raw/oda_all.pkl").drop_duplicates("disclosureIndex").set_index("disclosureIndex")
N = int(sys.argv[1]); 
for i in sys.argv[2:]:
    i = int(i); r = D.loc[i]; p = pathlib.Path(f"raw/disc/{i}.txt")
    t = re.sub(r"\s+", " ", body(p.read_text()).replace("oda_ExplanationTextBlock|", "")) if p.exists() else "MISSING"
    t = t.split(" In contradiction")[0]
    pr = re.findall(r"[^.;]{0,60}(?:pay başına|hisse başına|beher|nominal değerli (?:her bir )?pay)[^.;]{0,80}", t, re.I)[:3]
    print(f"## {i} {r.publishDate} {r.stockCodes} | {str(r.summary)[:90]}\n{t[:N]}\n  PRICE: {pr}\n")
