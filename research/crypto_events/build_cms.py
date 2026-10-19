"""Parse Binance CMS announcements into events: monitoring-tag additions (MON), spot delist (DEL),
spot listing of tokens that already have a USDT-M perp (LIST), futures-perp delist (FDEL)."""
import json, re, pathlib, pandas as pd
H = pathlib.Path(__file__).parent
perp_first = {}
P = pd.read_pickle(H.parent / "fresh/nl_panels.pkl")["close"]
fv = P.apply(lambda s: s.first_valid_index()); lv = P.apply(lambda s: s.last_valid_index())
arts = {}
for c in [161, 48, 49, 93]:
    for a in json.load(open(H / f"raw/cms_{c}.json")):
        arts[a["code"]] = a
def toks(s):
    s = re.sub(r"\bon \d{4}-\d{2}-\d{2}.*$", "", s)
    s = s.replace(" and ", ",").replace("&", ",")
    return [t.strip().upper() for t in s.split(",") if re.fullmatch(r"[A-Za-z0-9]{1,15}", t.strip())]
rows = []
for a in arts.values():
    t = a["title"]; ts = pd.to_datetime(a["releaseDate"], unit="ms")
    m = re.search(r"Monitoring Tag to (?:Include )?(.*?)(?:, (?:and )?Remove|$)", t)
    if m and "Extend" in t:
        for k in toks(m.group(1)): rows.append(("MON", k, ts, t))
    m = re.match(r"Binance Will Delist (.*)", t)
    if m:
        for k in toks(m.group(1)): rows.append(("DEL", k, ts, t))
    if re.match(r"Binance (Will|Announced).*\bList\b", t) and "Delist" not in t and "Futures" not in t and "Margin" not in t:
        for k in re.findall(r"\(([A-Za-z0-9]{1,15})\)", t): rows.append(("LIST", k.upper(), ts, t))
    m = re.search(r"Futures Will Delist (?:USDⓈ-M |USDⓈ-Margined )?(.*?) (?:Perpetual|Contracts)", t)
    if m:
        for k in re.findall(r"([A-Z0-9]{2,20})USDT", m.group(1)): rows.append(("FDEL", k, ts, t))
E = pd.DataFrame(rows, columns=["type", "tok", "ts", "title"]).drop_duplicates(["type", "tok", "ts"])
syms = []
for k in E.tok:
    c = [s for s in (k + "USDT", "1000" + k + "USDT") if s in P.columns]
    syms.append(c[0] if c else None)
E["sym"] = syms
E = E.dropna(subset=["sym"])
# perp must have traded >= 3 days before the announcement and still trade at announcement
E = E[[(fv[s] <= ts - pd.Timedelta(days=3)) and (lv[s] >= ts.normalize()) for s, ts in zip(E.sym, E.ts)]]
E = E[(E.ts >= "2020-01-01") & (E.ts < "2026-10-17")].sort_values("ts")
E.to_csv(H / "cms_events.csv", index=False)
print(E.groupby(["type", E.ts.dt.year]).size().unstack(0))
