/**
 * Telefon alındayken ekranın her yeri tek düğme (yeni kullanıcı turu 1, L5-4; y07). Hazırlıktaki "Hazırım" ve telefonu
 * tanıtma girişindeki "Başla" için: hareket sensörü telefonun alında, dik ve sabit durduğunu gösterince (`ForeheadDetector`)
 * kısa ses ("Telefon alnınızda. Hazırsanız ekranın herhangi bir yerine dokunun.") ve ekranın üstünde şerit; ekrana herhangi
 * bir dokunuş `onTap` olur. Yanlışlıkla atlatmaya karşı: yalnız sensör alında dediğinde ve durum açıldıktan kısa süre sonra
 * başlayan dokunuş sayılır (dokunmakta olan parmak sayılmaz); telefon indirilince (okuma duruşu) hemen kapanır ve ekrandaki
 * düğmeler olağan çalışır. Sensör verisi yoksa (iPhone'da izin henüz verilmedi, masaüstü) hiçbir şey değişmez.
 *
 * Yeni kullanıcı turu 2 (M2-5; y07 "çalışmadı"): dokunuş `click` yerine işaretçi olaylarıyla (pointerdown → pointerup)
 * yakalanır. iPhone Safari düz metne/çizime dokunuşta belgeye `click` göndermez, Android'de uzun basış `click` üretmez
 * (gözü kapalı kişi parmağını bir süre tutabilir); ardından gelen `click` yutulur (altındaki düğme ayrıca çalışmasın).
 * Demo modunda sanal telefonu alına koymak için demo paneli bu ekranlarda da açılır (`publishSimForehead`).
 */
import { useEffect, useRef, useState } from 'react';
import { motionPermissionRequired } from '../../platform/motion';
import { useMotion } from '../../platform/MotionContext';
import { speech } from '../../platform/speech';
import { ForeheadDetector } from '../screens/patient/forehead';
import { FOREHEAD_TAP_SPOKEN, FOREHEAD_TAP_TEXT } from '../screens/patient/flowText';
import { publishSimForehead } from './SimPanel';

/** Durum açıldıktan sonra bu süre içinde başlayan dokunuş sayılmaz (ms). */
export const ARM_MS = 600;
/** Dokunuş tetikledikten sonra gelen `click` bu süre içinde yutulur (ms). */
const SWALLOW_CLICK_MS = 1000;

/** Demo paneline (ve onun içindeki denetimlere) dokunuş ekranın her yeri sayılmaz. */
const isSimControl = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('[data-sim-control]');

export function ForeheadTap({ enabled, onTap, testid }: { enabled: boolean; onTap: () => void; testid: string }) {
  const { source } = useMotion();
  const [on, setOn] = useState(false);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  useEffect(() => {
    if (!enabled) {
      setOn(false);
      return;
    }
    publishSimForehead(true);
    // Android'de izin gerekmez: sensör dokunuşsuz açılabilir. iPhone'da izin ancak bir dokunuşla istenir; o zamana dek
    // (ya da önceki bir dokunuşla açılmışsa) yalnız gelen örnekler dinlenir.
    if (source.kind === 'device' && !motionPermissionRequired()) void source.start();
    const det = new ForeheadDetector();
    const off = source.subscribe((s) => {
      const v = det.push(s.gravity, s.t);
      setOn((prev) => (prev === v ? prev : v));
    });
    return () => {
      off();
      publishSimForehead(false);
      setOn(false);
    };
  }, [enabled, source]);

  useEffect(() => {
    if (!on) return;
    speech.speak(FOREHEAD_TAP_SPOKEN, 'high');
    const armedAt = performance.now();
    /** Sayılacak dokunuşun başladığı an (açılıştan ARM_MS sonra başlamış olmalı). */
    let downAt: number | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.isPrimary === false || isSimControl(e.target)) return;
      downAt = performance.now() - armedAt >= ARM_MS ? performance.now() : null;
    };
    const onUp = (e: PointerEvent) => {
      if (e.isPrimary === false || downAt === null || isSimControl(e.target)) return;
      downAt = null;
      e.preventDefault();
      // Altındaki düğme ayrıca çalışmasın: ardından gelen tek click yutulur (bileşen kapansa da).
      const until = performance.now() + SWALLOW_CLICK_MS;
      const swallow = (c: MouseEvent) => {
        document.removeEventListener('click', swallow, true);
        if (performance.now() > until) return;
        c.preventDefault();
        c.stopPropagation();
      };
      document.addEventListener('click', swallow, true);
      setTimeout(() => document.removeEventListener('click', swallow, true), SWALLOW_CLICK_MS);
      onTapRef.current();
    };
    // İşaretçi olayı olmadan gelen click (klavye: Enter/Boşluk, yardımcı teknoloji) da sayılır; düğme kendi işini yapmaz.
    const onClick = (e: MouseEvent) => {
      if (isSimControl(e.target) || performance.now() - armedAt < ARM_MS) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.detail === 0) onTapRef.current();
    };
    // Uzun basışta bağlam menüsü / metin seçimi açılmasın.
    const onMenu = (e: Event) => {
      if (!isSimControl(e.target)) e.preventDefault();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('contextmenu', onMenu, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('contextmenu', onMenu, true);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div className="forehead-tap" role="status" aria-live="assertive" data-testid={testid}>
      {FOREHEAD_TAP_TEXT}
    </div>
  );
}
