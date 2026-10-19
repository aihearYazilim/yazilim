"""Nasdaq earnings calendar per day (eps, epsForecast, surprise) -> raw/earn/YYYY-MM-DD.json"""
import requests, pathlib, time, json, pandas as pd, concurrent.futures as cf
OUT = pathlib.Path(__file__).parent / "raw/earn"
H = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
def get(d):
    f = OUT / f"{d}.json"
    if f.exists(): return d, "c"
    for k in range(5):
        try:
            r = requests.get(f"https://api.nasdaq.com/api/calendar/earnings?date={d}", headers=H, timeout=30)
            if r.status_code == 200:
                j = r.json(); rows = (j.get("data") or {}).get("rows") or []
                json.dump(rows, open(f, "w")); return d, len(rows)
        except Exception: pass
        time.sleep(2 + 4 * k)
    return d, "fail"
if __name__ == "__main__":
    ds = [x.strftime("%Y-%m-%d") for x in pd.bdate_range("2004-10-01", "2026-10-16")]
    with cf.ThreadPoolExecutor(4) as ex:
        res = list(ex.map(get, ds))
    print(sum(1 for _, r in res if r == "fail"), "fails of", len(res))
