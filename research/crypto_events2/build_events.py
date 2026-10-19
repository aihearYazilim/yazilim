"""Build non-Binance venue events mapped to the Binance IS_best sleeves:
  DEL  = venue announces spot delisting of token X (X/USDT pair removed)            -> short, 72h, stop 20%
  LIST = venue announces spot listing of X that already has a Binance USDT-M perp     -> short, 720h, stop 20%
(MON has no counterpart outside Binance.) Price venue = Binance USDT-M perp (same symbol mapping as crypto_events);
eligibility = perp traded >=3 days before the announcement and still trading. Flag 'overlap' if Binance itself had a
DEL/MON/LIST/FDEL event on the same symbol within +-7 days (those are not independent observations)."""
import json, re, pathlib, pandas as pd
H = pathlib.Path(__file__).parent; R = H / "raw"; B = H.parent / "crypto_events"
P = pd.read_pickle(H.parent / "fresh/nl_panels.pkl")["close"]
fv = P.apply(lambda s: s.first_valid_index()); lv = P.apply(lambda s: s.last_valid_index())
BOD = json.load(open(R / "bodies.json"))
STABLE = {"USDT", "USDC", "USD", "DAI", "TUSD", "FDUSD", "USDE", "USDS", "PYUSD", "EUR", "BUSD", "USDG", "RLUSD", "U", "USD1"}
rows = []
def add(v, typ, toks, ts, title):
    for k in dict.fromkeys(toks):
        k = k.upper().strip()
        if k and k not in STABLE: rows.append((v, typ, k, ts, title))
# ---- OKX
for a in json.load(open(R / "okx_announcements-delistings.json")):
    t = a["title"]; tl = t.lower(); ts = pd.to_datetime(a["pTime"], unit="ms")
    if "spot" in tl and "delist" in tl and "postpone" not in tl:
        pairs = BOD.get("okx:" + a["slug"], [])
        add("OKX", "DEL", [p.split("/")[0] for p in pairs if p.endswith("/USDT")], ts, t)
BAD = ("perpetual", "futures", "margin", "delist", "expiry", "pre-market", "x-perp", "stock", "earn", "loan", "suspend",
       "delay", "airdrop", "deposit", "withdraw", "index", "jumpstart", "migration", "convert", "equit", "options", "token sale", "postpone")
for a in json.load(open(R / "okx_announcements-new-listings.json")):
    t = a["title"]; tl = t.lower(); ts = pd.to_datetime(a["pTime"], unit="ms")
    if any(b in tl for b in BAD): continue
    if not ("spot" in tl or "now available" in tl or "launches" in tl or "lists" in tl or "now live" in tl or "available soon" in tl or "to list" in tl): continue
    toks = re.findall(r"\(([A-Za-z0-9]{1,15})\)", t)
    toks += re.findall(r"launch ([A-Z0-9]{1,15})/", t) + re.findall(r"list ([A-Z0-9]{1,15})/", t)
    m = re.match(r"(?:OKX (?:to list|lists|Launches) )?([A-Z0-9, &]+?) (?:Now Available|for spot trading|Available Soon)", t)
    if not toks and m: toks = re.split(r"[ ,&]+", m.group(1))
    m = re.match(r"OKX Launches ([A-Z0-9, &]+)$", t)
    if not toks and m: toks = re.split(r"[ ,&]+", m.group(1))
    add("OKX", "LIST", [x for x in toks if x], ts, t)
# ---- Bitget
for a in json.load(open(R / "bitget_delistings.json")):
    t = a["title"]; tl = t.lower(); ts = pd.to_datetime(a["cTime"], unit="ms")
    if not ("delist" in tl and "spot" in tl) or any(b in tl for b in ("bot", "margin", "futures", "delay", "postpone")): continue
    pairs = BOD.get("bg:" + a["id"], [])
    toks = [p.split("/")[0] for p in pairs if p.endswith("/USDT")]
    if not toks:   # title names the pair, e.g. 'Notice of Delisting APECOIN/USDT ...' or 'Bitget Will Delist FDT on ...'
        toks = re.findall(r"([A-Z0-9]{1,15})/USDT", t) or re.findall(r"Delist ([A-Z0-9]{2,15}) on", t)
    add("BG", "DEL", toks, ts, t)
BADB = ("futures", "perp", "pre-market", "launchpool", "poolx", "candybomb", "launchx", "deposit", "withdraw", "stock",
        "copy trading", "bot", "margin", "earn", "airdrop", "hard fork", "upgrade", "resumption", "suspension", "options",
        "delist", "rebase", "competition", "loan", "onchain", "adds", "trading pair")
for a in json.load(open(R / "bitget_listings.json")):
    t = a["title"]; tl = t.lower(); ts = pd.to_datetime(a["cTime"], unit="ms")
    if any(b in tl for b in BADB) or not ("list" in tl): continue
    toks = re.findall(r"\(([A-Za-z0-9]{1,15})\)", t) or re.findall(r"[Ll]isted [Cc]oin: ?([A-Z0-9]{1,15})", t)
    m = re.match(r"Bitget (?:Will )?Lists? ([A-Z0-9]{2,15}(?:, ?[A-Z0-9]{2,15})*)(?: in| and|$)", t)
    if not toks and m: toks = re.split(r", ?", m.group(1))
    add("BG", "LIST", toks, ts, t)
# ---- Upbit (trading-start proxy)
up = pd.read_csv(R / "upbit_krw_first.csv", parse_dates=["first_1h"]) if (R / "upbit_krw_first.csv").exists() else pd.DataFrame()
for _, u in up.iterrows():
    add("UPBIT", "LIST", [u.tok], u.first_1h, "Upbit KRW market first 1h candle (proxy)")
E = pd.DataFrame(rows, columns=["venue", "type", "tok", "ts", "title"]).sort_values("ts")
E = E.drop_duplicates(["venue", "type", "tok", E.ts.dt.normalize().name if False else "ts"])
# one event per (venue,type,token) within 30 days (re-announcements / reminders)
keep, last = [], {}
for i, e in E.iterrows():
    k = (e.venue, e.type, e.tok)
    if k in last and e.ts - last[k] < pd.Timedelta(days=30): continue
    last[k] = e.ts; keep.append(i)
E = E.loc[keep]
syms = []
for k in E.tok:
    c = [s for s in (k + "USDT", "1000" + k + "USDT") if s in P.columns]
    syms.append(c[0] if c else None)
E["sym"] = syms
n_all = E.groupby(["venue", "type"]).size()
E = E.dropna(subset=["sym"])
E = E[[(pd.notna(fv[s]) and fv[s] <= ts - pd.Timedelta(days=3)) and (lv[s] >= ts.normalize()) for s, ts in zip(E.sym, E.ts)]]
E = E[(E.ts >= "2020-01-01") & (E.ts < "2026-10-17")]
# ticker-collision / relist guard for delistings: drop if X/USDT is still live on that venue today
bg_live = {x["symbol"] for x in json.load(open(R / "bitget_spot_symbols.json"))["data"] if x["status"] == "online"}
okx_live = {x["instId"] for x in json.load(open(R / "okx_spot_instruments.json"))["data"] if x["state"] == "live"}
still = [ts < pd.Timestamp("2026-10-01") and ((v == "BG" and k + "USDT" in bg_live) or (v == "OKX" and k + "-USDT" in okx_live)) for v, k, ts in zip(E.venue, E.tok, E.ts)]
E["still_live"] = still
print("DEL dropped as still live on venue:", E[(E.type == "DEL") & E.still_live].groupby("venue").tok.apply(list).to_dict())
E = E[~((E.type == "DEL") & E.still_live)]
CE = pd.read_csv(B / "cms_events.csv", parse_dates=["ts"])
CE = CE[CE.type.isin(["DEL", "MON", "LIST", "FDEL"])]
E["overlap"] = [bool(((CE.sym == s) & ((CE.ts - ts).abs() <= pd.Timedelta(days=7))).any()) for s, ts in zip(E.sym, E.ts)]
E.to_csv(H / "venue_events.csv", index=False)
pd.set_option("display.width", 200)
print("parsed (all tokens):"); print(n_all.to_string())
print("eligible (Binance perp exists):"); print(E.groupby(["venue", "type", "overlap"]).size().unstack().to_string())
print(E.groupby(["venue", "type", E.ts.dt.year]).size().unstack().fillna(0).astype(int).to_string())
