"""Yahoo chart JSON -> CSV (adjclose varsa onu kullan)."""
import json, sys, pathlib, pandas as pd
d = pathlib.Path(__file__).parent / "data"
for f in sorted(d.glob("raw_*.json")):
    j = json.loads(f.read_text())["chart"]["result"][0]
    ts = pd.to_datetime(j["timestamp"], unit="s").normalize()
    q = j["indicators"]["quote"][0]
    close = j["indicators"].get("adjclose", [{}])[0].get("adjclose") or q["close"]
    s = pd.Series(close, index=ts, name="close").dropna()
    s = s[~s.index.duplicated(keep="last")]
    name = f.stem[4:].replace("=F", "_F")
    s.to_frame().to_csv(d / f"{name}.csv")
    print(name, s.index[0].date(), s.index[-1].date(), len(s))
