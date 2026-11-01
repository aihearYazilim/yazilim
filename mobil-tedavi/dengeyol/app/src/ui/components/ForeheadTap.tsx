/**
 * Telefon alındayken ekranın her yeri tek düğme (yeni kullanıcı turu 1, L5-4; y07). Hazırlıktaki "Hazırım" ve telefonu
 * tanıtma girişindeki "Başla" için: hareket sensörü telefonun alında, dik ve sabit durduğunu gösterince (`ForeheadDetector`)
 * kısa ses ("Telefon alnınızda. Hazırsanız ekranın herhangi bir yerine dokunun.") ve ekranın üstünde şerit; ekrana herhangi
 * bir dokunuş `onTap` olur. Yanlışlıkla atlatmaya karşı: yalnız sensör alında dediğinde ve durum açıldıktan kısa süre sonra
 * (dokunmakta olan parmak sayılmaz); telefon indirilince (okuma duruşu) hemen kapanır ve ekrandaki düğmeler olağan çalışır.
 * Sensör verisi yoksa (iPhone'da izin henüz verilmedi, masaüstü) hiçbir şey değişmez.
 */
import { useEffect, useRef, useState } from 'react';
import { motionPermissionRequired } from '../../platform/motion';
import { useMotion } from '../../platform/MotionContext';
import { speech } from '../../platform/speech';
import { ForeheadDetector } from '../screens/patient/forehead';
import { FOREHEAD_TAP_SPOKEN, FOREHEAD_TAP_TEXT } from '../screens/patient/flowText';

/** Durum açıldıktan sonra bu süre içindeki dokunuş sayılmaz (ms). */
const ARM_MS = 600;

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
      setOn(false);
    };
  }, [enabled, source]);

  useEffect(() => {
    if (!on) return;
    speech.speak(FOREHEAD_TAP_SPOKEN, 'high');
    const armedAt = performance.now();
    const onClick = (e: MouseEvent) => {
      if (performance.now() - armedAt < ARM_MS) return;
      // Dokunulan düğme kendi işini yapmasın: ekranın her yeri aynı anlama gelir.
      e.preventDefault();
      e.stopPropagation();
      onTapRef.current();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [on]);

  if (!on) return null;
  return (
    <div className="forehead-tap" role="status" aria-live="assertive" data-testid={testid}>
      {FOREHEAD_TAP_TEXT}
    </div>
  );
}
