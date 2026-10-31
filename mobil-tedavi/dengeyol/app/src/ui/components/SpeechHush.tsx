/**
 * Ekran değişince süren konuşmayı susturur (tek yerden, bütün ekranlar için).
 *
 * Kullanıcı bir düğmeye/bağlantıya bastığında ya da sayfa değiştiğinde (geri tuşu, kaydırma hareketi dahil) önceki
 * ekranın cümlesi yeni ekranın üstüne konuşmaya devam etmez. Dinleyici yakalama aşamasında çalışır: susturma, düğmenin
 * kendi işinden (ör. yeni ekranın ya da "Tekrar dinle"nin konuşması) önce olur.
 *
 * Yürütücü (`.runner`) muaftır: orada ekrana dokunuş baş dönmesi işaretidir ve yürütücü kendi sesini yönetir.
 * `data-keep-speech` taşıyan öğeler de muaftır.
 */
import { useEffect } from 'react';
import { speech } from '../../platform/speech';

const INTERACTIVE = 'button, a[href], [role="button"], [role="radio"], [role="checkbox"], input[type="checkbox"], input[type="radio"], summary';

/** Tıklanan öğe konuşmayı susturmalı mı? (Saf; test edilebilir.) */
export function shouldHushOnClick(target: Element | null): boolean {
  const el = target?.closest(INTERACTIVE);
  if (!el) return false;
  if (el.closest('.runner, [data-keep-speech]')) return false;
  if (el.matches(':disabled, [aria-disabled="true"]')) return false;
  return true;
}

export function SpeechHush() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (shouldHushOnClick(e.target as Element | null)) speech.cancel();
    };
    const onRoute = () => speech.cancel();
    document.addEventListener('click', onClick, true);
    window.addEventListener('hashchange', onRoute);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('hashchange', onRoute);
    };
  }, []);
  return null;
}
