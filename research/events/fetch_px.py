"""İş Yatırım HisseTekil: ham + düzeltilmiş günlük fiyat. Çıktı prices/<T>.csv
kolonlar: close_raw, vwap_raw, low_raw, high_raw, vol_tl, close_adj; adj = close_adj/close_raw (o gün)."""
import json, sys, time, pathlib, urllib.request, pandas as pd
H = pathlib.Path(__file__).parent; P = H/"prices"; P.mkdir(exist_ok=True)
def get(t, a, b):
    u = f"https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil?hisse={t}&startdate={a}&enddate={b}"
    for k in range(5):
        try:
            d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=90).read())
            return d.get("value") or []
        except Exception as e:
            print("retry", t, e, flush=True); time.sleep(3*(k+1))
    return None
def fetch(t):
    f = P/f"{t}.csv"
    if f.exists(): return "skip"
    v = []
    for a, b in [("01-01-2019", "31-12-2022"), ("01-01-2023", "17-10-2026")]:
        x = get(t, a, b)
        if x is None: return "fail"
        v += x
    if not v: return "empty"
    df = pd.DataFrame(v)
    out = pd.DataFrame({"close_raw": df.HG_KAPANIS, "vwap_raw": df.HG_AOF, "low_raw": df.HG_MIN, "high_raw": df.HG_MAX,
                        "vol_tl": df.HG_HACIM, "close_adj": df.HGDG_KAPANIS})
    out.index = pd.to_datetime(df.HGDG_TARIH, format="%d-%m-%Y"); out.index.name = "date"
    out = out[~out.index.duplicated()].sort_index()
    out.to_csv(f); return len(out)
if __name__ == "__main__":
    ts = sys.argv[1:] if len(sys.argv) > 1 else sorted(p.stem for p in (H/"raw"/"isy_sermaye").glob("*.json"))
    for i, t in enumerate(ts):
        s = fetch(t)
        if i % 25 == 0: print(i, t, s, flush=True)
