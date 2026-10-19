"""İş Yatırım HisseTekil ham+düzeltilmiş fiyat -> prices/<T>.csv (events/fetch_px.py ile aynı format)."""
import sys, pathlib, shutil
from concurrent.futures import ThreadPoolExecutor
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H.parent/"events"))
import fetch_px as F
F.P = H/"prices"; F.P.mkdir(exist_ok=True)
def one(t):
    src = H.parent/"events"/"prices"/f"{t}.csv"
    if src.exists() and not (F.P/f"{t}.csv").exists(): shutil.copy(src, F.P/f"{t}.csv"); return t, "copy"
    return t, F.fetch(t)
if __name__ == "__main__":
    ts = sys.argv[1:] if len(sys.argv) > 1 else [l.strip() for l in sys.stdin if l.strip()]
    with ThreadPoolExecutor(4) as ex:
        for t, s in ex.map(one, ts): print(t, s, flush=True)
