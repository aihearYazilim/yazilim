"""Fetch article bodies for delisting notices whose titles do not name the tokens (OKX 'several/selected spot',
Bitget 'Notice of Delisting N Spot Trading Pairs'). Saves raw/bodies.json {key: [pairs]}."""
import re, json, time, pathlib, urllib.request, urllib.error, concurrent.futures as cf
R = pathlib.Path(__file__).parent / "raw"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
def get(u, cookie=None):
    h = {"User-Agent": UA}
    if cookie: h["Cookie"] = cookie
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=40).read().decode("utf8", "ignore")
        except urllib.error.HTTPError as e:
            if e.code == 404: return ""
            time.sleep(2 + 3 * i)
        except Exception: time.sleep(2 + 3 * i)
    return ""
PAIR = re.compile(r"\b([A-Z0-9]{1,15}/(?:USDT|USDC|USD|BTC|ETH|EUR|TRY))\b")
jobs = []
for a in json.load(open(R / "okx_announcements-delistings.json")):
    t = a["title"].lower()
    if "spot" in t and "delist" in t and "postpone" not in t:
        jobs.append(("okx:" + a["slug"], f"https://www.okx.com/help/{a['slug']}", "mkt=global; locale=en_US", "okx"))
for a in json.load(open(R / "bitget_delistings.json")):
    t = a["title"].lower()
    if "delist" in t and "spot" in t and "bot" not in t and "margin" not in t and "futures" not in t:
        jobs.append(("bg:" + a["id"], f"https://www.bitget.com/support/articles/{a['id']}", None, "bg"))
def one(j):
    key, u, ck, v = j; s = get(u, ck)
    if v == "bg":
        m = re.search(r'"content":"((?:[^"\\]|\\.)*)"', s)
        s = json.loads('"' + m.group(1) + '"') if m else ""
    else:   # OKX: article body inside JSON 'content' or rendered html; cut related-article lists
        i = s.find("article-body") if "article-body" in s else 0
        s = s[i:]
        for stop in ["Related articles", "relatedArticles", "\"related\""]:
            k = s.find(stop)
            if k > 0: s = s[:k]
    seen = []
    for p in PAIR.findall(s):
        if p not in seen: seen.append(p)
    return key, seen
out = {}
with cf.ThreadPoolExecutor(6) as ex:
    for k, v in ex.map(one, jobs): out[k] = v
json.dump(out, open(R / "bodies.json", "w"), indent=0)
print(len(jobs), sum(1 for v in out.values() if v), "with pairs")
