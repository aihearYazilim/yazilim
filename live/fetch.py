"""İndirme yardımcıları (yalnızca herkese açık kaynaklar) + live/cache/ altında önbellek."""
import json, time, pathlib, urllib.request, urllib.error, datetime as dt
import pandas as pd

CACHE = pathlib.Path(__file__).resolve().parent / "cache"
CACHE.mkdir(exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0"}


def get(url, tries=5, timeout=30):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(5 * (k + 1) if e.code == 429 else 1.5)
        except Exception:
            time.sleep(1.5 * (k + 1))
    return None


def fresh(f, max_age_h):
    return f.exists() and (time.time() - f.stat().st_mtime) < max_age_h * 3600


def cached_json(name, url, max_age_h=4):
    f = CACHE / name
    if fresh(f, max_age_h):
        return json.loads(f.read_text())
    raw = get(url)
    if raw is None:
        if f.exists(): return json.loads(f.read_text())   # eski önbellek, ağ hatası
        raise RuntimeError(f"indirilemedi: {url}")
    j = json.loads(raw); f.parent.mkdir(parents=True, exist_ok=True); f.write_text(json.dumps(j))
    return j


# ---------------- Yahoo v8 chart ----------------
def yahoo_chart(symbol, rng="2y", max_age_h=6, sub="yahoo"):
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?range={rng}&interval=1d&events=div%2Csplit"
    return cached_json(f"{sub}/{symbol}_{rng}.json", url, max_age_h)


def yahoo_bist_df(j):
    """research/bist_all/download.fetch ile aynı dönüşüm: İstanbul saatine göre gün, adj_ratio = adjclose/close."""
    res = (j.get("chart") or {}).get("result")
    if not res or not res[0].get("timestamp"): return None
    r = res[0]; q = r["indicators"]["quote"][0]
    idx = pd.to_datetime(r["timestamp"], unit="s").tz_localize("UTC").tz_convert("Europe/Istanbul").normalize().tz_localize(None)
    df = pd.DataFrame({k: q.get(k) for k in ["open", "high", "low", "close", "volume"]}, index=idx)
    adj = r["indicators"].get("adjclose", [{}])[0].get("adjclose")
    if adj is not None: df["adj_ratio"] = pd.Series(adj, index=df.index) / df["close"]
    return df[~df.index.duplicated(keep="last")].dropna(subset=["close"])


# ---------------- Borsa İstanbul VİOP günlük bülteni ----------------
def viop_bulletin(day):
    f = CACHE / "viop" / f"viop_{day:%Y%m%d}.csv"
    if f.exists() and f.stat().st_size > 1000:
        return f.read_bytes()
    raw = get(f"https://www.borsaistanbul.com/data/vadeli/viop_{day:%Y%m%d}.csv", tries=2)
    if raw is None or not raw.startswith(b"TARIH"): return None
    f.parent.mkdir(parents=True, exist_ok=True); f.write_bytes(raw)
    return raw


def viop_usdtry(asof, back=10):
    """en son yayınlanmış bültenden F_USDTRYmmyy satırları (research/try_carry_audit/parse_viop.py ile aynı ayrıştırma)."""
    for k in range(back):
        d = asof - dt.timedelta(days=k)
        if d.weekday() >= 5: continue
        raw = viop_bulletin(d)
        if raw is None: continue
        rows = []
        for ln in raw.decode("cp1254", errors="replace").splitlines()[1:]:
            p = ln.split(";")
            if len(p) >= 20 and p[1].startswith("F_USDTRY"): rows.append(p[:22])
        cols = ["date", "code", "name", "mkt", "seg", "typ", "cls", "und", "expiry", "settle", "prev_settle", "chg", "open",
                "low", "high", "close", "vwap", "value", "prem", "qty", "ntr", "oi"]
        df = pd.DataFrame(rows, columns=cols[:len(rows[0])] if rows else cols)
        if df.empty: continue
        for c in ["settle", "prev_settle", "open", "low", "high", "close", "qty", "oi"]:
            if c in df: df[c] = pd.to_numeric(df[c].str.replace(",", "."), errors="coerce")
        df["date"] = pd.to_datetime(df["date"]); df["expiry"] = pd.to_datetime(df["expiry"])
        return df[df.code.str.match(r"^F_USDTRY\d{4}$")].sort_values("expiry")
    return None


# ---------------- Deribit public API ----------------
DRB = "https://www.deribit.com/api/v2/public/"


def deribit(method, max_age_h=0.25, **params):
    q = "&".join(f"{k}={v}" for k, v in params.items())
    name = f"deribit/{method}_{'_'.join(str(v) for v in params.values())}.json".replace(":", "")
    return cached_json(name, f"{DRB}{method}?{q}", max_age_h)["result"]


def deribit_dvol(cur, days=420):
    end = int(time.time() * 1000); start = end - days * 86400 * 1000
    out = []; e = end
    for _ in range(20):
        r = cached_json(f"deribit/dvol_{cur}_{e // 3600000}.json",
                        f"{DRB}get_volatility_index_data?currency={cur}&start_timestamp={start}&end_timestamp={e}&resolution=1D", 1)
        out += r["result"]["data"]
        if not r["result"].get("continuation"): break
        e = r["result"]["continuation"]
    df = pd.DataFrame(out, columns=["ts", "open", "high", "low", "close"]).drop_duplicates("ts").sort_values("ts")
    df.index = pd.to_datetime(df.ts, unit="ms").dt.normalize()    # araştırma: options/dl.py (UTC gün etiketi = mum açılışı)
    return df.close


# ---------------- worldgovernmentbonds.com tarihsel getiri API'si (research/cash_upgrade/raw ile aynı kaynak) ----------------
WGB = "https://www.worldgovernmentbonds.com/wp-json/common/v1/historical"
WGB_TENOR = {3: "3 Months", 6: "6 Months", 12: "1 Year", 24: "2 Years"}


def wgb_history(months=3, max_age_h=6):
    """Türkiye 'months' aylık DİBS getirisi (basit yıllık %), günlük pd.Series. Sayfanın kendi POST çağrısı
    (common.js -> common_getHistorical); Origin başlığı olmadan 403 döner."""
    f = CACHE / "wgb" / f"tr_{months}m.json"
    j = None
    if fresh(f, max_age_h):
        j = json.loads(f.read_text())
    else:
        gv = {"JS_VARIABLE": "jsGlobalVars", "FUNCTION": "Bond", "DOMESTIC": True, "ENDPOINT": WGB, "DATE_RIF": "2099-12-31",
              "OBJ": {"UNIT": "%", "DECIMAL": 3, "UNIT_DELTA": "bp", "DECIMAL_DELTA": 1},
              "COUNTRY1": {"SYMBOL": "13", "PAESE": "Turkey", "PAESE_UPPERCASE": "TURKEY", "BANDIERA": "tr", "URL_PAGE": "turkey"},
              "COUNTRY2": None, "OBJ1": {"DURATA_STRING": WGB_TENOR[months], "DURATA": months}, "OBJ2": None}
        hdr = dict(UA, **{"Content-Type": "application/json", "Origin": "https://www.worldgovernmentbonds.com",
                          "Referer": "https://www.worldgovernmentbonds.com/bond-historical-data/turkey/"})
        for k in range(3):
            try:
                req = urllib.request.Request(WGB, data=json.dumps({"GLOBALVAR": gv}).encode(), headers=hdr, method="POST")
                with urllib.request.urlopen(req, timeout=30) as r:
                    j = json.loads(r.read())
                if (j or {}).get("result", {}).get("quote"): break
                j = None
            except Exception:
                time.sleep(1.5 * (k + 1))
        if j is not None:
            f.parent.mkdir(parents=True, exist_ok=True); f.write_text(json.dumps(j))
        elif f.exists():
            j = json.loads(f.read_text())           # eski önbellek, ağ hatası
        else:
            return None
    q = j["result"]["quote"].values()
    s = pd.Series({pd.Timestamp(x["DATA_VAL"]): float(x["CLOSE_VAL"]) for x in q}).sort_index()
    return s[~s.index.duplicated(keep="last")]
