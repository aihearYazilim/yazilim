"""KAP: pasif (işlem görmeyen/delist) IGS üyelerinin ÖDA bildirim listesi (hayatta kalma yanlılığını gidermek için)."""
import json, time, pathlib, urllib.request, pandas as pd
H = pathlib.Path(__file__).parent; R = H/"raw"/"oda_passive"; R.mkdir(parents=True, exist_ok=True)
OIDS = [x["mkkMemberOid"] for x in json.load(open(H/"raw/passive_igs.json"))]
def q(fr, to, oids):
    body = {"fromDate": fr, "toDate": to, "memberType": "IGS", "mkkMemberOidList": [], "inactiveMkkMemberOidList": oids,
            "disclosureClass": "ODA", "subjectList": [], "isLate": "", "mainSector": "", "sector": "", "subSector": "",
            "marketOid": "", "index": "", "bdkReview": "", "bdkMemberOidList": [], "year": "", "term": "", "ruleType": "",
            "period": "", "fromSrc": False, "srcCategory": "", "disclosureIndexList": []}
    for k in range(6):
        try:
            req = urllib.request.Request("https://www.kap.org.tr/tr/api/disclosure/members/byCriteria",
                data=json.dumps(body).encode(), headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json", "Accept-Language": "tr"})
            return json.loads(urllib.request.urlopen(req, timeout=90).read())
        except Exception as e:
            print("retry", fr, e, flush=True); time.sleep(5*(k+1))
    raise RuntimeError(fr)
def chunk(a, b):
    out = q(f"{a:%Y-%m-%d}", f"{b:%Y-%m-%d}", OIDS)
    if len(out) >= 1990 and b > a:
        m = (a + (b - a) / 2).normalize(); return chunk(a, m) + chunk(m + pd.Timedelta(days=1), b)
    return out
if __name__ == "__main__":
    for a in pd.date_range("2019-01-01", "2026-10-01", freq="QS"):
        f = R/f"{a:%Y-%m-%d}.json"
        if f.exists(): continue
        b = min(a + pd.offsets.QuarterEnd(0), pd.Timestamp("2026-10-17"))
        out = chunk(a, b); json.dump(out, open(f, "w"), ensure_ascii=False); print(a.date(), len(out), flush=True); time.sleep(1)
