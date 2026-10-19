"""Yahoo XU100/XU030 uzun geçmiş -> csv (2020-07-27 sıfır atma düzeltmesi dahil)."""
import json, pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent
def load(sym):
    j = json.load(open(H/f"raw/{sym}.json"))["chart"]["result"][0]
    q = j["indicators"]["quote"][0]
    df = pd.DataFrame({k: q[k] for k in ["open","high","low","close","volume"]},
                      index=pd.to_datetime(j["timestamp"], unit="s").tz_localize("UTC").tz_convert("Europe/Istanbul").tz_localize(None).normalize())
    df = df[~df.index.duplicated(keep="last")].dropna(subset=["close"])
    return df
if __name__ == "__main__":
    for s in ["XU100.IS","XU030.IS"]:
        d = load(s)
        r = d.close.pct_change()
        print(s, d.index[0], d.index[-1], len(d)); print(r[abs(r)>0.12])
        d.to_csv(H/f"raw/{s.split('.')[0]}.csv")
