"""5) Kripto olay kısaları (BİLGİ AMAÇLI / isteğe bağlı uydu kol; TOP3 #2 ve #3'te %10, #1'de %0).
Kural = crypto_events_audit senaryo B, s=0.10 (combo_v6 EVT kolu; research/crypto_events/{trades,combo}.py +
crypto_events_audit/{exec1m,port_fix}.py):
  * Binance duyuruları (CMS API, dl_cms.py ile aynı uç nokta; katalog 161/48/49/93), başlık ayrıştırma build_cms.py ile aynı:
      MON  "Monitoring Tag ... (Include) X" ('Extend' içeren başlık)  -> KISA, 168 saat tut, stop +%50
      DEL  "Binance Will Delist X, Y"                                 -> KISA,  72 saat tut, stop +%20
      LIST "Binance Will List ... (X)" (perp'i ZATEN olan token)      -> KISA, 720 saat tut, stop +%20
      (FDEL = vadeli delist işlem görmez)
    Giriş: duyurudan sonraki ilk TAM saat mumunun açılışı (UTC), %0.5 kayma; stop kayması %1.  Perp duyurudan >= 3 gün önce
    işlem görüyor ve hâlâ işlem görüyor olmalı.  (Araştırma ilk 1-2 gün 1 dakikalık mumlarla stop kontrol etti; burada 1 saatlik.)
  * Token kilit açılımları (DefiLlama emissions, dl_emis.py / build_unlocks.py ile aynı): cliff açılımı (noncirculating hariç)
    / önceki gün toplam açılmış arz >= %10 -> açılım gününden (UTC) 10 gün ÖNCE günlük kapanışta KISA, 3 gün SONRA kapanışta
    kapat, stop +%100.  Perp açılımdan >= 30 gün önce listelenmiş olmalı; BTC/ETH/BNB/DOGE/LTC/TRX hariç.
  * Boyut: işlem başı 0.10 x kol özsermayesi; işlem <= %1 x 7 günlük ortalama perp USDT hacmi (bu s'nin %20'sinden azsa atla);
    toplam açık kısa <= 2 x özsermaye; aynı sembolde ikinci pozisyon yok; BTCUSDT perp UZUN = açık kısaların toplamı (günlük).
"""
import re, datetime as dt
import numpy as np, pandas as pd
import config as C, fetch as FX

P = C.EVENTS
CMS = "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId={}&pageNo=1&pageSize=50"
FAPI = "https://www.binance.com/fapi/v1/"          # fapi.binance.com bu ağdan 451 veriyor; www.binance.com/fapi aynı API
LLAMA = "https://defillama-datasets.llama.fi/"
SKIP = {"BTC", "ETH", "BNB", "DOGE", "LTC", "TRX"}


# ---------------- veri ----------------
def perps():
    j = FX.cached_json("events/exchangeInfo.json", FAPI + "exchangeInfo", 6)
    out = {}
    for s in j["symbols"]:
        if s.get("contractType") == "PERPETUAL" and s.get("quoteAsset") == "USDT" and s.get("status") == "TRADING":
            out[s["symbol"]] = pd.to_datetime(s["onboardDate"], unit="ms")
    return out


def sym_for(tok, PP):
    for s in (tok + "USDT", "1000" + tok + "USDT"):
        if s in PP: return s
    return None


def klines(sym, interval, start_ms=None, limit=1000, max_age_h=0.5):
    q = f"symbol={sym}&interval={interval}&limit={limit}" + (f"&startTime={start_ms}" if start_ms else "")
    j = FX.cached_json(f"events/k_{sym}_{interval}_{start_ms}_{limit}.json", FAPI + "klines?" + q, max_age_h)
    df = pd.DataFrame(j, columns=["t", "o", "h", "l", "c", "v", "T", "qv", "n", "tb", "tq", "x"]).astype(float)
    df.index = pd.to_datetime(df.t, unit="ms")
    return df[["o", "h", "l", "c", "qv"]]


def vol7(sym, day):
    """7 günlük ortalama USDT hacmi (giriş gününden önceki 7 gün; trades._vol)."""
    try:
        k = klines(sym, "1d", int((day - pd.Timedelta(days=8)).timestamp() * 1000), 10, 6)
        k = k[(k.index < day) & (k.index >= day - pd.Timedelta(days=7))]
        return float(k.qv.mean()) if len(k) else np.nan
    except Exception:
        return np.nan


def cms_articles(days=7):
    now = pd.Timestamp.now(tz="UTC").tz_localize(None); arts = {}
    for cat in P["cms_catalogs"]:
        try:
            j = FX.cached_json(f"events/cms_{cat}.json", CMS.format(cat), 0.5)
            for c in j["data"]["catalogs"]:
                for a in c.get("articles") or []: arts[a["code"]] = a
        except Exception as e:
            print(f"  !! Binance CMS katalog {cat} alınamadı: {e}")
    rows = [dict(ts=pd.to_datetime(a["releaseDate"], unit="ms"), title=a["title"]) for a in arts.values()]
    df = pd.DataFrame(rows)
    return df[df.ts >= now - pd.Timedelta(days=days)].sort_values("ts") if len(df) else df


def toks(s):
    s = re.sub(r"\bon \d{4}-\d{2}-\d{2}.*$", "", s)
    s = s.replace(" and ", ",").replace("&", ",")
    return [t.strip().upper() for t in s.split(",") if re.fullmatch(r"[A-Za-z0-9]{1,15}", t.strip())]


def classify(t):
    """build_cms.py ile aynı başlık kuralları -> [(tip, token)]"""
    out = []
    m = re.search(r"Monitoring Tag to (?:Include )?(.*?)(?:, (?:and )?Remove|$)", t)
    if m and "Extend" in t: out += [("MON", k) for k in toks(m.group(1))]
    m = re.match(r"Binance Will Delist (.*)", t)
    if m: out += [("DEL", k) for k in toks(m.group(1))]
    if re.match(r"Binance (Will|Announced).*\bList\b", t) and "Delist" not in t and "Futures" not in t and "Margin" not in t:
        out += [("LIST", k.upper()) for k in re.findall(r"\(([A-Za-z0-9]{1,15})\)", t)]
    m = re.search(r"Futures Will Delist (?:USDⓈ-M |USDⓈ-Margined )?(.*?) (?:Perpetual|Contracts)", t)
    if m: out += [("FDEL", k) for k in re.findall(r"([A-Z0-9]{2,20})USDT", m.group(1))]
    return out


# ---------------- CMS kolu ----------------
def cms_events(PP, now):
    A = cms_articles(7); out = []
    for _, a in A.iterrows():
        for typ, tok in classify(a.title):
            e = dict(type=typ, tok=tok, ts=a.ts, title=a.title, sym=sym_for(tok, PP))
            if typ == "FDEL": e["act"] = "işlem yok (vadeli delist kural dışı)"; out.append(e); continue
            if e["sym"] is None: e["act"] = "işlem yok (Binance USDT perp yok)"; out.append(e); continue
            if PP[e["sym"]] > a.ts - pd.Timedelta(days=P["cms_min_age"]):
                e["act"] = "işlem yok (perp < 3 gün)"; out.append(e); continue
            hold, stop = P["book"][typ]
            t_in = a.ts.ceil("h"); t_out = t_in + pd.Timedelta(hours=hold)
            e.update(t_in=t_in, t_out=t_out, stop=stop, vol7=vol7(e["sym"], t_in.normalize()))
            if now < t_in:
                e["act"] = f"KISA aç {t_in:%m-%d %H:%M} UTC açılışında"
            else:
                try:
                    k = klines(e["sym"], "1h", int(t_in.timestamp() * 1000), 1000)
                    k = k[(k.index >= t_in) & (k.index < t_out)]
                    p0 = float(k.o.iloc[0]) * (1 - P["slip_in"]); lvl = p0 * (1 + stop)
                    hit = k[k.h >= lvl]
                    if len(hit):
                        px = max(float(hit.o.iloc[0]), lvl) * (1 + P["slip_stop"])
                        e.update(p0=p0, px=px, pnl=-(px / p0 - 1), act=f"STOP oldu {hit.index[0]:%m-%d %H:%M} UTC")
                    else:
                        px = float(k.c.iloc[-1])
                        e.update(p0=p0, px=px, pnl=-(px / p0 - 1),
                                 act=(f"AÇIK: {t_out:%m-%d %H:%M} UTC'de kapat; stop {lvl:.6g}" if now < t_out else
                                      f"kapandı {t_out:%m-%d %H:%M} UTC (süre doldu)"))
                except Exception as ex:
                    e["act"] = f"fiyat alınamadı ({ex})"
            out.append(e)
    return out


# ---------------- kilit açılımı kolu ----------------
def unlock_events(PP, now, back=3, ahead=24):
    """açılım günü [bugün-back, bugün+ahead] olan >= %10 cliff açılımları (bugün+24 -> giriş bugün+14)."""
    try:
        idx = FX.cached_json("events/emissionsIndex.json", LLAMA + "emissionsIndex", 12)["data"]
    except Exception as ex:
        return None, f"DefiLlama emissionsIndex alınamadı: {ex}"
    today = now.normalize(); lo, hi = today - pd.Timedelta(days=back), today + pd.Timedelta(days=ahead)
    cands = []
    for x in idx:
        sym = x["tokenPrice"][0]["symbol"].upper() if x.get("tokenPrice") else None
        if not sym or sym in SKIP or not x.get("protocolSlug"): continue
        ps = sym_for(sym, PP)
        if ps is None: continue
        byday = {}
        for e in x.get("events") or []:
            if e.get("unlockType") != "cliff" or e.get("category") == "noncirculating": continue
            d = pd.to_datetime(float(e["timestamp"]), unit="s").normalize()
            if lo <= d <= hi: byday[d] = byday.get(d, 0.0) + sum(map(float, e["noOfTokens"]))
        circ = x.get("circSupply") or 0
        for d, n in byday.items():
            if circ > 0 and n / circ >= 0.05: cands.append((x["protocolSlug"], sym, ps, d))   # kaba ön eleme
    out = []
    for slug, sym, ps, d in cands:
        try:
            j = FX.cached_json(f"events/emis_{slug}.json", LLAMA + f"emissions/{slug}", 24)
        except Exception:
            continue
        pct, n, cats = exact_pct(j, d)
        if pct is None or pct < P["unl_thr"]: continue
        e = dict(sym=ps, tok=sym, slug=slug, day=d, pct=pct, tokens=n, cats=cats,
                 entry=d - pd.Timedelta(days=P["unl_pre"]), exit=d + pd.Timedelta(days=P["unl_post"]))
        if PP[ps] > d - pd.Timedelta(days=P["unl_min_age"]):
            e["act"] = "işlem yok (perp < 30 gün)"; out.append(e); continue
        ent_close = e["entry"] + pd.Timedelta(days=1)       # günlük mum kapanışı = ertesi gün 00:00 UTC
        ex_close = e["exit"] + pd.Timedelta(days=1)
        e["vol7"] = vol7(ps, e["entry"] + pd.Timedelta(days=1))
        if now < ent_close:
            e["act"] = f"KISA aç {e['entry']:%m-%d} günlük kapanışında (≈{ent_close:%m-%d} 00:00 UTC)"
        else:
            try:
                k = klines(ps, "1d", int(e["entry"].timestamp() * 1000), 20)
                p0 = float(k.c.iloc[0]); lvl = p0 * (1 + P["unl_stop"]); kk = k.iloc[1:]
                kk = kk[kk.index <= e["exit"]]
                hit = kk[kk.h >= lvl]
                px = float(k.c.iloc[-1]) if not len(hit) else max(float(hit.o.iloc[0]), lvl)
                e.update(p0=p0, px=px, pnl=-(px / p0 - 1))
                e["act"] = ("STOP oldu" if len(hit) else
                            (f"AÇIK: {e['exit']:%m-%d} kapanışında (≈{ex_close:%m-%d} 00:00 UTC) kapat; stop {lvl:.6g}"
                             if now < ex_close else "kapandı (süre doldu)"))
            except Exception as ex:
                e["act"] = f"fiyat alınamadı ({ex})"
        out.append(e)
    return sorted(out, key=lambda e: e["day"]), None


def exact_pct(j, day):
    """build_unlocks.py: o günkü cliff tokenları / önceki gün toplam açılmış arz (tüm bölümler)."""
    try:
        tot = None
        for s in j["documentedData"]["data"]:
            x = pd.Series({pd.to_datetime(r["timestamp"], unit="s").normalize(): r["unlocked"] for r in s["data"]})
            x = x[~x.index.duplicated()]
            tot = x if tot is None else tot.add(x, fill_value=0)
        tot = tot.sort_index()
        nonc = set(j.get("categories", {}).get("noncirculating", []))
        n = 0.0; cats = set()
        for e in j["metadata"].get("events", []):
            if e["unlockType"] != "cliff" or e.get("category") == "noncirculating": continue
            if any(m.lower() in e["description"].lower() for m in nonc): continue
            if pd.to_datetime(float(e["timestamp"]), unit="s").normalize() != day: continue
            n += sum(map(float, e["noOfTokens"])); cats.add(str(e.get("category")))
        prev = tot[tot.index < day]
        if n <= 0 or not len(prev) or prev.iloc[-1] <= 0: return None, 0, ""
        return n / prev.iloc[-1], n, ",".join(sorted(cats))
    except Exception:
        return None, 0, ""


# ---------------- rapor ----------------
def run(now_utc=None):
    now = pd.Timestamp(now_utc or dt.datetime.now(dt.timezone.utc))
    if now.tzinfo is not None: now = now.tz_convert("UTC").tz_localize(None)
    try:
        PP = perps()
    except Exception as ex:
        return dict(err=f"Binance perp listesi alınamadı: {ex}")
    cms = cms_events(PP, now)
    unl, uerr = unlock_events(PP, now)
    return dict(now=now, cms=cms, unl=unl or [], uerr=uerr, nperp=len(PP))


def _size(e, usd):
    if not usd: return ""
    n = P["s"] * usd; v = e.get("vol7", np.nan)
    if not np.isfinite(v): return f" | boyut {n:,.0f} USD (hacim yok)"
    frac = min(1.0, P["liq"] * v / n)
    if frac < P["min_frac"]: return f" | ATLA: %1 x 7g hacim ({v:,.0f} USD) {P['liq'] * v:,.0f} USD < %20 x {n:,.0f}"
    return f" | boyut {n * frac:,.0f} USD (7g hacim {v / 1e6:,.1f}M USD)"


def report(R, sleeves=None):
    """sleeves: {etiket: olay kolu USD}"""
    L = ["--- 5) KRİPTO OLAY KISALARI (BİLGİ AMAÇLI; #2 ve #3'te %10 uydu, #1'de YOK) ---",
         "  !! YASAL GRİ ALAN: SPK III-35/B.2 lisanslı yerli platformlarda kripto türev/açığa satışı yasaklıyor; Binance gibi yabancı "
         "platformlar Türkiye yerleşikleri için gri alan (erişim engeli / hesap riski). Kararı kendiniz verin.",
         "  !! KENAR ZAYIF: OOS işlem kârının ~%90'ı Mart-Mayıs 2026 girişlerinden geldi; o aylar hariç ~+%0.6/ay, Haziran-Eylül 2026 "
         "düz/negatif. Etki ilk saatlerde -> bot/hızlı yürütme gerekir (s=0.1 OOS %4.84/ay USD; giriş +15 dk gecikmeyle %3.93).",
         "  Kural: senaryo B, s=0.10, 2x brüt sınırı, BTC perp hedge (uzun = açık kısalar toplamı). Saatler UTC."]
    if "err" in R: L.append("  !! " + R["err"]); return "\n".join(L)
    usd = list((sleeves or {}).values())[0] if sleeves else None
    if sleeves:
        L.append("  Olay kolu: " + " | ".join(f"{k} {v:,.0f} USD -> işlem başı {P['s'] * v:,.0f} USD, brüt sınır {P['gross'] * v:,.0f} USD"
                                             for k, v in sleeves.items()) + "  (aşağıdaki boyutlar ilk kola göre)")
    L.append(f"  Binance duyuruları, son 7 gün ({len(R['cms'])} olay; MON/DEL/LIST/FDEL):")
    if not R["cms"]: L.append("    (kurala giren duyuru yok)")
    for e in R["cms"]:
        pn = f" | giriş {e['p0']:.6g} son {e['px']:.6g} -> K/Z %{100 * e['pnl']:+.1f}" if "p0" in e else ""
        L.append(f"    {e['ts']:%m-%d %H:%M} {e['type']:4s} {e['tok']:10s} {e['sym'] or '-':14s} {e['act']}{pn}"
                 + (_size(e, usd) if "t_in" in e and ("AÇIK" in e["act"] or "aç" in e["act"]) else ""))
        L.append(f"          \"{e['title'][:110]}\"")
    L.append("  Kilit açılımları >= %10 (açılım günü bugün-3 .. bugün+24; giriş açılımdan 10 gün önce -> önümüzdeki 14 günün girişleri dahil):")
    if R["uerr"]: L.append("    !! " + R["uerr"])
    elif not R["unl"]: L.append("    (kurala giren açılım yok)")
    for e in R["unl"]:
        pn = f" | giriş {e['p0']:.6g} son {e['px']:.6g} -> K/Z %{100 * e['pnl']:+.1f}" if "p0" in e else ""
        L.append(f"    açılım {e['day']:%Y-%m-%d} {e['tok']:8s} {e['sym']:14s} %{100 * e['pct']:.1f} arz ({e['cats']}) "
                 f"giriş {e['entry']:%m-%d} / çıkış {e['exit']:%m-%d}: {e['act']}{pn}"
                 + (_size(e, usd) if ("AÇIK" in e["act"] or "aç" in e["act"]) else ""))
    return "\n".join(L)
