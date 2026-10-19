"""0) TL NAKİT KOLU: 3 aylık hazine bonosu merdiveni <-> 32 gün mevduat + VİOP teminatında DİBS (research/cash_upgrade).

Kural (araştırmayla birebir; cashlib.CashBook 'BEST3' + combo_cash viop='dibs1'):
  bono (alış)  y_b = orta getiri (wgb 3 ay, son 7 iş günü medyanı ya da config override) - spread/2
  bono net     y_b * (1 - DİBS stopajı)        [%0: 31.12.2026'ya kadar ALINANLAR; sonra %10]
  mevduat net  r_d = brüt 32 gün * (1 - %17.5)
  karşılaştırma: efektif yıllık  (1 + y_b*T)^(1/T)  vs  (1 + r_d*32/365)^(365/32),  T = 0.25 yıl
  -> serbest TL nakdi (yeni para, vadesi gelen bono/mevduat) yüksek olana gider.  Elde tutulan bono vadeye kadar
     tutulur, mevduat vadesi beklenir (araştırmada geçişte satış/bozma yok).  İlk girişte bono merdiveni 1/2/3 ay
     vadeli üç eşit dilime bölünür (CashBook.route initial=True); sonra vadesi gelen dilim yeni 3 aylığa döner.
  VİOP teminatı (carry modülünün hedef VİOP nakdi = 1.25 x IM): DİBS kısmı = min(max(Vc - 0.5*IM, 0), 0.5*IM/0.97)
     (piyasa değeri; teminatta %97 ile sayılır, IM'in en fazla %50'si), kalan VİOP nakdi TL (Takasbank nema).
"""
import numpy as np, pandas as pd
import config as C, fetch as FX


def bill_yield(today):
    """3 aylık bono orta getirisi (basit yıllık, kesir) + kaynak bilgisi."""
    P = C.CASH
    if P["bill_3m_override"] is not None:
        return dict(mid=P["bill_3m_override"] / 100, src="config.CASH['bill_3m_override'] (elle)", last=None, last_day=None)
    s = FX.wgb_history(P["bill_tenor_m"])
    if s is None or s.empty:
        return None
    s = s[(s.index.dayofweek < 5) & (s.index <= pd.Timestamp(today))]
    med = float(s.rolling(P["bill_median_days"], min_periods=1).median().iloc[-1])
    return dict(mid=med / 100, src=f"worldgovernmentbonds TR {P['bill_tenor_m']} ay, son {P['bill_median_days']} iş günü medyanı",
                last=float(s.iloc[-1]) / 100, last_day=s.index[-1])


def dibs_tax(buy_day):
    return 0.0 if pd.Timestamp(buy_day) <= pd.Timestamp(C.CASH["dibs_stopaj0_until"]) else C.CASH["dibs_stopaj_after"]


def decision(today):
    P = C.CASH; by = bill_yield(today)
    T = P["bill_tenor_m"] / 12; term = P["dep_term"]
    dg = P["dep_32d_gross"] / 100; dn = dg * (1 - P["dep_stopaj"])
    d_eff = (1 + dn * term / 365) ** (365 / term) - 1
    out = dict(dep_g=dg, dep_n=dn, dep_eff=d_eff, dep_m=(1 + d_eff) ** (1 / 12) - 1, tax=dibs_tax(today), by=by,
               on_n=P["on_factor"] * dg * (1 - P["dep_stopaj"]))
    if by is None:
        out.update(choice="DEP", note="bono getirisi indirilemedi -> config.CASH['bill_3m_override'] girin; varsayılan mevduat")
        return out
    ya = by["mid"] - P["bill_spread"] / 2
    yn = ya * (1 - out["tax"])
    b_eff = (1 + yn * T) ** (1 / T) - 1
    out.update(bill_ask=ya, bill_n=yn, bill_eff=b_eff, bill_m=(1 + b_eff) ** (1 / 12) - 1,
               choice="BILL" if b_eff > d_eff else "DEP")
    # başabaş: mevduatın bonoyu geçmesi için gereken brüt 32 gün faiz
    rn_be = ((1 + b_eff) ** (term / 365) - 1) * 365 / term
    out["dep_g_breakeven"] = rn_be / (1 - P["dep_stopaj"])
    return out


def viop_split(pos):
    """VİOP hedef nakdi (carry modülü) -> DİBS (piyasa değeri) / TL nakit."""
    P = C.CASH
    if not pos or pos.get("im", 0) <= 0:
        return dict(im=0.0, vc=0.0, dibs=0.0, tl=0.0, credit=0.0)
    IMv, vc = pos["im"], pos["viop_cash"]
    dibs = min(max(vc - (1 - P["viop_dibs_max"]) * IMv, 0.0), P["viop_dibs_max"] * IMv / P["viop_dibs_val"])
    return dict(im=IMv, vc=vc, dibs=dibs, tl=vc - dibs, credit=vc - (1 - P["viop_dibs_val"]) * dibs)


def report_rates(today):
    d = decision(today); P = C.CASH; L = []
    L.append("--- 1b) TL NAKİT KOLU (3 ay bono ↔ 32 gün mevduat, vergi sonrası; VİOP teminatında DİBS) ---")
    by = d["by"]
    if by is None:
        L.append("  !! 3 aylık bono getirisi alınamadı (wgb). config.CASH['bill_3m_override'] ile elle girin.")
    else:
        extra = f" (son baskı {100 * by['last']:.2f}% @ {by['last_day']:%Y-%m-%d})" if by["last"] is not None else ""
        L.append(f"  3 ay bono orta %{100 * by['mid']:.2f} [{by['src']}]{extra}")
        L.append(f"    alış (−{100 * P['bill_spread'] / 2:.3f} puan) %{100 * d['bill_ask']:.2f} | DİBS stopajı %{100 * d['tax']:.0f} "
                 f"(≤{P['dibs_stopaj0_until']} alımlar %0) -> net basit %{100 * d['bill_n']:.2f} = efektif yıllık "
                 f"%{100 * d['bill_eff']:.2f} (aylık %{100 * d['bill_m']:.3f})")
    L.append(f"  32 gün mevduat brüt %{100 * d['dep_g']:.2f} (config) | stopaj %{100 * P['dep_stopaj']:.1f} -> net basit "
             f"%{100 * d['dep_n']:.2f} = efektif yıllık %{100 * d['dep_eff']:.2f} (aylık %{100 * d['dep_m']:.3f})")
    if d["choice"] == "BILL":
        L.append(f"  KARAR: serbest TL nakit -> 3 AYLIK HAZİNE BONOSU merdiveni (+%{100 * (d['bill_eff'] - d['dep_eff']):.2f} "
                 f"efektif/yıl). Mevduat ancak brüt 32 gün > %{100 * d['dep_g_breakeven']:.2f} olursa tercih edilir.")
    else:
        L.append("  KARAR: serbest TL nakit -> 32 GÜN MEVDUAT"
                 + (f" (bono {100 * (d['dep_eff'] - d['bill_eff']):.2f} puan geride; başabaş brüt mevduat "
                    f"%{100 * d['dep_g_breakeven']:.2f})" if by is not None else f" ({d.get('note', '')})"))
    L.append("    Kural yalnızca yönlendirme anında uygulanır (yeni para / vadesi gelen bono veya mevduat); elde tutulan bono "
             "vadeye kadar tutulur, mevduat bozulmaz. Çekişte önce bono satılır, sonra en az faiz birikmiş mevduat bozulur.")
    days = (pd.Timestamp(P["dibs_stopaj0_until"]) - pd.Timestamp(today)).days
    if 0 <= days <= 120:
        L.append(f"  !! DİBS %0 stopaj istisnası {days} gün sonra ({P['dibs_stopaj0_until']}) bitiyor; uzatılmazsa sonraki alımlar "
                 f"%{100 * P['dibs_stopaj_after']:.0f} stopajlı -> karar mevduata dönebilir (Resmî Gazete'yi izleyin, config'i güncelleyin).")
    elif days < 0:
        L.append(f"  !! config'deki DİBS %0 stopaj tarihi geçti: yeni alımlar %{100 * P['dibs_stopaj_after']:.0f} stopajla hesaplandı.")
    return "\n".join(L), d


def buckets(B, pos, d):
    """TL kolu B için kova tutarları."""
    v = viop_split(pos); free = B - v["vc"]
    out = dict(B=B, free=free, **{f"viop_{k}": x for k, x in v.items()})
    if d["choice"] == "BILL":
        out["bill"] = free; out["dep"] = 0.0
        out["ladder"] = [free / 3] * 3
    else:
        out["bill"] = 0.0; out["dep"] = free; out["ladder"] = None
    return out


def report_buckets(B, pos, d, title=""):
    b = buckets(B, pos, d); P = C.CASH; L = []
    L.append(f"  {title}TL kolu {B:,.0f} TL:")
    if b["viop_im"] > 0:
        L.append(f"    VİOP teminatı (hedef 1.25xIM = {b['viop_vc']:,.0f} TL; IM {b['viop_im']:,.0f} TL):")
        L.append(f"      0-1 yıl DİBS (3 ay bono) {b['viop_dibs']:,.0f} TL piyasa değeri -> teminatta %{100 * P['viop_dibs_val']:.0f} ile "
                 f"{P['viop_dibs_val'] * b['viop_dibs']:,.0f} TL (= IM'in %{100 * P['viop_dibs_val'] * b['viop_dibs'] / b['viop_im']:.0f}'i, sınır %50)")
        L.append(f"      TL nakit (Takasbank nema; tahmin net ≈ %{100 * d['on_n']:.1f}/yıl, aracı kurumunuza sorun) {b['viop_tl']:,.0f} TL"
                 f" | teminat değeri toplam {b['viop_credit']:,.0f} TL = {b['viop_credit'] / b['viop_im']:.3f}xIM")
    else:
        L.append("    VİOP pozisyonu yok -> teminat kovası 0; TL kolunun tamamı serbest nakit")
    if d["choice"] == "BILL":
        l = b["ladder"]
        L.append(f"    Serbest nakit -> 3 ay bono merdiveni {b['bill']:,.0f} TL "
                 f"(ilk kurulum: ~1 ay / ~2 ay / ~3 ay vadeli {l[0]:,.0f} / {l[1]:,.0f} / {l[2]:,.0f} TL; vadesi gelen dilim yeni 3 aylığa) "
                 f"| 32 gün mevduat 0 TL")
    else:
        L.append(f"    Serbest nakit -> 32 gün mevduat {b['dep']:,.0f} TL | bono 0 TL (eldeki bonolar vadeye kadar tutulur)")
    L.append(f"    Toplam bono/DİBS {b['bill'] + b['viop_dibs']:,.0f} TL | mevduat {b['dep']:,.0f} TL | VİOP TL nakit {b['viop_tl']:,.0f} TL")
    return "\n".join(L), b
