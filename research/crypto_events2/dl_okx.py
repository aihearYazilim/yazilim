"""Scrape OKX global help-center announcement sections (embedded JSON has slug,title,publishTime ms UTC).
The v5 support/announcements API only returns the US-market feed from this IP (≈1 year), so we scrape HTML with mkt=global."""
import re, json, time, pathlib, urllib.request, urllib.error, sys
R = pathlib.Path(__file__).parent / "raw"; R.mkdir(exist_ok=True)
HDR = {"User-Agent": "Mozilla/5.0", "Cookie": "mkt=global; locale=en_US"}
def get(u):
    for i in range(5):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=HDR), timeout=40).read().decode("utf8", "ignore")
        except urllib.error.HTTPError as e:
            if e.code == 404: return ""
            err = e; time.sleep(2 + 3 * i)
        except Exception as e: err = e; time.sleep(2 + 3 * i)
    raise err
PAT = re.compile(r'\{"id":"([^"]+)","slug":"[^"]+","title":"((?:[^"\\]|\\.)*)","publishTime":(\d+)')
for sec in sys.argv[1:] or ["announcements-delistings", "announcements-new-listings"]:
    out = {}; p = 1; empty = 0
    while p < 400:
        html = get(f"https://www.okx.com/help/section/{sec}/page/{p}")
        got = [(a, json.loads('"' + b + '"'), int(c)) for a, b, c in PAT.findall(html) if f'"sectionSlug":"{sec}"' in html]
        new = [g for g in got if g[0] not in out]
        for a, b, c in got: out[a] = dict(slug=a, title=b, pTime=c)
        if not new:
            empty += 1
            if empty >= 2: break
        else: empty = 0
        p += 1; time.sleep(0.3)
    json.dump(list(out.values()), open(R / f"okx_{sec}.json", "w"))
    ts = [v["pTime"] for v in out.values()]
    print(sec, len(out), p, time.strftime("%Y-%m-%d", time.gmtime(min(ts) / 1000)), time.strftime("%Y-%m-%d", time.gmtime(max(ts) / 1000)))
