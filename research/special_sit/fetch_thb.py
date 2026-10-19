"""Borsa İstanbul günlük pay piyasası bülteni (thb*.zip) -> raw/thb/<date>.csv.gz (EQT + RGT satırları).
Hayatta kalma yanlılığı yok: delist olmuş hisseler ve rüçhan hakkı kuponları (.R) dahil."""
import io, zipfile, gzip, time, pathlib, urllib.request, pandas as pd
from concurrent.futures import ThreadPoolExecutor
H = pathlib.Path(__file__).parent; R = H/"raw"/"thb"; R.mkdir(parents=True, exist_ok=True)
def one(d):
    f = R/f"{d:%Y%m%d}.csv.gz"; miss = R/f"{d:%Y%m%d}.none"
    if f.exists() or miss.exists(): return
    u = f"https://www.borsaistanbul.com/data/thb/{d:%Y}/{d:%m}/thb{d:%Y%m%d}1.zip"
    for k in range(4):
        try:
            b = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
            z = zipfile.ZipFile(io.BytesIO(b)); raw = z.read(z.namelist()[0]).decode("latin-1")
            lines = raw.splitlines(); keep = lines[:2] + [l for l in lines[2:] if ";MSPOTEQT" in l or ";MSPOTRGT" in l or ";PRMKTEQT" in l]
            gzip.open(f, "wt", encoding="utf8").write("\n".join(keep)); return
        except urllib.error.HTTPError as e:
            if e.code == 404: miss.touch(); return
            time.sleep(3*(k+1))
        except Exception as e:
            time.sleep(3*(k+1))
    print("fail", d, flush=True)
if __name__ == "__main__":
    days = [d for d in pd.bdate_range("2019-01-01", "2026-10-16")]
    with ThreadPoolExecutor(6) as ex: list(ex.map(one, days))
    print("done", len(list(R.glob("*.csv.gz"))))
