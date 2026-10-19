#!/usr/bin/env python3
"""TOP3 canlı sinyal aracı (Combo v6: TL taşıma+nakit / Deribit / BIST-C / XU030 put spread / kripto olay).  Kullanım:
    python3 live/run.py --tl-capital 5000000                 # v6 #1, #2, #3 karma portföyler + tüm kollar
    python3 live/run.py --tl-capital 5e6 --portfolio 1 --carry-held 3000 --carry-code F_USDTRY1126 --hedge-held
    python3 live/run.py --tl-capital 1e6 --only xu030        # yalnızca XU030 put spread kolu (tüm sermaye bu kolda)
    python3 live/run.py --only events --usd-capital 10000    # yalnızca kripto olay listesi (bilgi amaçlı)
    python3 live/run.py --usd-capital 100000 --only deribit  # yalnızca Deribit kolu
    python3 live/run.py --tl-capital 1e6 --only cash         # yalnızca TL nakit kolu (bono <-> mevduat, VİOP DİBS)
    python3 live/run.py --tl-capital 1e6 --weights v5        # eski Combo v5 ağırlıkları (#1 / #3, 3 kol)
Tüm indirmeler live/cache/ altında önbelleğe alınır (git dışı).  Parametreler config.py'de; tabloları güncelleyin.
"""
import argparse, datetime as dt, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); sys.dont_write_bytecode = True
from zoneinfo import ZoneInfo
import config as C, s0_cash, s1_carry, s2_deribit, s3_bist

FEE_O = C.FEE_O


def args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tl-capital", type=float, default=1_000_000, help="toplam TL sermaye (karma portföy)")
    ap.add_argument("--usd-capital", type=float, default=None, help="--only deribit/events için USD sermaye")
    ap.add_argument("--weights", choices=["v6", "v5"], default="v6", help="v6 = Combo v6 TOP3 (varsayılan), v5 = eski")
    ap.add_argument("--portfolio", choices=["1", "2", "3", "all", "both"], default="all",
                    help="v6: 1 / 2 / 3 / all ; v5: 1 / 3 / both")
    ap.add_argument("--carry-held", type=int, default=0, help="elde tutulan KISA USDTRY vadeli adedi (bant kontrolü)")
    ap.add_argument("--carry-code", default=None, help="elde tutulan vadeli kodu, ör. F_USDTRY1126 (roll kontrolü)")
    ap.add_argument("--hedge-held", action="store_true", help="canlı (vadesi gelmemiş) 10Δ koruma putu var")
    ap.add_argument("--xu-asof", default=None, help="XU030 kolunu geçmiş bir tarih itibarıyla çalıştır (YYYY-MM-DD; doğrulama)")
    ap.add_argument("--only", choices=["cash", "carry", "deribit", "bist", "xu030", "events"], default=None)
    return ap.parse_args()


def main():
    a = args()
    now_ist = dt.datetime.now(ZoneInfo("Europe/Istanbul")); now_utc = dt.datetime.now(dt.timezone.utc)
    print(f"=== TOP3 CANLI SİNYAL ({'Combo v6' if a.weights == 'v6' else 'Combo v5 (eski)'})  {now_ist:%Y-%m-%d %H:%M} İstanbul ===")
    if a.weights == "v5": return main_v5(a, now_ist, now_utc)
    if a.portfolio == "both": a.portfolio = "all"
    ports = [1, 2, 3] if a.portfolio == "all" else [int(a.portfolio)]
    T = a.tl_capital

    if a.only == "events":
        import s5_events
        usd = a.usd_capital
        print(s5_events.report(s5_events.run(now_utc), {"kol": usd} if usd else None)); return
    if a.only == "xu030":
        import s4_xu030
        R = s4_xu030.run(dt.datetime.fromisoformat(a.xu_asof) if a.xu_asof else now_ist); cap = R.get("cap")
        E, ex = s4_xu030.sleeve_split(T, 1.0, cap)
        print(s4_xu030.report(R, {"tek kol": E}))
        if ex > 0: print(f"  Kapasite sınırı: {ex:,.0f} TL kolda kullanılamaz (combo_v6'da TL taşıma+nakit koluna gider).")
        return

    # --- kol tutarları (combo_v6.sim: XU kolu kapasiteyle sınırlı, fazlası TL koluna) ---
    import s4_xu030
    cap = s4_xu030.capacity()
    AMT = {}
    for p in ports:
        w = C.COMBO_W6[p]
        xu, ex = s4_xu030.sleeve_split(T, w[3], cap)
        res = T * (1 - sum(w))                     # ağırlık yuvarlama artığı (#2: %0.01) -> TL kolu
        AMT[p] = dict(tl=T * w[0] + ex + res, opt=T * w[1], c=T * w[2], xu=xu, evt=T * w[4], ex=ex)

    POS = {}
    if a.only in (None, "carry", "cash"):
        for p in ports:
            B = AMT[p]["tl"] if a.only is None else T
            txt, sig, pos = s1_carry.report(B, C.LMAX6[p], now_ist, a.carry_held, a.carry_code, title=f"[#{p}] ")
            POS[p] = (B, pos)
            if a.only != "cash": print(txt)
        txt, dec = s0_cash.report_rates(now_ist.date())
        print(txt)
        for p in ports:
            B, pos = POS[p]
            print(s0_cash.report_buckets(B, pos, dec, title=f"[#{p}] ")[0])
        if a.only in ("cash", "carry"): return
    spot = s1_carry.usdtry_marks()[1]

    if a.only in (None, "deribit"):
        pl = s2_deribit.plan(now_utc)
        if a.only == "deribit":
            usd = a.usd_capital or T * (1 - FEE_O) / spot
            print(s2_deribit.report(pl, usd, a.hedge_held, title="[tek kol] ")[0]); return
        p0 = ports[0]
        usd = AMT[p0]["opt"] * (1 - FEE_O) / spot
        print(s2_deribit.report(pl, usd, a.hedge_held, title=f"[#{p0} kolu] ")[0])
        print("  Karma portföy Deribit kolları (aynı kontratlar):")
        for p in ports:
            usd = AMT[p]["opt"] * (1 - FEE_O) / spot
            print(s2_deribit.report(pl, usd, a.hedge_held, title=f"#{p}: ", brief=True)[0])

    R = None
    if a.only in (None, "bist"):
        R = s3_bist.run(now_ist)
        if a.only == "bist":
            print(s3_bist.report(R, T)); return
        print(s3_bist.report(R, None, title="[liste] "))

    R4 = s4_xu030.run(now_ist)
    print(s4_xu030.report(R4, {f"#{p}": AMT[p]["xu"] for p in ports}))

    ev_ports = [p for p in ports if C.COMBO_W6[p][4] > 0]
    if ev_ports:
        import s5_events
        print(s5_events.report(s5_events.run(now_utc), {f"#{p}": AMT[p]["evt"] * (1 - C.FEE_O) / spot for p in ev_ports}))

    # --- karma portföy özeti ---
    print(f"--- 6) KARMA PORTFÖY Combo v6 (toplam {T:,.0f} TL, USDTRY {spot:.4f}; ay sonu son Cuma hedef ağırlığa dengelenir) ---")
    if cap: print(f"  XU030 kapasite sınırı {cap['cap']:,.0f} TL (fazlası TL taşıma+nakit koluna)")
    lab = C.SLEEVES6
    for p in ports:
        w = C.COMBO_W6[p]; m = AMT[p]
        print(f"  #{p} (ters-vol, Lmax {C.LMAX6[p]}; TOP3.md {'/'.join(f'{100 * x:.0f}' for x in w)}):")
        rows = [(lab[0], w[0], m["tl"], f"VİOP USDTRY kısa + bono/mevduat" + (f"; +{m['ex']:,.0f} TL XU030 kapasite fazlası" if m["ex"] > 0 else "")),
                (lab[1], w[1], m["opt"], f"≈{m['opt'] * (1 - FEE_O) / spot:,.0f} USD Deribit'e"),
                (lab[2], w[2], m["c"], (f"hisse başı {m['c'] / C.BIST['top']:,.0f} TL" if R and R["reg"] else
                                         "rejim kapalı: gecelik mevduat" if R else "")),
                (lab[3], w[3], m["xu"], "VİOP XU030 opsiyon hesabında nakit (teminat + nema)"),
                (lab[4], w[4], m["evt"], (f"≈{m['evt'] * (1 - FEE_O) / spot:,.0f} USD Binance (gri alan; isteğe bağlı)" if w[4] > 0 else "yok"))]
        for nm, wi, tl, note in rows:
            print(f"    {nm:16s} %{100 * wi:5.2f}  {tl:>14,.0f} TL   {note}")
        print(f"    {'TOPLAM':16s} %{100 * sum(m[k] for k in ('tl', 'opt', 'c', 'xu', 'evt')) / T:5.2f}  {sum(m[k] for k in ('tl', 'opt', 'c', 'xu', 'evt')):>14,.0f} TL")
    print("  Beklenti (TOP3.md / REPORT_v6): son 12 ay OOS aylık %5.4-5.7 (nema var; #3 %4.7-5.0) ama gerçekçi ~%3.5-4.5/ay. "
          "+%10 / +%15 kur şoku (medyan MTM DD): #1 -19/-34% (zorla kapatma), #2 -17/-30%, #3 -18/-27% (zorla kapatma yok). Olay kolunu kullanmayacaksanız #1'i seçin (#2/#3'ün olay payını TL koluna eklemek "
          "araştırılmış bir portföy değildir).")


def main_v5(a, now_ist, now_utc):
    """eski Combo v5 akışı (3 kol: TL taşıma+mevduat / Deribit / BIST-C)."""
    if a.portfolio in ("all",): a.portfolio = "both"
    if a.portfolio == "2": sys.exit("v5'te #2 karma portföy yok (v5 #2 = tek başına Deribit: --only deribit)")
    ports = [1, 3] if a.portfolio == "both" else [int(a.portfolio)]
    LMAX5 = {1: 5, 3: 3}
    POS = {}
    if a.only in (None, "carry", "cash"):
        for p in ports:
            B = a.tl_capital * C.COMBO_W[p][0] if a.only is None else a.tl_capital
            txt, sig, pos = s1_carry.report(B, LMAX5[p], now_ist, a.carry_held, a.carry_code, title=f"[#{p}] ")
            POS[p] = (B, pos)
            if a.only != "cash": print(txt)
        txt, dec = s0_cash.report_rates(now_ist.date())
        print(txt)
        for p in ports:
            B, pos = POS[p]
            print(s0_cash.report_buckets(B, pos, dec, title=f"[#{p}] ")[0])
        if a.only == "cash": return
    spot = s1_carry.usdtry_marks()[1]

    if a.only in (None, "deribit"):
        pl = s2_deribit.plan(now_utc)
        usd = a.usd_capital or a.tl_capital * (1 - FEE_O) / spot
        print(s2_deribit.report(pl, usd, a.hedge_held, title="[v5 TOP3 #2 tek başına] ")[0])
        if a.only is None:
            print("  Karma portföy Deribit kolları (aynı kontratlar):")
            for p in ports:
                usd = a.tl_capital * C.COMBO_W[p][1] * (1 - FEE_O) / spot
                print(s2_deribit.report(pl, usd, a.hedge_held, title=f"#{p}: ", brief=True)[0])

    R = {"reg": False}
    if a.only in (None, "bist"):
        R = s3_bist.run(now_ist)
        if a.only == "bist":
            print(s3_bist.report(R, a.tl_capital))
        else:
            print(s3_bist.report(R, None, title="[liste] "))

    if a.only is None:
        print(f"--- 4) KARMA PORTFÖY v5 (toplam {a.tl_capital:,.0f} TL, USDTRY {spot:.4f}; ay sonu son Cuma hedef ağırlığa dengelenir) ---")
        for p in ports:
            wt, wo, wc = C.COMBO_W[p]
            print(f"  #{p} (ters-vol, Lmax {LMAX5[p]}): TL taşıma+nakit %{100 * wt:.2f} = {a.tl_capital * wt:,.0f} TL | "
                  f"Deribit %{100 * wo:.2f} = {a.tl_capital * wo:,.0f} TL (≈{a.tl_capital * wo * (1 - FEE_O) / spot:,.0f} USD) | "
                  f"BIST-C %{100 * wc:.2f} = {a.tl_capital * wc:,.0f} TL"
                  + (f" -> hisse başı {a.tl_capital * wc / C.BIST['top']:,.0f} TL" if R["reg"] else " -> rejim kapalı: gecelik mevduat"))
        print("  Not: combo_v5 simülasyonunda Deribit kolu korumasız 30Δ 2x idi; bu araç TOP3 #2 / options2 #1 kuralını "
              "(40Δ + 10Δ koruma putu) uygular (config.DERIBIT['delta'] ile değiştirilebilir).")


if __name__ == "__main__":
    main()
