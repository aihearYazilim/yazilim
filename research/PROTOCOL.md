# Araştırma Protokolü (tüm ajanlar uyar)

Hedef: komisyon+kayma+fonlama+vergi sonrası NET aylık geometrik getiri >= %10,
özellikle son 12 ayda (2025-10-17 .. 2026-10-16). Faizin 2 katı ise aylık >= %5.3 alt hedef.

Geçerlilik kuralları (overfitting tuzağına düşmemek için ZORUNLU):
1. Look-ahead yok: t anındaki karar sadece t ve öncesi veriyi kullanır, t+1'den itibaren uygulanır.
2. Walk-forward: parametreler HER test penceresi için sadece önceki veriyle seçilir
   (örn. her ay yeniden: son 24 ayın en iyi parametresi -> sonraki 1 ay). Raporlanan OOS getirisi bu zincirdir.
   Sabit parametreli strateji ise parametreler 2025-10-17 öncesine göre seçilmiş olmalı.
3. Son 12 ay (OOS) parametre seçiminde ASLA kullanılmaz.
4. Gerçekçi maliyet: kripto spot %0.15/işlem, kripto vadeli %0.10/işlem + gerçek/varsayılan fonlama,
   BIST %0.14/işlem, saatlik veride ek kayma. Likidite: günlük hacmin %1'inden fazla pozisyon yok (100k$/1M TL sermaye varsayımı).
5. Denenen kombinasyon sayısını raporla (çoklu test). Tek parametre değişince çöken sonuç geçersizdir (komşu parametreler de iyi olmalı).
6. Raporla: IS aylık geo, OOS aylık geo, OOS max düşüş, OOS en kötü ay, işlem sayısı, kombinasyon sayısı.

Veri: /home/user/yazilim/data (crypto/*.csv Binance günlük, bist/*.csv Yahoo günlük, TRY).
Binance: https://data-api.binance.vision/api/v3/klines (spot). Yahoo: query2.finance.yahoo.com, User-Agent: Mozilla/5.0.
Motor: /home/user/yazilim/src/engine.py (backtest, stats, cash_rate_daily).

## Kullanıcı kısıtları (2026-10-18)
- Yatırım fonu YOK (TEFAS fonları, para piyasası fonu dahil). Boşta TL nakit: bank mevduatı / VİOP nakit teminat (net ~politika faizi × 0.85, %17.5 stopaj sonrası; mevduat stopajı ayrıca araştırılmalı).
- Halka arz YOK (kişi başı tahsis çok küçük).
