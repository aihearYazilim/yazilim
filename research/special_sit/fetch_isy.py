"""İş Yatırım sermaye artırımları/temettü tablosu, ticker başına -> raw/isy_sermaye/<T>.json"""
import json, sys, time, pathlib, urllib.request
from concurrent.futures import ThreadPoolExecutor
H = pathlib.Path(__file__).parent; R = H/"raw"/"isy_sermaye"; R.mkdir(parents=True, exist_ok=True)
def one(t):
    f = R/f"{t}.json"
    if f.exists(): return
    body = {"hisseKodu": t, "hisseTanimKodu": "", "yil": 0, "zaman": "", "endeksKodu": "09", "sektorKodu": ""}
    for k in range(4):
        try:
            req = urllib.request.Request("https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/StockInfo/CompanyInfoAjax.aspx/GetSermayeArttirimlari",
                  data=json.dumps(body).encode(), headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json; charset=utf-8"})
            d = json.loads(urllib.request.urlopen(req, timeout=60).read())["d"]; f.write_text(d); return
        except Exception as e:
            print("retry", t, e, flush=True); time.sleep(3*(k+1))
if __name__ == "__main__":
    ts = sys.argv[1:] or sorted(p.stem for p in (H.parents[1]/"data"/"bist_all").glob("*.csv"))
    with ThreadPoolExecutor(4) as ex: list(ex.map(one, ts))
    print("done", len(list(R.glob("*.json"))))
