"""Download DefiLlama emission datasets (public bucket defillama-datasets.llama.fi) for protocols whose token
symbol has a Binance USDT-M perp (incl. delisted)."""
import json, urllib.request, pathlib, concurrent.futures as cf
H = pathlib.Path(__file__).parent; R = H / "raw" / "emis"; R.mkdir(parents=True, exist_ok=True)
perps = set(p.stem for p in (H.parent / "carry/data/perp").glob("*.csv"))
idx = list(json.load(open(H / "raw/emissionsIndex.json")).values())[0]
todo = []
LST = json.load(open(H / "raw/emissionsProtocolsList.json"))
for x in idx:
    sym = (x["tokenPrice"][0]["symbol"].upper() if x.get("tokenPrice") else None)
    slug = x.get("protocolSlug")
    if sym and slug and (sym + "USDT") in perps:
        todo.append((slug, sym))
json.dump(todo, open(H / "raw/emis_map.json", "w"))
def f(t):
    o = R / f"{t[0]}.json"
    if o.exists(): return
    for name in [t[0], t[0].split("-")[0]] + [n for n in LST if n.startswith(t[0].split("-")[0])]:
        try:
            o.write_bytes(urllib.request.urlopen(f"https://defillama-datasets.llama.fi/emissions/{name}", timeout=60).read()); return
        except Exception as e:
            pass
    print("MISS", t)
with cf.ThreadPoolExecutor(8) as ex:
    for t, r in zip(todo, ex.map(lambda t: (lambda: f(t))() if True else None, todo)): pass
print(len(todo), todo)
