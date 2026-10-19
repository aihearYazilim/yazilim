"""Download Binance CMS announcement titles + releaseDate (ms UTC) for catalogs 48 (listing), 161 (delisting), 49 (news)."""
import json, urllib.request, pathlib, time, sys
R = pathlib.Path(__file__).parent / "raw"; R.mkdir(exist_ok=True)
U = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId={}&pageNo={}&pageSize=50"
def get(u):
    for i in range(5):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read())
        except Exception as e:
            time.sleep(2 + i * 3); err = e
    raise err
for cat in map(int, sys.argv[1:] or [48, 161, 49]):
    out, p = [], 1
    while True:
        cs = get(U.format(cat, p))["data"]["catalogs"]
        if not cs: break
        d = cs[0]
        arts = d.get("articles") or []
        if not arts: break
        out += arts; p += 1; time.sleep(0.3)
    json.dump(out, open(R / f"cms_{cat}.json", "w"))
    print(cat, len(out), d.get("total"), time.strftime("%Y-%m-%d", time.gmtime(min(a["releaseDate"] for a in out) / 1000)))
