"""BIST halka arz stratejileri simülasyonu (protokole uygun, look-ahead yok).

Veri: ipos.csv (halkarz.com), raw/isy/<T>.json (İş Yatırım ham günlük: kapanış, min, max, AOF=VWAP, TL hacim).

Strateji A (arz katılımı, eşit dağıtım):
  - Her halka arza (BIST'te işlem görmüş, fiyatı belli) hesap başına talep verilir.
  - Alınan lot = min(floor(bireysel lot / bireysel kişi), floor(R / fiyat))  (eşit dağıtımda kişi başı pay)
    Oransal dağıtımda (2022'de bazı arzlar, OOS'ta YOK) aynı ortalama pay kullanılır (muhafazakâr).
  - Talep tutarı R = 3 x (önceki 6 arzın kişi başı pay TL'sinin maksimumu), en az 5.000 TL  (ex-ante kural).
  - Blokaj: R, talep başlangıcından ilk işlem gününe kadar bloke. Senaryo "nakit": bu sürede faiz kaybı.
    Senaryo "fon": fon/PPF teminatıyla talep (birçok kurumda mümkün) -> faiz kaybı yok.
  - Çıkış kuralı (N parametresi): tavan serisi sürdükçe tut; ilk tavan-dışı kapanış gününden SONRAKİ gün
    VWAP (açılış verisi yok; 'ertesi gün açılışta sat' için vekil) ile sat. N. gün hâlâ tavandaysa
    N. gün kapanışında (tavan fiyatından; tavanda alıcı kuyruğu vardır) sat. N=999 = sınırsız.
    Varyant 'close': ilk tavan-dışı günün kapanışında sat.
  - Komisyon %0.14 alış + %0.14 satış. Hisse kazancında bireysel stopaj %0 (BIST payları).
Strateji B (ikincil piyasa, ilk gün): ilk işlem günü tavanda KİLİTLİ değilse (min < tavan fiyatı)
  o günün VWAP'ından al (kilitliyse alınamaz -> işlem yok), A ile aynı çıkış kuralı.
  Pozisyon büyüklüğü = min(serbest nakit, w x başlangıç sermayesi, günlük TL hacmin %1'i).
Boştaki nakit: engine.cash_rate_daily (politika faizi x 0.9).
"""
import json, pathlib, sys, itertools
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parents[1] / "src"))
from engine import cash_rate_daily

FEE = 0.0014
OOS0, OOS1 = pd.Timestamp("2025-10-17"), pd.Timestamp("2026-10-16")
START = pd.Timestamp("2022-01-01")

def tick(p):
    for lim, t in [(20, .01), (50, .02), (100, .05), (250, .10), (500, .25), (1000, .5), (2500, 1.0)]:
        if p < lim: return t
    return 2.5

def limit_up(base):
    t = tick(base * 1.1)
    return np.floor(base * 1.1 / t + 1e-9) * t

def load_px(tk):
    try:
        v = json.load(open(H / "raw" / "isy" / f"{tk}.json"))["value"]
    except Exception:
        v = None
    if not v:  # yedek: Yahoo (split düzeltmesi geri alınmış ham fiyat), VWAP ~ (H+L+C)/3
        f = H / "prices" / f"{tk}.csv"
        if not f.exists(): return None
        y = pd.read_csv(f, index_col=0, parse_dates=True)
        return pd.DataFrame({"close": y.close, "low": y.low, "high": y.high,
                             "vwap": (y.high + y.low + y.close) / 3, "vol": y.volume * y.close})
    df = pd.DataFrame(v)
    df.index = pd.to_datetime(df.HGDG_TARIH, format="%d-%m-%Y")
    df = df.rename(columns={"HG_KAPANIS": "close", "HG_MIN": "low", "HG_MAX": "high",
                            "HG_AOF": "vwap", "HG_HACIM": "vol"})[["close", "low", "high", "vwap", "vol"]]
    df = df.astype(float).sort_index()
    return df[df.vol > 0]

def ipo_table():
    ipo = pd.read_csv(H / "ipos.csv")
    ipo = ipo[ipo.price.notna() & ipo.first_trade.notna() & ipo.sub_start.notna()].copy()
    ipo["sub_start"] = pd.to_datetime(ipo.sub_start); ipo["first_trade"] = pd.to_datetime(ipo.first_trade)
    ipo = ipo[(ipo.first_trade >= START) & ipo.share_lots.notna()].sort_values("sub_start").reset_index(drop=True)
    rows = []
    for _, r in ipo.iterrows():
        px = load_px(r.ticker)
        if px is None: continue
        px = px[px.index >= r.first_trade]
        if len(px) < 3 or abs((px.index[0] - r.first_trade).days) > 5: continue
        # tavan serisi
        base, flags, locked = r.price, [], []
        for d, row in px.iterrows():
            lu = limit_up(base)
            flags.append(row.close >= lu - 1e-6)
            locked.append(row.low >= lu - 1e-6)
            base = row.close
        px = px.assign(tavan=flags, locked=locked)
        streak = 0
        for f in flags:
            if f: streak += 1
            else: break
        rr = r.to_dict(); rr["px"] = px; rr["streak"] = streak
        rr["d1_ret"] = px.close.iloc[0] / r.price - 1
        rr["d1_locked"] = bool(px.locked.iloc[0])
        rows.append(rr)
    return rows

def exit_trade(px, entry_i, N, variant):
    """entry_i: giriş günü indeksi (A için 0 = ilk işlem günü, alış arz fiyatından).
    Döner: (çıkış tarihi, çıkış fiyatı). Gün sayımı ilk işlem gününden itibaren (1-tabanlı)."""
    n = len(px)
    for i in range(entry_i, n):
        day_no = i + 1
        if not px.tavan.iloc[i]:
            if variant == "close" or i + 1 >= n:
                return px.index[i], px.close.iloc[i]
            return px.index[i + 1], px.vwap.iloc[i + 1]
        if day_no >= N:
            return px.index[i], px.close.iloc[i]
    return px.index[-1], px.close.iloc[-1]

def ipo_trades(rows, N, variant):
    out, hist = [], []
    for r in rows:
        prev = [h for h in hist if h[0] < r["sub_start"]][-6:]
        R = max(5000.0, 3 * max([h[1] for h in prev], default=5000.0))
        lots = min(r["share_lots"], np.floor(R / r["price"]))
        hist.append((r["first_trade"], r["share_tl"]))
        d, p = exit_trade(r["px"], 0, N, variant)
        cost = lots * r["price"] * (1 + FEE)
        proceeds = lots * p * (1 - FEE)
        out.append(dict(ticker=r["ticker"], sub_start=r["sub_start"], first_trade=r["first_trade"],
                        exit_date=d, price=r["price"], exit_px=p, lots=lots, R=R, cost=cost,
                        pnl=proceeds - cost, ret=proceeds / cost - 1 if cost else 0,
                        streak=r["streak"], method=r["method"]))
    return pd.DataFrame(out)

def secondary_trades(rows, N, variant):
    out = []
    for r in rows:
        px = r["px"]
        if px.locked.iloc[0]:
            continue
        e = px.vwap.iloc[0]
        d, p = exit_trade(px, 0, N, variant) if True else None
        # giriş VWAP ile aynı gün: gün 1 tavan değilse 'close' varyantında aynı gün kapanışta çıkar
        out.append(dict(ticker=r["ticker"], entry_date=px.index[0], entry_px=e, exit_date=d, exit_px=p,
                        vol_tl=px.vol.iloc[0], ret=(p * (1 - FEE)) / (e * (1 + FEE)) - 1))
    return pd.DataFrame(out)

def daily_index(a=None, b=None):
    """Pencere: a'dan önceki son iş günü (başlangıç özsermayesi) .. b."""
    a = START if a is None else pd.Timestamp(a)
    b = OOS1 if b is None else pd.Timestamp(b)
    return pd.bdate_range(a - pd.offsets.BDay(1), b)

def equity_A(tr, C, accounts=1, block="cash", a=None, b=None):
    """Hesap başına sermaye C/accounts; tüm hesaplar her arza katılır. Toplam özsermaye döner."""
    idx = daily_index(a, b); cr = cash_rate_daily(idx)
    # pencere içinde talep süreci başlayan arzlar; pencere sonrası çıkışlar pencere sonunda kapanış değeriyle
    tr = tr[(tr.sub_start >= idx[0]) & (tr.sub_start <= idx[-1])]
    # takvim günü faizi: iş günleri arası gün sayısı kadar bileşik
    gaps = pd.Series(idx, index=idx).diff().dt.days.fillna(1).values
    crd = (1 + cr.values) ** gaps - 1
    flows = pd.Series(0.0, index=idx)
    for _, t in tr.iterrows():
        k = accounts
        # alış maliyeti ilk işlem gününden önce düşülür, satış geliri çıkış gününde eklenir
        ex = idx[min(idx.searchsorted(t.exit_date), len(idx) - 1)]
        # hesap başı sermaye talebi sınırlar: alınabilecek lot <= floor((C/hesap)/fiyat)
        fac = min(1.0, np.floor((C / accounts) / t.price) / t.lots) if t.lots > 0 else 0.0
        flows[ex] += k * t.pnl * fac
        if block == "cash":
            days = (t.first_trade - t.sub_start).days
            rate = cash_rate_daily(pd.DatetimeIndex([t.sub_start])).iloc[0]
            lost = k * min(t.R, C / accounts) * ((1 + rate) ** days - 1)
            flows[ex] -= lost
    eq = np.empty(len(idx)); v = C
    for i in range(len(idx)):
        v = v * (1 + crd[i]) + flows.iloc[i]
        eq[i] = v
    return pd.Series(eq, index=idx)

def equity_B(tr, C, w, a=None, b=None):
    idx = daily_index(a, b); tr = tr[(tr.entry_date > idx[0]) & (tr.entry_date <= idx[-1])]
    cr = cash_rate_daily(idx)
    gaps = pd.Series(idx, index=idx).diff().dt.days.fillna(1).values
    crd = (1 + cr.values) ** gaps - 1
    cash, pos, eq = C, [], []
    tr = tr.sort_values("entry_date")
    ev = {}
    for _, t in tr.iterrows():
        ev.setdefault(idx[idx.searchsorted(t.entry_date)], []).append(t)
    out = []
    for i, d in enumerate(idx):
        cash *= (1 + crd[i])
        # çıkışlar
        keep = []
        for p in pos:
            if p["exit"] <= d:
                cash += p["size"] * (1 + p["ret"])
            else:
                keep.append(p)
        pos = keep
        for t in ev.get(d, []):
            size = min(cash, w * C, 0.01 * t.vol_tl)
            if size <= 0: continue
            cash -= size
            pos.append(dict(exit=idx[min(idx.searchsorted(t.exit_date), len(idx) - 1)], size=size, ret=t.ret))
        # pozisyonlar maliyet + gerçekleşince kâr; ara değerleme yapılmaz (kısa süreli)
        out.append(cash + sum(p["size"] for p in pos))
    return pd.Series(out, index=idx)

def monthly(eq):
    m = eq.resample("ME").last()
    first = eq.iloc[0]
    return m.pct_change().fillna(m.iloc[0] / first - 1)

def stats(eq, a, b):
    e = eq[(eq.index >= a) & (eq.index <= b)]
    e0 = eq[eq.index < a].iloc[-1] if (eq.index < a).any() else e.iloc[0]
    months = (e.index[-1] - (a if (eq.index < a).any() else e.index[0])).days / 30.4375
    tot = e.iloc[-1] / e0
    geo = tot ** (1 / months) - 1
    dd = (e / e.cummax() - 1).min()
    mr = e.resample("ME").last(); mr = pd.concat([pd.Series([e0]), mr]).pct_change().dropna()
    return dict(geo_month=geo, total=tot - 1, maxdd=dd, worst_month=mr.min())

if __name__ == "__main__":
    rows = ipo_table()
    print("IPO sayısı (simülasyona giren):", len(rows))
    pd.DataFrame([{k: v for k, v in r.items() if k != "px"} for r in rows]).to_csv(H / "ipos_used.csv", index=False)
