"""CANLI SİNYAL ARACI — elle güncellenecek tablolar ve araştırmada SABİTLENMİŞ parametreler.

!!! GÜNCELLEME NOTU !!!
  * POLICY_DECISIONS: her TCMB PPK toplantısından sonra yeni satır ekleyin (karar tarihi, politika faizi %).
    Kaynak: https://www.tcmb.gov.tr  -> Para Politikası Kurulu Basın Duyuruları.
    Faiz karar tarihinden SONRAKİ iş günü geçerli sayılır (araştırmadaki audit_lib.corrected_rates ile aynı).
  * CPI_YOY: her ayın ~3'ünde TÜİK önceki ayın TÜFE'sini açıklar; yeni ayı ekleyin (ay = ölçülen ay, değer = yıllık %).
    Kaynak: https://data.tuik.gov.tr  (Tüketici Fiyat Endeksi bülteni).  Araştırma kuralı: ay m'nin TÜFE'si
    (m+1)-ayının 5'inden itibaren kullanılabilir (cpi_avail = ay başı + 1 ay + 4 gün).
  * Değerler research/try_carry_audit/audit_lib.py (POL_DECISIONS) ve research/try_carry/data_prep.py (CPI_TAIL)
    tablolarından kopyalandı (son güncelleme 2026-10-18).  2026-05 TÜFE (%32.61) DİSK bülteninden, teyitsiz.
Hiçbir strateji parametresi burada yeniden optimize edilmedi; hepsi TOP3.md / REPORT_v6 (v5: REPORT_v5) / options2 /
viop_options / crypto_events(_audit) raporlarıyla aynı.
"""

# ---------------- TCMB politika faizi kararları (karar tarihi, %) ----------------
POLICY_DECISIONS = [
    ("2023-06-22", 15), ("2023-07-20", 17.5), ("2023-08-24", 25), ("2023-09-21", 30), ("2023-10-26", 35),
    ("2023-11-23", 40), ("2023-12-21", 42.5), ("2024-01-25", 45), ("2024-03-21", 50), ("2024-12-26", 47.5),
    ("2025-01-23", 45), ("2025-03-06", 42.5), ("2025-04-17", 46), ("2025-07-24", 43), ("2025-09-11", 40.5),
    ("2025-10-23", 39.5), ("2025-12-11", 38), ("2026-01-22", 37),
    # !!! HATIRLATMA: 22 Ekim 2026 PPK kararı açıklanınca buraya ekleyin -> ("2026-10-22", yeni_faiz),
    #     (23.10.2026'dan itibaren geçerli sayılır; eklenmezse reel faiz filtresi eski faizle hesaplanır)
    # ("2026-xx-xx", yeni_faiz),   <- sonraki PPK kararlarını da buraya ekleyin
]

# ---------------- TÜFE yıllık % (TÜİK), ölçülen ay ----------------
CPI_YOY = {
    "2025-05": 35.41, "2025-06": 35.05, "2025-07": 33.52, "2025-08": 32.95, "2025-09": 33.29,
    "2025-10": 32.87, "2025-11": 31.07, "2025-12": 30.89, "2026-01": 30.65, "2026-02": 31.53,
    "2026-03": 30.87, "2026-04": 32.37, "2026-05": 32.61, "2026-06": 32.11, "2026-07": 31.75,
    "2026-08": 31.51, "2026-09": 29.73,
    # "2026-10": ...,   <- Kasım başında TÜİK açıklayınca ekleyin
}

# ---------------- 1) TL taşıma (try_carry R3, audited; combo_v5) ----------------
CARRY = dict(
    target_vol=0.30,      # yıllık vol hedefi
    vol_window=20,        # gün, log getiri std * sqrt(260)
    real_th=5.0,          # reel faiz eşiği (%), politika - TÜFE yıllık > 5 ise açık
    lag=1,                # sinyal t-1, işlem t uzlaşma fiyatından
    roll_cal_days=4,      # vadeye <= 4 takvim günü kalınca bir sonraki vadeye geç
    im=0.11,              # başlangıç teminatı (nominalin %11'i)
    maint=0.0825,         # sürdürme teminatı (0.75 x IM)
    contract_usd=1000.0,  # VİOP USDTRY sözleşme büyüklüğü
    cash_lo=1.00, cash_mid=1.25, cash_hi=1.75,   # VİOP nakit bandı (x IM): <1.0 ise 1.25'e tamamla, >1.75 ise 1.25'e indir
    band_abs=0.10, band_rel=0.20,                # yeniden boyutlama bandı: |hedef-mevcut| > max(0.1, 0.2*hedef)
    tc=0.0005,            # işlem maliyeti (tek yön)
)
LMAX = {1: 5, 3: 3}       # TOP3 #1 -> Lmax 5, TOP3 #3 (güvenli) -> Lmax 3

# ---------------- 2) Deribit (options2 REPORT #1 = TOP3 #2) ----------------
DERIBIT = dict(
    delta=0.40,           # haftalık kısa strangle deltası (call +0.40 / put -0.40)
    tenor_days=7,         # Cuma 09:00 UTC giriş, bir sonraki Cuma 08:00 UTC vade
    hedge_delta=0.10,     # uzun koruma putu deltası
    hedge_min_days=25, hedge_max_days=45, hedge_target_days=30,   # 25-45 gün arası, 30 güne en yakın vade
    hedge_ratio=1.0,      # koruma putu nominali = strangle nominali; yalnızca canlı koruma yokken alınır
    size=2.0,             # 2x nominal: coin sayısı = 2 * 0.5 * özsermaye / spot (BTC ve ETH yarı yarıya)
    dvol_look=365,        # DVOL > son 365 günlük medyan ise sat (giriş gününden önceki gün kapanışı)
    min_lot={"BTC": 0.1, "ETH": 1.0},   # Deribit asgari opsiyon miktarı
)

# ---------------- 3) BIST-C (bist_all sabit konfig; sleeves_v2.CFG) ----------------
BIST = dict(
    top=20, rebalance=21, lag=1, min_turn=5e6, min_hist=120, research_capital=1_000_000,
    calendar_start="2018-06-01",   # araştırma takviminin başlangıcı (bilgi)
    anchor="2026-09-30",           # araştırma takvimindeki SON dengeleme günü; sonrası her 21 XU100 işlem gününde bir
    fee=0.0014,
)

# ---------------- 6) Karma ağırlıklar ----------------
# v6 (VARSAYILAN; research/combo/combo_v6.py -> results/weights_v6.json, VİOP teminatı 'dibs1' = nema var):
#   sıra (TL taşıma+nakit, Deribit, BIST-C, XU030 put spread, kripto olay kitabı); yalnızca IS (2022-01..2025-10-16)
#   haftalık TRY vol'lerinin tersiyle (IV4: olay yok, IV5: olay %10 sabit) seçildi.  Yuvarlanmış TOP3.md değerleri yorumda.
COMBO_W6 = {1: (0.6281, 0.0870, 0.1671, 0.1178, 0.0),   # TOP3 #1  IV4, Lmax 5   63/9/17/12/0  (yasal gri alan yok)
            2: (0.5653, 0.0783, 0.1503, 0.1060, 0.1),   # TOP3 #2  IV5, Lmax 5   57/8/15/11/10 (olay kitabı gri alan)
            3: (0.6438, 0.0600, 0.1151, 0.0811, 0.1)}   # TOP3 #3  IV5, Lmax 3   64/6/12/8/10  (güvenli)
LMAX6 = {1: 5, 2: 5, 3: 3}
SLEEVES6 = ("TL taşıma+nakit", "Deribit", "BIST-C", "XU030 PS", "Olay")
# v5 (eski; --weights v5 ile): (TL taşıma+mevduat, Deribit, BIST-C), results/weights_v5.json, size 2
COMBO_W = {1: (0.7598, 0.0712, 0.1690),   # v5 TOP3 #1: ters-vol, Lmax 5
           3: (0.8255, 0.0517, 0.1228)}   # v5 TOP3 #3: ters-vol, Lmax 3 (güvenli)
FEE_O = 0.002   # TL -> USD(C) transfer maliyeti (combo_v5/v6 FEE_O; olay kolu FEE_E da 0.002)

# ---------------- 4) XU030 20Δ/5Δ put spread (viop_options #1; combo_v6 XU kolu; sim.run struct='PS') ----------------
XU030 = dict(
    short_delta=0.20,     # kısa put |Δ| (Black-76, opsiyonun kendi IV'si)
    wing_delta=0.05,      # uzun koruma putu |Δ|; strike < kısa put strike'ı
    delta_tol=0.12,       # en yakın listelenmiş strike'ın |Δ| farkı bundan büyükse işlem yok
    lev=5.0,              # nominal = 5 x kol özsermayesi:  birim q0 = 5*E/F  (her bacak), adet = q0/çarpan
    mult=10.0,            # TL / endeks puanı / sözleşme (XU030 opsiyon, 2020 sonrası ölçek)
    entry_day=0,          # ayın 1. VİOP işlem günü (0 = ilk), vadeye kadar tut (mode 'hold')
    min_dte=20, max_dte=75,   # giriş gününde vadeye 20-75 gün kalan EN YAKIN vade
    iv_look=252, iv_min=120,  # filtre: ATM IV > son 252 işlem günü ATM IV medyanı (en az 120 gün; bugünkü değer dahil)
    atm_dte=(15, 70),     # ATM IV tanımı (vrp.py): 15-70 gün vadeli en yakın vade, |ln K/F| en küçük 2 call + 2 put ortalaması
    liq="oi",             # kısa put: açık pozisyon > 0 ya da hacim > 0 olan strike'lar; koruma putu: hepsi
    scan=0.12, scan_iv=1.25,  # teminat yaklaşımı: vadeli ±%12 senaryo, IV x1.25, en kötü kayıp (Takasbank SPAN değil!)
    cost=0.11,            # giriş/çıkış maliyeti: prim x (%10 ölçülmüş yarım spread + %1 komisyon)
    stopaj=0.10,          # çeyreklik pozitif VİOP kârına %10 stopaj (simülasyonda)
    cap_tl=1_000_000.0,   # kapasite: kol <= 1M TL x XU030(t) / XU030(2025-10-16); fazlası TL taşıma+nakit koluna
    cap_ref_level=11267.30,   # XU030 kapanış 2025-10-16 (data/bist/XU030.csv)
    gap=(-0.10, -0.15), gap_iv=1.5,   # stres: anlık vadeli boşluğu, IV x1.5 (sleeves_v6.gap_table)
)
# Resmi tatiller (VİOP kapalı) — ayın ilk işlem gününü bulmak için; yıllık güncelleyin (arife yarım günleri açık sayılır)
TR_HOLIDAYS = ["2026-01-01", "2026-03-20", "2026-04-23", "2026-05-01", "2026-05-19", "2026-05-27", "2026-05-28",
               "2026-05-29", "2026-07-15", "2026-10-29", "2027-01-01", "2027-03-10", "2027-03-11", "2027-03-12",
               "2027-04-23", "2027-05-17", "2027-05-18", "2027-05-19", "2027-07-15", "2027-10-29"]
# (2027 dini bayram günleri yaklaşık; Borsa İstanbul tatil takviminden teyit edin)

# ---------------- 5) Kripto olay kısaları (crypto_events_audit senaryo B, s=0.10; yalnızca #2/#3, en fazla %10) ----------------
EVENTS = dict(
    s=0.10,               # işlem başı nominal = 0.10 x olay kolu özsermayesi
    gross=2.0,            # toplam açık kısa nominal <= 2 x kol özsermayesi
    hedge="BTC",          # BTCUSDT perp uzun = açık kısaların toplam nominali (günlük ayarla)
    liq=0.01, min_frac=0.2,   # işlem <= %1 x 7 günlük ort. perp USDT hacmi; s'nin %20'sinden azı sığıyorsa atla
    unl_thr=0.10, unl_pre=10, unl_post=3, unl_stop=1.0,   # kilit açılımı >= %10 arz: açılımdan 10 gün ÖNCE kapanışta kısa,
                                                          # 3 gün SONRA kapanışta kapat, stop +%100 (UTC günlük kapanış)
    unl_min_age=30,       # perp açılımdan >= 30 gün önce işlem görüyor olmalı
    book={"MON": (168, 0.50), "DEL": (72, 0.20), "LIST": (720, 0.20)},   # duyuru tipi: (tutma saati, stop)
    cms_min_age=3,        # perp duyurudan >= 3 gün önce işlem görüyor olmalı
    slip_in=0.005, slip_stop=0.01,   # senaryo B yürütme kayması (giriş %0.5, stop %1)
    cms_catalogs=(161, 48, 49, 93),
)

# ---------------- 0) TL NAKİT KOLU (research/cash_upgrade REPORT; cashlib BEST3 + combo_cash 'dibs1') ----------------
#   Kural: serbest TL nakit -> 3 aylık hazine bonosu merdiveni  VEYA  32 gün mevduat; yönlendirme anında bugün bilinen
#   VERGİ SONRASI efektif yıllık getirisi yüksek olan (bono: (1+y*T)^(1/T), T=0.25; mevduat: (1+r*32/365)^(365/32)).
#   VİOP teminatı: gereken başlangıç teminatının (IM) en fazla %50'si 0-1 yıl DİBS (Takasbank/QNB değerlemesi %97),
#   kalan VİOP nakdi TL (Takasbank nema).  Parametreler araştırmayla aynı; yeniden optimize edilmedi.
#
# !!! GÜNCELLEME NOTU (nakit kolu) !!!
#   * DEP_32D_GROSS: kullandığınız bankanın 32 günlük TL mevduat BRÜT basit yıllık faizi (%).  Kaynaklar: kendi
#     bankanızın internet şubesi / faiz tablosu; piyasa ortalaması için TCMB EVDS "Mevduat faizleri - TL, 3 aya kadar
#     vadeli (akım, haftalık)" ya da TCMB haftalık "Bankalarca Açılan Mevduatlara Uygulanan Ağırlıklı Ortalama
#     Faiz Oranları" bülteni.  Bileşik yazılmış oranı basite çevirin: s = 12*((1+c)^(1/12)-1).
#     Varsayılan 36.4 = research/combo/deposit_v5.DEP 2026-10 (TCMB 09.10.2026 ağırlıklı ortalama, basit).
#   * BILL_3M_OVERRIDE: None ise worldgovernmentbonds.com 3 aylık TR getirisi (7 iş günü kayan medyan) kullanılır.
#     Gerçek alım teklifiniz (banka / aracı kurum DİBS ekranı, Hazine ihale sonuçları https://www.hmb.gov.tr ,
#     Borsa İstanbul Borçlanma Araçları Piyasası bülteni) varsa buraya basit yıllık % olarak yazın, ör. 33.1.
#     Not: wgb bono getirileri bülten ikincil piyasa getirilerinin ~1-1.5 puan ALTINDA (araştırma; muhafazakâr).
#   * DIBS stopajı: 22.12.2021 - 31.12.2026 arasında ALINAN DİBS'lerde %0 (GVK geçici 67, Cumhurbaşkanı kararları;
#     Yapı Kredi 2026 vergi tablosu).  Süre uzatılırsa DIBS_STOPAJ0_UNTIL'i güncelleyin; aksi halde %10 uygulanır.
#   * Mevduat stopajı: <=6 ay vadeli TL mevduat %17.5 (09.07.2025 kararı, 11444 ile 31.12.2026'ya uzatıldı).
#     Resmî Gazete'de yeni karar çıkarsa DEP_STOPAJ'ı güncelleyin.
CASH = dict(
    dep_32d_gross=36.4,             # % basit yıllık, 32 gün TL mevduat (brüt)
    dep_stopaj=0.175,               # mevduat stopajı
    dep_stopaj_until="2026-12-31",  # bu tarihe kadar açılan/yenilenen hesaplar için geçerli (bilgi; sonrasını kontrol edin)
    dep_term=32,                    # gün
    on_factor=0.85,                 # gecelik/günlük hesap = 0.85 x 32 gün brüt (deposit_v5 ON_FACTOR; VİOP nema tahmini)
    bill_3m_override=None,          # % basit yıllık; None -> worldgovernmentbonds
    bill_median_days=7,             # wgb serisi: son 7 iş günü kayan medyan (cashlib.load_yields)
    bill_tenor_m=3,                 # merdiven vadesi (ay)
    bill_spread=0.0025,             # alış-satış farkı (basit getiri, gidiş-dönüş); alış = orta - spread/2
    dibs_stopaj0_until="2026-12-31",  # bu tarihe kadar ALINAN DİBS'ler %0 stopaj
    dibs_stopaj_after=0.10,         # sonrası (uzatılmazsa)
    viop_dibs_max=0.50,             # VİOP IM gereksiniminin en fazla %50'si TL dışı/DİBS teminat
    viop_dibs_val=0.97,             # 0-1 yıl DİBS teminat değerlemesi
)
