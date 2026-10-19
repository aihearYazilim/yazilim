"""İş Yatırım sermaye artırımları (bedelsiz oran + bölünme/hak kullanım tarihi) — ticker başına."""
import json, glob, time, pathlib, urllib.request, pandas as pd
H = pathlib.Path(__file__).parent; R = H/"raw"/"isy_sermaye"; R.mkdir(parents=True, exist_ok=True)
rows = []
for f in sorted(glob.glob(str(H/"raw"/"kap"/"ca_*.json"))): rows += json.load(open(f))
tick = set()
for r in rows:
    if "bedelsiz" in (r["summary"] or "").lower() and r["stockCodes"]:
        tick |= {t.strip() for t in r["stockCodes"].split(",") if t.strip()}
print(len(tick))
for t in sorted(tick):
    f = R/f"{t}.json"
    if f.exists(): continue
    body = {"hisseKodu": t, "hisseTanimKodu": "", "yil": 0, "zaman": "", "endeksKodu": "09", "sektorKodu": ""}
    for k in range(4):
        try:
            req = urllib.request.Request("https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/StockInfo/CompanyInfoAjax.aspx/GetSermayeArttirimlari",
                  data=json.dumps(body).encode(), headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json; charset=utf-8"})
            d = json.loads(urllib.request.urlopen(req, timeout=60).read())["d"]; open(f, "w").write(d); break
        except Exception as e:
            print("retry", t, e); time.sleep(3*(k+1))
    time.sleep(0.2)
