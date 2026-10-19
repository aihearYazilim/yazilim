"""KAP: tüm ÖDA bildirim listesi (özet + konu) haftalık parçalarla, 2019-01-01..2026-10-17. raw/oda/<yyyy-mm-dd>.json"""
import json, time, pathlib, urllib.request, pandas as pd
from concurrent.futures import ThreadPoolExecutor
H = pathlib.Path(__file__).parent; R = H/"raw"/"oda"; R.mkdir(parents=True, exist_ok=True)
def q(fr, to):
    body = {"fromDate": fr, "toDate": to, "memberType": "IGS", "mkkMemberOidList": [], "inactiveMkkMemberOidList": [],
            "disclosureClass": "ODA", "subjectList": [], "isLate": "", "mainSector": "", "sector": "", "subSector": "",
            "marketOid": "", "index": "", "bdkReview": "", "bdkMemberOidList": [], "year": "", "term": "", "ruleType": "",
            "period": "", "fromSrc": False, "srcCategory": "", "disclosureIndexList": []}
    for k in range(6):
        try:
            req = urllib.request.Request("https://www.kap.org.tr/tr/api/disclosure/members/byCriteria",
                data=json.dumps(body).encode(), headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json", "Accept-Language": "tr"})
            return json.loads(urllib.request.urlopen(req, timeout=90).read())
        except Exception as e:
            print("retry", fr, e, flush=True); time.sleep(3*(k+1))
    raise RuntimeError(fr)
def chunk(a, b):
    out = q(f"{a:%Y-%m-%d}", f"{b:%Y-%m-%d}")
    if len(out) >= 1990 and b > a:   # sayfa limiti: ikiye böl
        m = a + (b - a) / 2; m = m.normalize()
        return chunk(a, m) + chunk(m + pd.Timedelta(days=1), b)
    return out
def week(a):
    f = R/f"{a:%Y-%m-%d}.json"
    if f.exists(): return
    b = min(a + pd.Timedelta(days=6), pd.Timestamp("2026-10-17"))
    out = chunk(a, b); json.dump(out, open(f, "w"), ensure_ascii=False); return len(out)
if __name__ == "__main__":
    W = list(pd.date_range("2019-01-01", "2026-10-17", freq="7D"))
    with ThreadPoolExecutor(4) as ex:
        for n, x in enumerate(ex.map(week, W)):
            if n % 20 == 0: print(n, len(W), x, flush=True)
