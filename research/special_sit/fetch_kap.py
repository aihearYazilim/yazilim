"""KAP bildirim listesi: özel durum konuları (birleşme, ortaklıktan çıkarma, pay alım teklifi) aylık parçalarla."""
import json, sys, time, pathlib, urllib.request, pandas as pd
H = pathlib.Path(__file__).parent; R = H/"raw"/"kap"; R.mkdir(parents=True, exist_ok=True)
SUBJ = {"merger": "4028328d5988e2630159d5ff460b200c", "squeeze": "8aca490d5094db30015094ec127c005a",
        "tofform": "8aca490d4f2c5b17014f2c8798b0017b", "tofcollect": "8aca490d505638d60150564a38c8001e",
        "demerger": "4028328d5988e2630159d5e90bc21e73", "fonrapor": "8aca490d4f303c4d014f3075e0e90074"}
def q(fr, to, subj, mt="IGS"):
    body = {"fromDate": fr, "toDate": to, "memberType": mt, "mkkMemberOidList": [], "inactiveMkkMemberOidList": [],
            "disclosureClass": "", "subjectList": [subj], "isLate": "", "mainSector": "", "sector": "", "subSector": "",
            "marketOid": "", "index": "", "bdkReview": "", "bdkMemberOidList": [], "year": "", "term": "", "ruleType": "",
            "period": "", "fromSrc": False, "srcCategory": "", "disclosureIndexList": []}
    for k in range(5):
        try:
            req = urllib.request.Request("https://www.kap.org.tr/tr/api/disclosure/members/byCriteria",
                data=json.dumps(body).encode(), headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json", "Accept-Language": "tr"})
            return json.loads(urllib.request.urlopen(req, timeout=60).read())
        except Exception as e:
            print("retry", fr, e); time.sleep(3*(k+1))
    raise SystemExit("fail " + fr)
if __name__ == "__main__":
    for name in sys.argv[1:]:
        for y in range(2019, 2027):
            f = R/f"{name}_{y}.json"
            if f.exists(): continue
            out = []
            for m in pd.date_range(f"{y}-01-01", f"{y}-12-01", freq="QS"):
                e = min(m + pd.offsets.QuarterEnd(0), pd.Timestamp("2026-10-17"))
                if m > e: continue
                out += q(f"{m:%Y-%m-%d}", f"{e:%Y-%m-%d}", SUBJ[name]); time.sleep(0.3)
            json.dump(out, open(f, "w"), ensure_ascii=False)
            print(name, y, len(out), flush=True)
