"""KAP bildirim listesi (Sermaye Artırımı/Azaltımı, Pay geri alım, Kar payı) aylık parçalarla indir."""
import json, sys, time, pathlib, urllib.request, pandas as pd
H = pathlib.Path(__file__).parent; R = H/"raw"/"kap"; R.mkdir(parents=True, exist_ok=True)
SUBJ = {"ca": "4028328d5988e2630159d5fd68661ff4", "buyback": "4028328d6233239a01629b43e4694fae",
        "div": "4028328d5988e2630159d5fb51c81fe6"}
def q(fr, to, subj):
    body = {"fromDate": fr, "toDate": to, "memberType": "IGS", "mkkMemberOidList": [], "inactiveMkkMemberOidList": [],
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
for name in sys.argv[1:]:
    for m in pd.date_range("2019-01-01", "2026-10-31", freq="MS"):
        f = R/f"{name}_{m:%Y-%m}.json"
        if f.exists(): continue
        # 15 günlük parçalar (sayfa limiti ihtimaline karşı)
        out = []
        for a, b in [(m, m+pd.Timedelta(days=14)), (m+pd.Timedelta(days=15), m+pd.offsets.MonthEnd(0))]:
            out += q(f"{a:%Y-%m-%d}", f"{b:%Y-%m-%d}", SUBJ[name]); time.sleep(0.3)
        json.dump(out, open(f, "w"), ensure_ascii=False)
        print(name, m.date(), len(out), flush=True)
