/** "Titreşimleri tanı": her titreşim desenini anlamıyla birlikte tek tek çalar (sesi duymakta zorlanan kullanıcı, k04). */
import { applySettings } from '../../platform/feedback';
import { HAPTIC_LEGEND, haptics, type HapticPattern } from '../../platform/haptics';
import { tones } from '../../platform/tones';
import { useData } from '../../state/store';

export function HapticLegend() {
  const s = useData().settings;
  const supported = haptics.supported();
  const play = (p: HapticPattern) => {
    applySettings({ ...s, haptics: true });
    haptics.play(p);
    // Titreşimi olmayan cihazda (iPhone) eşlik eden ton duyulsun.
    if (!supported) tones.play('test');
    // Kullanıcının ayarı geri gelsin (deneme düğmesi titreşim kapalıyken de çalar).
    applySettings(s);
  };
  return (
    <div className="stack" data-testid="haptic-legend">
      {!supported && (
        <p className="small muted">
          Bu cihaz ya da tarayıcı titreşimi desteklemiyor (iPhone'da Safari titreşim vermez). Yönlendirme ses ve bip tonlarıyla yapılır.
        </p>
      )}
      {supported && !s.haptics && <p className="small muted">Titreşim ayarı şu an kapalı: deneme çalar ama manevrada titreşim gelmez (Ayarlar &gt; Titreşim).</p>}
      {HAPTIC_LEGEND.map((h) => (
        <button key={h.pattern} type="button" className="btn secondary block" onClick={() => play(h.pattern)} data-testid={`haptic-${h.pattern}`}>
          {h.label}
        </button>
      ))}
      <p className="small muted">Bir düğmeye dokunun ve telefonu elinizde tutarak titreşimi hissedin. Manevrada telefon alnınızdayken aynı titreşimler gelir.</p>
    </div>
  );
}
