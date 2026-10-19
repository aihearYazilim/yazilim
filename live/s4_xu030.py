"""4) XU030 20Δ/5Δ put spread kolu: VİOP XU030 opsiyonları, 5x nominal, yalnızca ATM IV > son 252 günlük medyan,
ayın 1. VİOP işlem gününde giriş, vadeye kadar tut (research/viop_options #1; combo_v6 XU kolu).

Kural (research/viop_options/lib.py + sim.py + vrp.py ile birebir):
  * Fiyatlar: günlük bülten UZLAŞMA fiyatları (borsaistanbul.com/data/vadeli/viop_YYYYMMDD.csv).
  * IV: Black-76, F = aynı vadeli F_XU030mmyy uzlaşma fiyatı, T = takvim günü/365, iskonto 1/(1+r*T)
    (r = config.CASH['dep_32d_gross']; araştırmada deposit_v5 brüt mevduat tablosu, 2026-10 için aynı %36.4).
    Fiyat <= içsel değer ise IV yok.  Δ = Black-76 deltası (iskontosuz), opsiyonun kendi IV'siyle.
  * ATM IV (vrp.py): vadeye 15-70 gün kalan en yakın vade; |ln(K/F)| en küçük 2 call + 2 put IV ortalaması.
  * Filtre: giriş günü ATM IV > son 252 bülten gününün ATM IV medyanı (bugün dahil, en az 120 gün).
  * Giriş: ayın İLK VİOP işlem günü; vadeye 20-75 gün kalan en yakın vade.
      kısa put: açık pozisyonu ya da hacmi olan putlar arasında |Δ| 0.20'ye en yakın (fark > 0.12 ise işlem yok)
      uzun put: o vadedeki tüm putlar arasında |Δ| 0.05'e en yakın, strike < kısa put strike'ı
  * Boyut: her bacak q0 = 5 x E / F endeks birimi (E = kol özsermayesi), adet = q0 / 10 (aşağı yuvarlanır).
    Teminat yaklaşımı: vadeli x(0.88, 1, 1.12), IV x1.25 senaryolarında spread'in geri alım değerinin en kötüsü;
    teminat > E ise adet orantılı küçültülür.  Vadeye kadar tutulur (nakit uzlaşma).
  * Kapasite (combo_v6): kol <= 1.000.000 TL x XU030(bugün)/XU030(2025-10-16); fazlası TL taşıma+nakit koluna.
ATM IV geçmişi live/cache/xu030_atm.csv'de tutulur; eksik günler önce live/cache/viop/ bültenlerinden, sonra
research/viop_options/raw/opt/ (varsa), en son borsaistanbul.com'dan indirilerek doldurulur.
"""
import gzip, pathlib, concurrent.futures as cf
import numpy as np, pandas as pd
from scipy.stats import norm
import config as C, fetch as FX

ROOT = pathlib.Path(__file__).resolve().parents[1]
RES_RAW = ROOT / "research/viop_options/raw/opt"
HIST = FX.CACHE / "xu030_atm.csv"
P = C.XU030
HOL = set(pd.to_datetime(C.TR_HOLIDAYS))


# ---------------- Black-76 ----------------
def b76(F, K, T, s, cp, df=1.0):
    F, K, T, s = (np.asarray(x, float) for x in (F, K, T, s))
    s = np.maximum(s, 1e-6); T = np.maximum(T, 1e-6)
    d1 = (np.log(F / K) + 0.5 * s * s * T) / (s * np.sqrt(T)); d2 = d1 - s * np.sqrt(T)
    c = df * (F * norm.cdf(d1) - K * norm.cdf(d2)); p = df * (K * norm.cdf(-d2) - F * norm.cdf(-d1))
    return np.where(np.asarray(cp) == "C", c, p)


def delta76(F, K, T, s, cp):
    s = np.maximum(np.asarray(s, float), 1e-6); T = np.maximum(np.asarray(T, float), 1e-6)
    d1 = (np.log(np.asarray(F, float) / np.asarray(K, float)) + 0.5 * s * s * T) / (s * np.sqrt(T))
    return np.where(np.asarray(cp) == "C", norm.cdf(d1), norm.cdf(d1) - 1)


def implied_vol(price, F, K, T, cp, df):
    price, F, K, T, df = (np.asarray(x, float) for x in (price, F, K, T, df)); cp = np.asarray(cp)
    lo = np.full(len(price), 1e-3); hi = np.full(len(price), 5.0)
    for _ in range(60):
        mid = 0.5 * (lo + hi); v = b76(F, K, T, mid, cp, df)
        hi = np.where(v > price, mid, hi); lo = np.where(v > price, lo, mid)
    iv = 0.5 * (lo + hi)
    intr = df * np.where(cp == "C", np.maximum(F - K, 0), np.maximum(K - F, 0))
    iv[(price <= intr + 1e-9) | (iv > 4.9)] = np.nan
    return iv


# ---------------- bülten ayrıştırma ----------------
def _num(x):
    try: return float(x.replace(",", ".")) if x not in ("", None) else np.nan
    except ValueError: return np.nan


def parse_xu(text):
    """bülten metni -> XU030 opsiyonları (O_XU030EmmyyC/PK) ve vadeli F_XU030mmyy satırları."""
    import re
    pat = re.compile(r"^O_XU030E(\d{2})(\d{2})([CP])([\d.]+)$")
    rows = []
    for ln in text.splitlines()[2:]:
        p = ln.split(";")
        if len(p) < 22: continue
        code = p[1]
        if code.startswith("O_XU030E"):
            m = pat.match(code)
            if not m: continue
            kind, cp, K = "O", m.group(3), float(m.group(4))
        elif re.match(r"^F_XU030\d{4}$", code):
            kind, cp, K = "F", "", np.nan
        else:
            continue
        rows.append(dict(date=p[0], code=code, kind=kind, cp=cp, K=K, exp=p[8], settle=_num(p[9]), close=_num(p[15]),
                         qty=_num(p[19]) or 0.0, oi=_num(p[21]) or 0.0))
    if not rows: return None
    df = pd.DataFrame(rows); df["date"] = pd.to_datetime(df.date); df["exp"] = pd.to_datetime(df.exp)
    return df


def chain(df, r=None):
    """opsiyonlara F, T, iskonto, IV, Δ ekler (lib.build ile aynı)."""
    r = C.CASH["dep_32d_gross"] / 100 if r is None else r
    o = df[df.kind == "O"].copy()
    f = df[df.kind == "F"][["exp", "settle", "qty", "oi"]].rename(columns={"settle": "F", "qty": "Fqty", "oi": "Foi"})
    o = o.merge(f, on="exp", how="left")
    o["px"] = o["settle"]
    o["T"] = (o.exp - o.date).dt.days / 365.0
    o["dfac"] = 1 / (1 + r * o["T"])
    ok = o.F.notna() & (o["T"] > 0) & (o.px > 0)
    o["iv"] = np.nan
    if ok.any():
        o.loc[ok, "iv"] = implied_vol(o.loc[ok, "px"], o.loc[ok, "F"], o.loc[ok, "K"], o.loc[ok, "T"], o.loc[ok, "cp"], o.loc[ok, "dfac"])
    o["delta"] = delta76(o.F, o.K, o["T"], o.iv.fillna(0.3), o.cp)
    return o


def atm_iv(o):
    lo, hi = P["atm_dte"]
    x = o[(o["T"] * 365 >= lo) & (o["T"] * 365 <= hi) & o.iv.notna()]
    if x.empty: return None
    x = x[x.exp == x.exp.min()].assign(m=lambda z: np.abs(np.log(z.K / z.F)))
    a = x.sort_values("m").groupby("cp").head(2)
    return dict(iv=float(a.iv.mean()), exp=x.exp.iloc[0], F=float(x.F.iloc[0]))


# ---------------- bülten kaynakları ----------------
def bulletin_text(day, download=True):
    """önce live/cache/viop, sonra research raw/opt (gz, filtrelenmiş), sonra indir (live/cache/viop'a kaydedilir)."""
    f = FX.CACHE / "viop" / f"viop_{day:%Y%m%d}.csv"
    if f.exists() and f.stat().st_size > 1000:
        return f.read_bytes().decode("cp1254", errors="replace")
    g = RES_RAW / f"o_{day:%Y%m%d}.csv.gz"
    if g.exists() and g.stat().st_size > 100:
        with gzip.open(g, "rt", encoding="latin-1") as fh: return fh.read()
    if not download: return None
    raw = FX.viop_bulletin(day)
    return None if raw is None else raw.decode("cp1254", errors="replace")


def latest_bulletin(asof, back=10):
    for k in range(back):
        d = pd.Timestamp(asof) - pd.Timedelta(days=k)
        if d.dayofweek >= 5 or d in HOL: continue
        t = bulletin_text(d)
        if t is not None:
            df = parse_xu(t)
            if df is not None: return d, df
    return None, None


def is_trading(d):
    return d.dayofweek < 5 and d not in HOL


def first_trading_day(y, m):
    d = pd.Timestamp(y, m, 1)
    while not is_trading(d): d += pd.Timedelta(days=1)
    return d


# ---------------- ATM IV geçmişi ----------------
def load_hist():
    if HIST.exists():
        h = pd.read_csv(HIST, parse_dates=["date", "exp"])
        return h.drop_duplicates("date", keep="last").set_index("date").sort_index()
    return pd.DataFrame(columns=["iv", "exp", "F", "src"]).rename_axis("date")


def _hist_row(d, last_known):
    t = bulletin_text(d, download=False)
    src = "cache/research"
    if t is None:
        raw = FX.get(f"https://www.borsaistanbul.com/data/vadeli/viop_{d:%Y%m%d}.csv", tries=2)   # tarihçe: kaydetmeden
        t = raw.decode("cp1254", errors="replace") if raw is not None and raw.startswith(b"TARIH") else None
        src = "indirildi"
    if t is None:
        return dict(date=d, iv=np.nan, exp=pd.NaT, F=np.nan, src="yok" if d < last_known else None)
    df = parse_xu(t)
    a = atm_iv(chain(df)) if df is not None else None
    if a is None: return dict(date=d, iv=np.nan, exp=pd.NaT, F=np.nan, src="atm-yok")
    return dict(date=d, iv=a["iv"], exp=a["exp"], F=a["F"], src=src)


def update_hist(last_day, days_back=800, workers=8):
    """last_day'e kadar eksik günleri doldurur. 'yok' = bülten yayınlanmamış (tatil) -> tekrar denenmez."""
    h = load_hist()
    want = [d for d in pd.bdate_range(last_day - pd.Timedelta(days=days_back), last_day) if d not in h.index]
    if want:
        with cf.ThreadPoolExecutor(workers) as ex:
            rows = [r for r in ex.map(lambda d: _hist_row(d, last_day), want) if r["src"] is not None]
        if rows:
            n = pd.DataFrame(rows).set_index("date")
            h = pd.concat([h, n]).sort_index()
            h = h[~h.index.duplicated(keep="last")]
            h.reset_index().to_csv(HIST, index=False)
    return h


def iv_filter(h, day):
    """day günü (dahil) itibarıyla ATM IV ve son 252 bülten günü medyanı (sim.Data.atm_med ile aynı)."""
    s = h[h.src != "yok"].iv.loc[:day].ffill()
    if s.empty or pd.isna(s.iloc[-1]): return None
    w = s.iloc[-P["iv_look"]:]
    med = float(w.median()) if w.notna().sum() >= P["iv_min"] else np.nan
    return dict(day=s.index[-1], iv=float(s.iloc[-1]), med=med, n=int(w.notna().sum()),
                on=bool(np.isfinite(med) and s.iloc[-1] > med))


# ---------------- strike seçimi ve boyut ----------------
def pick(o, ref_day, why=None):
    """sim.open_pos(struct='PS'): ref_day'e göre 20-75 gün vadeli en yakın vade, 20Δ kısa / 5Δ uzun put.
    why (liste) verilirse işlem çıkmadığında nedeni eklenir."""
    def no(msg):
        if why is not None: why.append(msg)
        return None
    g = o[o.iv.notna() & (o.px > 0)]
    dte = (g.exp - ref_day).dt.days
    g = g[(dte >= P["min_dte"]) & (dte <= P["max_dte"])]
    if g.empty: return no(f"vadeye {P['min_dte']}-{P['max_dte']} gün kalan seri yok")
    e = g.exp.min(); g = g[(g.exp == e) & (g.cp == "P")]
    c = g[(g.oi > 0) | (g.qty > 0)] if P["liq"] == "oi" else g
    if c.empty: return no(f"{e:%Y-%m-%d} vadesinde açık pozisyonu/hacmi olan put yok")
    s = c.iloc[(c.delta.abs() - P["short_delta"]).abs().argmin()]
    if abs(abs(s.delta) - P["short_delta"]) > P["delta_tol"]: return no(f"20Δ'ya yakın put yok (en yakın Δ {s.delta:+.3f})")
    w = g.iloc[(g.delta.abs() - P["wing_delta"]).abs().argmin()]
    if abs(abs(w.delta) - P["wing_delta"]) > P["delta_tol"] or w.K >= s.K:
        return no(f"{e:%Y-%m-%d} vadesinde 5Δ koruma putu listelenmemiş (en düşük strike {g.K.min():,.0f}, Δ {g.loc[g.K.idxmin(), 'delta']:+.3f}; "
                  f"kural: |Δ-0.05| <= 0.12 ve K < kısa put K {s.K:,.0f}) -> borsa daha düşük strike açmazsa İŞLEM YOK")
    return dict(exp=e, F=float(s.F), short=s.to_dict(), wing=w.to_dict(), puts=g.sort_values("K"))


def margin_units(pk, T, F=None):
    """1 birim (q=1 kısa put, q=+1 uzun put) için teminat yaklaşımı: en kötü senaryo geri alım değeri."""
    F = pk["F"] if F is None else F; worst = 0.0
    for sc in (1 - P["scan"], 1.0, 1 + P["scan"]):
        v = 0.0
        for q, lg in ((-1.0, pk["short"]), (1.0, pk["wing"])):
            v += q * float(b76(F * sc, lg["K"], T, lg["iv"] * P["scan_iv"], "P", 1.0))
        worst = min(worst, v)
    return -worst


def size(pk, E, ref_day):
    """E TL kol özsermayesi -> adet ve risk ölçüleri."""
    F, m = pk["F"], P["mult"]; s, w = pk["short"], pk["wing"]
    T = max((pk["exp"] - ref_day).days, 1) / 365
    q0 = P["lev"] * E / F
    mu = margin_units(pk, T)
    if mu * q0 > E: q0 = E / mu                        # teminat > özsermaye -> küçült
    n = int(np.floor(q0 / m + 1e-9)); q = n * m
    prem = q * (s["px"] - w["px"]); cost = q * (s["px"] + w["px"]) * P["cost"]
    width = s["K"] - w["K"]
    gaps = {}
    for g in P["gap"]:
        loss = 0.0
        for sign, lg in ((-1, s), (1, w)):
            new = float(b76(F * (1 + g), lg["K"], T, lg["iv"] * P["gap_iv"], "P", 1.0))
            loss += sign * q * (new - lg["px"])
        gaps[g] = loss
    return dict(E=E, q0_theory=P["lev"] * E / F, n=n, notional=q * F, lev=q * F / E if E else 0.0, margin=mu * q,
                prem=prem, cost=cost, net=prem - cost, maxloss=q * width - (prem - cost), be=s["K"] - (s["px"] - w["px"]),
                gaps=gaps, T=T)


def xu030_level():
    """XU030 son kapanış (Yahoo XU030.IS); yoksa None."""
    try:
        df = FX.yahoo_bist_df(FX.yahoo_chart("XU030.IS", "1mo", max_age_h=6, sub="bist"))
        return float(df.close.iloc[-1]), df.index[-1]
    except Exception:
        return None, None


def capacity():
    lv, d = xu030_level()
    if lv is None: return None
    return dict(level=lv, day=d, cap=P["cap_tl"] * lv / P["cap_ref_level"])


def sleeve_split(total, w_xu, cap):
    """combo_v6.sim: XU kolu = min(w_xu*toplam, kapasite); fazlası TL taşıma+nakit koluna."""
    want = w_xu * total
    if cap is None: return want, 0.0
    x = min(want, cap["cap"]); return x, want - x


# ---------------- ana akış ----------------
def entry_days(start, end):
    out = []; m = pd.Timestamp(start.year, start.month, 1)
    while m <= end:
        d = first_trading_day(m.year, m.month)
        if start <= d <= end: out.append(d)
        m += pd.offsets.MonthBegin(1)
    return out


def replay(h, upto, months=8):
    """son 'months' ayın giriş günlerini sim.run(mode='hold') gibi yeniden oynatır: canlı pozisyon varken (vade > giriş
    günü) yeni giriş yok; vade günü pozisyon uzlaşır ve aynı gün yeni giriş yapılabilir."""
    legs = None; log = []
    for ed in entry_days(upto - pd.DateOffset(months=months), upto):
        if legs is not None and legs["exp"] <= ed: legs = None
        if legs is not None:
            log.append(dict(day=ed, act="tut", pick=legs, filt=None)); continue
        f = iv_filter(h, ed); pk = None
        if f and f["on"]:
            t = bulletin_text(ed); dh = parse_xu(t) if t else None
            pk = pick(chain(dh), ed) if dh is not None else None
        log.append(dict(day=ed, act="aç" if pk else ("filtre kapalı" if f and not f["on"] else "strike yok/veri yok"),
                        pick=pk, filt=f))
        if pk: pk["day"] = ed; legs = pk
    return log, legs


def run(now_ist):
    today = pd.Timestamp(now_ist.date())
    lb, df = latest_bulletin(today)
    if lb is None: return dict(err="VİOP bülteni bulunamadı (son 10 gün)")
    h = update_hist(lb)
    o = chain(df)
    filt = iv_filter(h, lb)
    nm = today + pd.offsets.MonthBegin(1)
    cur = first_trading_day(today.year, today.month)
    # bu ayın giriş günü henüz gelmediyse ya da bugünse ve bülteni yoksa -> o gün; aksi halde gelecek ayın ilk işlem günü
    next_day = cur if (cur >= today and cur > lb) else first_trading_day(nm.year, nm.month)
    log, legs = replay(h, lb)
    if legs is not None and legs["exp"] < today: legs = None
    R = dict(lb=lb, chain=o, atm=atm_iv(o), filt=filt, hist=h, today=today, next_day=next_day, log=log, legs=legs,
             entry_today=(today == next_day), entered_today=(today == cur and lb >= cur), cap=capacity())
    R["blocked"] = legs is not None and legs["exp"] > next_day
    # sonraki giriş için ön izleme (son bülten fiyatlarıyla; vade seçimi giriş gününe göre)
    R["why"] = []; R["preview"] = pick(o, next_day, R["why"])
    return R


def _leg(lg, n):
    return (f"K {lg['K']:,.0f}  uzlaşma {lg['px']:.2f}  IV %{100 * lg['iv']:.1f}  Δ {lg['delta']:+.3f}  "
            f"hacim {lg['qty']:,.0f} / AP {lg['oi']:,.0f} adet" + (f"  (gereken {n} adet = AP'nin %{100 * n / lg['oi']:.0f}'i)"
                                                                   if lg["oi"] > 0 and n else ""))


def report(R, sleeves=None, title=""):
    """sleeves: {etiket: E (TL)}"""
    L = [f"--- 4) XU030 20Δ/5Δ PUT SPREAD {title}(5x, IV > 252g medyan, ayın 1. VİOP günü, vadeye kadar) ---"]
    if "err" in R: L.append("  !! " + R["err"]); return "\n".join(L)
    a, f = R["atm"], R["filt"]; h = R["hist"]
    L.append(f"  Bülten {R['lb']:%Y-%m-%d}: ATM IV "
             + (f"%{100 * a['iv']:.2f} (vade {a['exp']:%Y-%m-%d}, F {a['F']:,.0f})" if a else
                f"yok (15-70 gün vadeli seri yok) -> son değer %{100 * f['iv']:.2f} taşınır ({f['day']:%Y-%m-%d}, araştırmadaki ffill)")
             + (f" | 252g medyan %{100 * f['med']:.2f} ({f['n']} gün) -> {'AÇIK (sat)' if f['on'] else 'KAPALI (işlem yok)'}" if f else ""))
    if f and np.isfinite(f["med"]) and abs(f["iv"] - f["med"]) < 0.005:
        L.append("    !! ATM IV medyana 0.5 puandan yakın: karar eşikte (canlı IV araştırmadan ~0.05 puan sapabilir; iskonto oranı farkı)")
    nh = int((h.src != "yok").sum()); L.append(f"    IV geçmişi: {HIST.relative_to(FX.CACHE.parent)} ({nh} bülten günü, "
                                                f"{h.index.min():%Y-%m-%d}..{h.index.max():%Y-%m-%d})")
    cap = R["cap"]
    if cap: L.append(f"  Kapasite: XU030 {cap['level']:,.2f} ({cap['day']:%Y-%m-%d}) / {P['cap_ref_level']:,.2f} (2025-10-16) x 1.000.000 "
                     f"= {cap['cap']:,.0f} TL üst sınır")
    else: L.append("  !! XU030 endeks seviyesi alınamadı: kapasite sınırı uygulanmadı (≈1M TL varsayın)")
    L.append("  Son giriş günleri (kural yeniden oynatıldı): " + " | ".join(
        f"{e['day']:%Y-%m-%d} " + (e["act"] if e["act"] != "aç" else
                                   f"AÇ {e['pick']['short']['K']:,.0f}/{e['pick']['wing']['K']:,.0f}P {e['pick']['exp']:%m-%d}")
        + (f" (IV %{100 * e['filt']['iv']:.1f}/med %{100 * e['filt']['med']:.1f})" if e["filt"] else "") for e in R["log"][-4:]))
    pk = R["legs"]
    if pk:
        L.append(f"  ELDE OLMASI GEREKEN: KISA put K {pk['short']['K']:,.0f} / UZUN put K {pk['wing']['K']:,.0f}, vade {pk['exp']:%Y-%m-%d} "
                 f"(giriş uzlaşma {pk['short']['px']:.2f} / {pk['wing']['px']:.2f}) -> "
                 + ("BUGÜN VADE: nakit uzlaşma, işlem yok" if pk["exp"] == R["today"] else "vadeye kadar tut"))
        o = R["chain"]
        cur = {k: o[(o.exp == pk["exp"]) & (o.cp == "P") & (o.K == pk[k]["K"])] for k in ("short", "wing")}
        if all(len(v) for v in cur.values()):
            s1, w1 = float(cur["short"].px.iloc[0]), float(cur["wing"].px.iloc[0])
            L.append(f"    son bülten: kısa {s1:.2f} / uzun {w1:.2f} -> spread {s1 - w1:.2f} puan (giriş {pk['short']['px'] - pk['wing']['px']:.2f}, "
                     f"maks. {pk['short']['K'] - pk['wing']['K']:,.0f}); vadeli {float(cur['short'].F.iloc[0]):,.0f}")
    else:
        L.append("  Şu an açık XU030 pozisyonu YOK (kurala göre).")
    nd = R["next_day"]
    if R["entered_today"]:
        L.append(f"  Bugün ({R['today']:%Y-%m-%d}) giriş günüydü ve bülteni yayımlandı: yukarıdaki yeniden oynatma bugünkü kararı içerir.")
    if R["blocked"]:
        L.append(f"  Sonraki giriş günü {nd:%Y-%m-%d}: mevcut pozisyon vadesi ({pk['exp']:%Y-%m-%d}) daha sonra -> YENİ GİRİŞ YOK.")
    elif R["entry_today"] and R["lb"] < R["today"]:
        L.append(f"  !! BUGÜN ({R['today']:%Y-%m-%d}) GİRİŞ GÜNÜ: araştırma bugünün UZLAŞMA fiyatlarıyla girer -> seans sonuna "
                 f"yakın işlem yapın; aşağıdaki hesap {R['lb']:%Y-%m-%d} bülteniyle ön tahmindir, filtreyi akşam bültenle teyit edin.")
    else:
        L.append(f"  Sonraki giriş günü: {nd:%Y-%m-%d} (ayın 1. VİOP günü). Filtre o günün bülteniyle kesinleşir; aşağısı "
                 f"{R['lb']:%Y-%m-%d} fiyatlarıyla ÖN İZLEME (ATM IV böyle kalırsa: {'SAT' if f and f['on'] else 'SATMA'}).")
    ref = nd; pk = R["preview"]
    if R["blocked"]:
        pk = R["legs"]; ref = pk["day"]
        L.append(f"    Elde tutulan pozisyonun kol başı boyutu ({ref:%Y-%m-%d} giriş fiyatları ve bugünkü kol tutarlarıyla; "
                 f"likidite satırları giriş günü bültenindendir):")
    if pk is None:
        L.append("    Bugünkü zincirle işlem çıkmıyor: " + "; ".join(R.get("why") or ["uygun vade/strike yok"]))
        g = R["chain"]; g = g[(g.cp == "P") & ((g.exp - ref).dt.days.between(P["min_dte"], P["max_dte"]))]
        if len(g):
            g = g[g.exp == g.exp.min()].sort_values("K").head(8)
            L.append(f"    En düşük put strike'ları ({g.exp.iloc[0]:%Y-%m-%d}; K / uzlaşma / IV / Δ / hacim / AP): " + " | ".join(
                f"{r.K:,.0f} {r.px:.2f} %{100 * r.iv:.1f} {r.delta:+.3f} {r.qty:,.0f}/{r.oi:,.0f}" for _, r in g.iterrows()))
        return "\n".join(L)
    L.append(f"    Vade {pk['exp']:%Y-%m-%d} ({(pk['exp'] - ref).days} gün, giriş gününe göre) | F_XU030{pk['exp']:%m%y} {pk['F']:,.0f}")
    sz0 = None
    for lab, E in (sleeves or {}).items():
        sz = size(pk, E, ref); sz0 = sz0 or sz
        L.append(f"    [{lab}] kol {E:,.0f} TL -> {sz['n']} adet KISA put K {pk['short']['K']:,.0f} + {sz['n']} adet UZUN put "
                 f"K {pk['wing']['K']:,.0f}  (teorik {sz['q0_theory'] / P['mult']:.1f} adet; nominal {sz['notional']:,.0f} TL = {sz['lev']:.2f}x)")
        L.append(f"        net prim ≈ {sz['prem']:,.0f} TL - maliyet {sz['cost']:,.0f} = {sz['net']:,.0f} TL (%{100 * sz['net'] / E:.2f} kol) | "
                 f"teminat ≈ {sz['margin']:,.0f} TL (%{100 * sz['margin'] / E:.0f} kol; yaklaşım) | vadede başabaş {sz['be']:,.0f} | "
                 f"maks. kayıp {sz['maxloss']:,.0f} TL (%{100 * sz['maxloss'] / E:.0f} kol)")
        L.append("        anlık boşluk (IV x1.5): " + " | ".join(f"{100 * g:+.0f}% -> {v:,.0f} TL (%{100 * v / E:.0f} kol)"
                                                       for g, v in sz["gaps"].items()))
    n = sz0["n"] if sz0 else 0
    L.append(f"    Likidite ({pk['short']['date']:%Y-%m-%d} bülteni; hacim = o günkü işlem adedi, AP = açık pozisyon):")
    L.append(f"      KISA 20Δ put  " + _leg(pk["short"], n))
    L.append(f"      UZUN  5Δ put  " + _leg(pk["wing"], n))
    g = pk["puts"]; g = g[(g.delta <= -0.02) & (g.delta >= -0.45)]
    L.append("      Put zinciri (vade " + f"{pk['exp']:%Y-%m-%d}): K / uzlaşma / IV / Δ / hacim / AP")
    for _, r in g.iterrows():
        mk = " <- kısa" if r.K == pk["short"]["K"] else (" <- uzun" if r.K == pk["wing"]["K"] else "")
        L.append(f"        {r.K:>8,.0f} {r.px:>9.2f}  %{100 * r.iv:5.1f}  {r.delta:+.3f}  {r.qty:>6,.0f}  {r.oi:>6,.0f}{mk}")
    L.append("    Not: teminat = araştırmanın ±%12 / IV x1.25 yaklaşımı; gerçek Takasbank teminatı için aracı kurumunuza sorun. "
             "Uzun put (koruma) çoğu zaman işlem görmüyor: limit emirle uzlaşma fiyatı civarında girin.")
    return "\n".join(L)
