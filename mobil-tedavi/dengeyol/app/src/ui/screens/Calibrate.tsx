/**
 * Kalibrasyon akışı (her seansın başında, ~20 s):
 *  1) Telefon elde, okuma duruşu → ivmeölçer işaret kuralı.
 *  2) Telefon alında, dik oturuş ve karşıya bakış → nötr referans.
 *  3) Başı geriye yatırıp tavana bakış → ekranın yönü ve alın eğimi düzeltmesi.
 * Telefon alındayken ekran görünmediği için 2. ve 3. adım sesli ve geri sayımlıdır.
 */
import { useEffect, useRef, useState } from 'react';
import {
  type Calibration,
  CALIBRATION_ERROR_TEXT,
  type CalibrationError,
  computeCalibration,
  detectSign
} from '../../core/calibration';
import { useMotion } from '../../platform/MotionContext';
import { collectSamples } from '../../platform/pose';
import { speech } from '../../platform/speech';
import { tones } from '../../platform/tones';
import { haptics } from '../../platform/haptics';
import { unlockAudio } from '../../platform/feedback';
import { Icon } from '../components/Icon';
import { useSimAuto } from '../components/SimPanel';
import { PhoneOnForehead } from './Illustrations';

type Stage = 'intro' | 'place' | 'upright' | 'lookup' | 'done' | 'error' | 'nosensor';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Calibrate({
  audience,
  onDone,
  onCancel,
  onNoSensor
}: {
  audience: 'patient' | 'clinician';
  onDone: (c: Calibration) => void;
  onCancel: () => void;
  /** Sensör kullanılamıyorsa (klinisyen modunda sensörsüz devam seçeneği). */
  onNoSensor?: () => void;
}) {
  const { source } = useMotion();
  const sim = useSimAuto();
  const [stage, setStage] = useState<Stage>('intro');
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Calibration | null>(null);
  const [sensorMsg, setSensorMsg] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      speech.cancel();
    };
  }, []);

  const P = audience === 'patient';
  const say = (t: string) => speech.speak(t, 'high');

  async function countdown(n: number) {
    for (let i = n; i > 0; i--) {
      if (!alive.current) return false;
      setCount(i);
      tones.play('countdown');
      await wait(1000);
    }
    setCount(0);
    return alive.current;
  }

  async function run() {
    unlockAudio();
    setError(null);
    sim.reading();
    const st = await source.start();
    if (st !== 'ok') {
      setSensorMsg(
        st === 'denied'
          ? 'Hareket sensörü izni verilmedi. Telefonun ayarlarından bu site için "Hareket ve Yönelim" iznini açın ya da sayfayı yenileyip izin verin.'
          : 'Bu cihazdan hareket sensörü verisi alınamadı. DengeYol bir akıllı telefonda çalışmalıdır. Bilgisayarda denemek için Ayarlar > Demo modunu açabilirsiniz.'
      );
      setStage('nosensor');
      return;
    }
    // 1) İşaret kuralı (telefon şu an elde, okuma duruşunda)
    const reading = await collectSamples(source, 600);
    const sign = reading ? detectSign(reading.mean) : null;
    if (!sign) {
      fail('SIGN_AMBIGUOUS');
      return;
    }
    // 2) Alına yerleştir
    setStage('place');
    say(
      P
        ? 'Telefonu ekranı dışa bakacak şekilde alnınıza yaslayın. Telefonun üst kenarı başınızın tepesine doğru olsun. Dik oturun ve tam karşıya bakın. Kıpırdamayın.'
        : 'Telefonu ekranı dışa bakacak şekilde hastanın alnına yaslayın; üst kenar başın tepesine doğru. Hasta dik oturup karşıya baksın.'
    );
    await wait(P ? 7500 : 5000);
    if (!alive.current) return;
    sim.upright();
    setStage('upright');
    if (!(await countdown(3))) return;
    const up = await collectSamples(source, 1500);
    if (!up || up.maxDevDeg > 6) {
      fail(null, P ? 'Telefon ölçüm sırasında kıpırdadı. Tekrar deneyelim; bu kez tamamen hareketsiz kalın.' : 'Ölçüm sırasında hareket oldu; tekrar deneyin.');
      return;
    }
    haptics.play('tap');
    // 3) Tavana bak
    setStage('lookup');
    say(P ? 'Şimdi başınızı yavaşça geriye yatırın ve tavana bakın. Öyle kalın.' : 'Hasta başını geriye yatırıp tavana baksın.');
    await wait(3200);
    if (!alive.current) return;
    sim.lookUp();
    if (!(await countdown(2))) return;
    const lu = await collectSamples(source, 1200);
    if (!lu || lu.maxDevDeg > 8) {
      fail(null, P ? 'Telefon ölçüm sırasında kıpırdadı. Tekrar deneyelim.' : 'Ölçüm sırasında hareket oldu; tekrar deneyin.');
      return;
    }
    const res = computeCalibration(sign, up.mean, lu.mean);
    if (!res.ok) {
      fail(res.error);
      return;
    }
    setResult(res.calibration);
    setStage('done');
    tones.play('reached');
    haptics.play('reached');
    say(P ? 'Kalibrasyon tamam. Başınızı düzeltip telefona bakabilirsiniz.' : 'Kalibrasyon tamam.');
    sim.upright();
  }

  function fail(code: CalibrationError | null, text?: string) {
    const msg = text ?? (code ? CALIBRATION_ERROR_TEXT[code] : 'Kalibrasyon başarısız.');
    setError(msg);
    setStage('error');
    tones.play('alarm');
    say(msg);
  }

  return (
    <div className="stack" data-testid="calibrate">
      {stage === 'intro' && (
        <>
          <PhoneOnForehead />
          <div className="card stack">
            <h2>{P ? 'Telefonu başınıza tanıtalım' : 'Sensör kalibrasyonu'}</h2>
            <p className="lead">
              {P
                ? 'Telefon, başınızın açısını ölçmek için alnınıza yaslanacak. Önce 20 saniyelik kısa bir ayar yapacağız.'
                : 'Telefon hastanın alnına yaslanır; ekran dışa baktığı için açıları siz görürsünüz.'}
            </p>
            <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
              <li>Şimdi telefonu normal tutun ve "Başla"ya dokunun.</li>
              <li>Sesli yönergeyle telefonu ekranı dışa bakacak şekilde alnınıza yaslayın; dik oturun, karşıya bakın.</li>
              <li>Ardından başınızı geriye yatırıp tavana bakın.</li>
            </ol>
            <p className="small muted">Sesi açık tutun. Telefonun sessiz modu kapalı olmalı.</p>
          </div>
          <button className="btn primary block xl" onClick={() => void run()} data-testid="cal-start">
            <Icon name="play" /> Başla
          </button>
          <button className="btn ghost" onClick={onCancel}>
            Vazgeç
          </button>
        </>
      )}

      {(stage === 'place' || stage === 'upright' || stage === 'lookup') && (
        <div className="card stack center" aria-live="assertive">
          <PhoneOnForehead lookUp={stage === 'lookup'} />
          <h2>
            {stage === 'place' && 'Telefonu alnınıza yaslayın'}
            {stage === 'upright' && 'Karşıya bakın, kıpırdamayın'}
            {stage === 'lookup' && 'Tavana bakın'}
          </h2>
          <p className="lead">
            {stage === 'place' && 'Ekran dışa, üst kenar yukarı. Dik oturun.'}
            {stage === 'upright' && 'Ölçülüyor…'}
            {stage === 'lookup' && 'Başınızı yavaşça geriye yatırın.'}
          </p>
          {count > 0 && <div style={{ fontSize: '3rem', fontWeight: 800 }}>{count}</div>}
        </div>
      )}

      {stage === 'done' && result && (
        <>
          <div className="card tint-ok stack" data-testid="cal-ok">
            <div className="card-title">
              <Icon name="check" />
              <h2>Kalibrasyon tamam</h2>
            </div>
            <p>
              Ekran yönü: <strong>{result.facing === 'outward' ? 'dışa (önerilen)' : 'içe'}</strong>. Telefonun alındaki eğikliği: {result.mountTiltDeg}° (otomatik
              düzeltildi).
            </p>
            {result.facing === 'inward' && (
              <p className="small">Ekran içe dönük olduğu için yanınızdaki kişi ekranı göremez; sesli yönergeler yeterlidir.</p>
            )}
          </div>
          <button className="btn primary block xl" onClick={() => onDone(result)} data-testid="cal-continue">
            Devam
          </button>
        </>
      )}

      {stage === 'error' && (
        <>
          <div className="notice danger" role="alert">
            <Icon name="alert" />
            <span>{error}</span>
          </div>
          <button className="btn primary block" onClick={() => setStage('intro')}>
            Tekrar dene
          </button>
          <button className="btn ghost" onClick={onCancel}>
            Vazgeç
          </button>
        </>
      )}

      {stage === 'nosensor' && (
        <>
          <div className="notice danger" role="alert">
            <Icon name="alert" />
            <span>{sensorMsg}</span>
          </div>
          {onNoSensor && (
            <button className="btn secondary block" onClick={onNoSensor}>
              Sensörsüz devam et (yalnız zamanlayıcı, elle onay)
            </button>
          )}
          <button className="btn ghost" onClick={onCancel}>
            Geri
          </button>
        </>
      )}
    </div>
  );
}
