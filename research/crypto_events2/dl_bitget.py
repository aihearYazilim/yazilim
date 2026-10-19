"""Scrape Bitget help-center sections (New listings 5955813039257, Trading pair delisting 12508313443290).
Embedded JSON: contentId, showTime (ms UTC), title. Public API only covers the last 30 days."""
import re, json, time, pathlib, urllib.request, urllib.error, sys, concurrent.futures as cf
R = pathlib.Path(__file__).parent / "raw"; R.mkdir(exist_ok=True)
HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}
def get(u):
    for i in range(5):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=HDR), timeout=40).read().decode("utf8", "ignore")
        except urllib.error.HTTPError as e:
            if e.code == 404: return ""
            err = e; time.sleep(2 + 3 * i)
        except Exception as e: err = e; time.sleep(2 + 3 * i)
    raise err
PAT = re.compile(r'"simpleResult":\{"contentId":"(\d+)".*?"showTime":"(\d+)","title":"((?:[^"\\]|\\.)*)"')
for name, sec in [("listings", "5955813039257"), ("delistings", "12508313443290")]:
    h1 = get(f"https://www.bitget.com/support/sections/{sec}")
    pages = int(re.search(r'"pages":(\d+)', h1).group(1))
    def one(p): return PAT.findall(get(f"https://www.bitget.com/support/sections/{sec}/{p}") if p > 1 else h1)
    out = {}
    with cf.ThreadPoolExecutor(6) as ex:
        for got in ex.map(one, range(1, pages + 1)):
            for cid, t, ti in got: out[cid] = dict(id=cid, cTime=int(t), title=json.loads('"' + ti + '"'))
    json.dump(list(out.values()), open(R / f"bitget_{name}.json", "w"))
    ts = [v["cTime"] for v in out.values()]
    print(name, pages, len(out), time.strftime("%Y-%m-%d", time.gmtime(min(ts) / 1000)), time.strftime("%Y-%m-%d", time.gmtime(max(ts) / 1000)))
