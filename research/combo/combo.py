"""Kombine portföy: halka arz katılımı (IPO strateji A, ipo/ raporundaki IS-sabit kural) +
arz için bloke edilmeyen paranın bir 'kol'da değerlendirilmesi. Hesap bazında günlük simülasyon.

Kural (değiştirilmedi, ipo/simulate.py): her arza talep, R = max(5.000, 3 x önceki 6 arzın kişi başı pay TL),
kişi başı lot = floor(bireysel lot / bireysel kişi) (R ve hesap sermayesiyle sınırlı), tavan serisi
bozulduğu günün kapanışında sat (N=sınırsız, 'close'). Komisyon %0.14 alış/satış. Arz pozisyonları günlük
kapanıştan piyasa değerine göre değerlenir (MTM).

Zaman çizelgesi (hepsi gün sonu kapanışında):
  sub_start'tan önceki iş günü  : teminat ayrılır (R_eff = min(R, kullanılabilir likit varlık))
  first_trade'den önceki iş günü: tahsis ödenir (lot x fiyat x 1.0014), teminatın geri kalanı serbest
  exit_date                      : satış geliri (x 0.9986) kola geri yatırılır

Teminat modları:
  'pledge' : kol varlıkları satılmadan teminat gösterilir (PPF için gerçekçi: çoğu kurum PPF/fon payı
             teminatıyla talep alır). Hisse/yurt dışı kolu için İYİMSER varsayım. Sadece tahsis tutarı
             first_trade-1'de koldan çekilir (kol satış maliyetiyle).
  'sell'   : R_eff tutarı talep başında koldan SATILIR (maliyetli), PPF'ye geçer ve PPF teminat olur
             (PPF faizi kazanır), tahsisten sonra artan kısım kola geri alınır (maliyetli).
  'cash'   : (sadece MM kolu, ipo raporu ile mutabakat için) R_eff nakit bloke, faiz kazanmaz.

Kol giriş/çıkış maliyeti: MM 0; BIST %0.14; KELLY %0.15 (vadeli %0.05 + USD/TRY çevrim makası %0.10).
Vergi: BIST pay ve arz kazancı stopajı %0 (bireysel, BIST payları); PPF net (politika x 0.9 varsayımı,
  engine.cash_rate_daily); KELLY kolu: her takvim yılı sonunda (ve pencere sonunda) kolun o yılki pozitif
  kârının tau'su (taban tau=%20: VİOP endeks %0, VİOP döviz/altın %10 stopaj, yurt dışı vadeli/ETF kazancı
  beyanname %15-40 -> karma varsayım; zarar mahsubu yok = muhafazakâr). tau=0 duyarlılık olarak raporlanır.
Karışım kolu (BIST+KELLY): ağırlıklar yalnızca IS'te (2022-01-03..2025-10-16) seçilir, ay sonlarında
  hedefe yeniden dengelenir (maliyetli).
"""
import sys, pathlib, itertools, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
ROOT = H.parents[1]
sys.path.insert(0, str(ROOT / "src")); sys.path.insert(0, str(ROOT / "research/ipo"))
import simulate as IPO

OUT = H / "results"
IS0, IS1 = pd.Timestamp("2022-01-01"), pd.Timestamp("2025-10-16")
OOS0, OOS1 = pd.Timestamp("2025-10-17"), pd.Timestamp("2026-10-16")
FEE_IPO = 0.0014
SFEE = {"MM": 0.0, "BIST": 0.0014, "KELLY": 0.0015}
for ph in range(1, 5):
    SFEE[f"BIST_ph{ph}"] = 0.0014

SL = pd.read_pickle(OUT / "sleeves.pkl")


def load_ipos():
    rows = IPO.ipo_table()
    tr = IPO.ipo_trades(rows, 999, "close")          # IS'te seçilmiş kural (ipo/REPORT.md)
    pxs = {r["ticker"]: r["px"].close for r in rows}
    return tr, pxs


def window_index(a, b):
    a = pd.Timestamp(a); b = pd.Timestamp(b)
    return SL.index[(SL.index >= a - pd.offsets.BDay(1)) & (SL.index <= b)]


DIAG = {}


def sim(tr, pxs, cap, weights, mode="pledge", tau=0.20, a=IS0, b=IS1, ipo=True):
    """Tek hesap (sermaye = cap). weights: kol ağırlıkları dict. Döner: günlük özsermaye serisi."""
    idx = window_index(a, b); n = len(idx)
    names = list(weights)
    R = {k: SL[k].reindex(idx).fillna(0).values for k in names}
    mm = SL["MM"].reindex(idx).fillna(0).values
    w = np.array([weights[k] for k in names]); fee = np.array([SFEE[k] for k in names])
    # başlangıç: kola giriş maliyetli
    Hs = cap * w * (1 - fee)
    P = 0.0; Z = 0.0; reserved = 0.0
    kel = names.index("KELLY") if "KELLY" in names else None
    pnl_k = 0.0
    pos = {}   # ticker -> dict(lots, price, px, value, R_eff, first_i, exit_i, exit_px, paid)
    ev_sub, ev_alloc, ev_exit = {}, {}, {}
    if ipo:
        t = tr[(tr.sub_start >= idx[0] + pd.offsets.BDay(1)) & (tr.sub_start <= idx[-1])]
        for _, r in t.iterrows():
            si = idx.searchsorted(r.sub_start) - 1
            fi = idx.searchsorted(r.first_trade) - 1
            xi = idx.searchsorted(r.exit_date)
            if si < 0: continue
            ev_sub.setdefault(si, []).append(r.ticker)
            if fi < n: ev_alloc.setdefault(fi, []).append(r.ticker)
            if xi < n: ev_exit.setdefault(xi, []).append(r.ticker)
            pos[r.ticker] = dict(lots=r.lots, price=r.price, R=r.R, exit_px=r.exit_px, live=False, value=0.0,
                                 px=pxs[r.ticker])

    def withdraw(x):
        """koldan net x TL çek (pro-rata, maliyetli). döner: gerçekte çekilen net"""
        nonlocal Hs
        tot = Hs.sum()
        if tot <= 0 or x <= 0: return 0.0
        share = Hs / tot
        gross = x / (share * (1 - fee)).sum()
        gross = min(gross, tot)
        Hs = Hs - gross * share
        return gross * (share * (1 - fee)).sum()

    def deposit(x):
        nonlocal Hs
        Hs = Hs + x * w * (1 - fee)

    eq = np.empty(n); eq[0] = cap; coll = np.zeros(n); inipo = np.zeros(n)
    yr = idx.year.values
    for i in range(1, n):
        d = idx[i]
        rr = np.array([R[k][i] for k in names])
        if kel is not None: pnl_k += Hs[kel] * rr[kel]
        Hs = Hs * (1 + rr); P *= (1 + mm[i])
        for tk, p in pos.items():
            if p["live"]:
                c = p["px"].loc[:d]
                if len(c): p["value"] = p["lots_eff"] * c.iloc[-1]
        # vergi (KELLY kolu) yıl sonu / pencere sonu
        if kel is not None and (i == n - 1 or yr[i + 1] != yr[i]):
            if pnl_k > 0 and tau > 0:
                Hs[kel] -= tau * pnl_k
            pnl_k = 0.0
        # 1) çıkışlar
        for tk in ev_exit.get(i, []):
            p = pos[tk]
            if not p["live"]: continue
            proceeds = p["lots_eff"] * p["exit_px"] * (1 - FEE_IPO)
            p["live"] = False; p["value"] = 0.0
            deposit(proceeds)
        # 2) tahsis ödemesi
        for tk in ev_alloc.get(i, []):
            p = pos[tk]
            if "R_eff" not in p: continue
            cost = p["lots_eff"] * p["price"] * (1 + FEE_IPO)
            if mode == "sell":
                take = min(P, p["R_eff"]); P -= take; rest = take - cost
                if rest >= 0: deposit(rest)
                else: withdraw(-rest)
            elif mode == "cash":
                take = min(Z, p["R_eff"]); Z -= take; rest = take - cost
                if rest >= 0: deposit(rest)
                else: withdraw(-rest)
            else:
                reserved -= p["R_eff"]; withdraw(cost)
            p["live"] = p["lots_eff"] > 0; p["value"] = p["lots_eff"] * p["price"]
        # 3) yeni talepler
        for tk in ev_sub.get(i, []):
            p = pos[tk]
            if mode == "pledge":
                avail = Hs.sum() - reserved
            else:
                avail = Hs.sum()
            Reff = max(0.0, min(p["R"], avail))
            p["lots_eff"] = min(p["lots"], np.floor(Reff / p["price"]))
            if mode == "pledge":
                reserved += Reff
            elif mode == "sell":
                Reff = withdraw(Reff)  # satış maliyeti sonrası PPF'ye geçen tutar
                P += Reff
            elif mode == "cash":
                Reff = withdraw(Reff); Z += Reff
            p["R_eff"] = Reff
        # 4) karışım kolu: ay sonu yeniden dengeleme
        if len(names) > 1 and (i == n - 1 or idx[i + 1].month != d.month):
            tot = Hs.sum(); tgt = tot * w
            trade = np.abs(tgt - Hs)
            Hs = tgt - tot * w * (trade * fee).sum() / max(tot, 1e-9)
        iv = sum(p["value"] for p in pos.values() if p["live"])
        eq[i] = Hs.sum() + P + Z + iv
        coll[i] = (P + Z + (reserved if mode == "pledge" else 0)) / eq[i]; inipo[i] = iv / eq[i]
    DIAG["coll_frac"] = coll[1:].mean(); DIAG["ipo_frac"] = inipo[1:].mean()
    return pd.Series(eq, index=idx)


def stats(eq, a):
    e0 = eq.iloc[0]
    days = (eq.index[-1] - eq.index[0]).days
    geo = (eq.iloc[-1] / e0) ** (30.4375 / days) - 1
    dd = (eq / eq.cummax() - 1).min()
    m = eq.resample("ME").last()
    mr = pd.concat([pd.Series([e0], index=[eq.index[0]]), m]).pct_change().dropna()
    return dict(geo=geo, total=eq.iloc[-1] / e0 - 1, maxdd=dd, worst_m=mr.min(), best_m=mr.max(),
                neg_m=int((mr < 0).sum()), m10=int((mr >= 0.10).sum()), months=len(mr),
                pnl_tl=eq.iloc[-1] - e0)


def monthly(eq):
    m = eq.resample("ME").last()
    return pd.concat([pd.Series([eq.iloc[0]], index=[eq.index[0]]), m]).pct_change().dropna()


def choose_mix():
    """BIST/KELLY karışım ağırlığı: sadece IS (2022-01-03..2025-10-16) günlük getirileriyle."""
    x = SL.loc["2022-01-03":"2025-10-16"]
    vb, vk = x.BIST.std(), x.KELLY.std()
    w_iv = (1 / vb) / (1 / vb + 1 / vk)
    grid = []
    for wb in np.round(np.arange(0, 1.0001, 0.05), 2):
        r = wb * x.BIST + (1 - wb) * x.KELLY - x.MM
        grid.append(dict(w_bist=wb, sharpe=r.mean() / r.std() * np.sqrt(260),
                         geo_is=((1 + wb * x.BIST + (1 - wb) * x.KELLY).prod()) ** (30.4375 / (x.index[-1] - x.index[0]).days) - 1))
    g = pd.DataFrame(grid)
    w_sh = float(g.loc[g.sharpe.idxmax(), "w_bist"])
    return float(w_iv), w_sh, g


if __name__ == "__main__":
    tr, pxs = load_ipos()
    w_iv, w_sh, g = choose_mix()
    g.to_csv(OUT / "mix_weight_IS_grid.csv", index=False)
    print("mix: inverse-vol w_BIST=%.3f, IS max-Sharpe w_BIST=%.2f" % (w_iv, w_sh)); print(g.round(3).to_string())
    json.dump(dict(w_iv=w_iv, w_sh=w_sh), open(OUT / "mix_weights.json", "w"))
    SLEEVES = {"MM": {"MM": 1.0}, "BIST": {"BIST": 1.0}, "KELLY": {"KELLY": 1.0},
               "MIX_IV": {"BIST": w_iv, "KELLY": 1 - w_iv}, "MIX_SH": {"BIST": w_sh, "KELLY": 1 - w_sh}}
    if w_sh in (0.0, 1.0):
        SLEEVES["MIX_SH"] = {"BIST": w_sh, "KELLY": 1 - w_sh} if w_sh == 0.0 else {"BIST": 1.0}
        SLEEVES["MIX_SH"] = {k: v for k, v in SLEEVES["MIX_SH"].items() if v > 0}
    CAPS = [100_000, 250_000, 500_000, 1_000_000]; ACCS = [1, 2, 4]
    rows = []; daily = {}; mon = {}
    def run(tag, sleeve, wts, mode, tau, ipo, C, k, group):
        for per, a, b in [("IS", IS0, IS1), ("OOS", OOS0, OOS1)]:
            e = sim(tr, pxs, C / k, wts, mode, tau, a, b, ipo) * k
            st = stats(e, a)
            rows.append(dict(group=group, sleeve=sleeve, mode=mode, tau=tau, ipo=ipo, C=C, accounts=k,
                             period=per, coll_frac=DIAG["coll_frac"], ipo_frac=DIAG["ipo_frac"], **st))
            daily[(per, group, sleeve, mode, tau, C, k)] = e
            mon[(per, group, sleeve, mode, tau, C, k)] = monthly(e)
    # ANA IZGARA: 5 kol x teminat modu x 4 sermaye x 3 hesap sayısı (KELLY içerenlerde tau=%20)
    for C, k in itertools.product(CAPS, ACCS):
        for s, wts in SLEEVES.items():
            modes = ["pledge", "cash"] if s == "MM" else ["pledge", "sell"]
            for md in modes:
                run("main", s, wts, md, 0.20, True, C, k, "main")
    # Referans: arzsız kollar (sermaye/hesap bağımsız)
    for s, wts in SLEEVES.items():
        run("ref", s, wts, "pledge", 0.20, False, 1_000_000, 1, "noIPO")
        if "KELLY" in wts: run("ref", s, wts, "pledge", 0.0, False, 1_000_000, 1, "noIPO_tax0")
    # Duyarlılık 1: KELLY vergisi 0 (lev_trend raporu vergi öncesiydi)
    for C, k in itertools.product(CAPS, ACCS):
        for s in ["KELLY", "MIX_IV", "MIX_SH"]:
            if "KELLY" not in SLEEVES[s]: continue
            for md in ["pledge", "sell"]:
                run("sens", s, SLEEVES[s], md, 0.0, True, C, k, "sens_tax0")
    # Duyarlılık 2: BIST haftalık dengeleme günü kaydırma (phase 1-4)
    for C, k in itertools.product(CAPS, ACCS):
        for ph in range(1, 5):
            for md in ["pledge", "sell"]:
                run("sens", f"BIST_ph{ph}", {f"BIST_ph{ph}": 1.0}, md, 0.20, True, C, k, "sens_phase")
    res = pd.DataFrame(rows)
    res.to_csv(OUT / "all_results.csv", index=False)
    pd.to_pickle(dict(daily=daily, monthly=mon), OUT / "series.pkl")
    for per in ["IS", "OOS"]:
        for kind, dct in [("monthly", mon), ("daily", daily)]:
            df = pd.DataFrame({f"{s}|{m}|tau{t}|{c//1000}k|{k}acc": v.pct_change().dropna() if kind == "daily" else v
                               for (p, g, s, m, t, c, k), v in dct.items() if p == per and g in ("main", "noIPO")})
            df.to_csv(OUT / f"{kind}_returns_{per}.csv", float_format="%.6f")
    print("toplam simülasyon satırı:", len(res), " (kombinasyon = satır/2)")
