/**
 * Kalibrasyon akışı (her seansın başında, ~20 s):
 *  1) Telefon elde, okuma duruşu → ivmeölçer işaret kuralı.
 *  2) Telefon alında, dik oturuş ve karşıya bakış → nötr referans.
 *  3) Başı geriye yatırıp tavana bakış → ekranın yönü ve alın eğimi düzeltmesi.
 * Telefon alındayken ekran görünmediği için 2. ve 3. adım sesli ve geri sayımlıdır.
 * Ekran çevirme ayarı (settings.screenFlip) açıksa alındaki adımlar yürütücüdeki gibi 180° döner (başucundaki kişi için);
 * giriş ekranı dönmez (işaret kuralı telefon elde, normal okuma duruşunda ölçülür).
 * Geri tuşu / kenardan kaydırma kalibrasyonu sessizce kapatmaz: ölçüm durur, sesle söylenir ve çıkış onayı sorulur.
 */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { estimateSpeechSec } from '../../core/runner';
import { store, useData } from '../../state/store';
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
import { keepAwake } from '../../platform/wakeLock';
import { isIos } from '../../platform/reminders';
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
  const [exitAsk, setExitAsk] = useState(false);
  const flipped = !!useData().settings.screenFlip;
  const alive = useRef(true);
  /** Her "Başla" yeni bir ölçüm kuşağı açar; geri tuşu kuşağı geçersiz kılarak süren ölçümü durdurur. */
  const runGen = useRef(0);
  const stageRef = useRef<Stage>('intro');
  stageRef.current = stage;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      speech.cancel();
    };
  }, []);

  const P = audience === 'patient';

  // Geri tuşu koruması (yürütücüdeki gibi): geçmişe bir girdi eklenir; geri gelince ölçüm durur ve çıkış onayı sorulur.
  useEffect(() => {
    const marker = { dengeyolCalibrate: true };
    window.history.pushState(marker, '');
    const onPop = () => {
      // Hâlâ kendi girdimizdeysek (ör. geliştirme modunda çift bağlama) kullanıcı geri basmamıştır.
      if ((window.history.state as { dengeyolCalibrate?: boolean } | null)?.dengeyolCalibrate) return;
      window.history.pushState(marker, '');
      // Süren ölçüm (henüz giriş ekranındaki ilk okuma dahil) durur.
      runGen.current++;
      setCount(0);
      const st = stageRef.current;
      if (st === 'place' || st === 'upright' || st === 'lookup' || st === 'done') {
        setStage('intro');
        speech.speak(
          audience === 'patient' ? 'Durdurdum. Telefonu alnınızdan alıp ekrana bakın.' : 'Kalibrasyon durduruldu.',
          'high'
        );
      }
      setExitAsk(true);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Kendi girdimiz hâlâ en üstteyse temizle (adres değişmez).
      if ((window.history.state as { dengeyolCalibrate?: boolean } | null)?.dengeyolCalibrate) window.history.back();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finished = useRef(false);
  const finish = (c: Calibration) => {
    if (finished.current) return;
    finished.current = true;
    onDone(c);
  };
  const say = (t: string) => speech.speak(t, 'high');
  /** Söyler ve konuşma bitene kadar (tahmini) + ek süre bekler: ölçüm yönerge bitmeden başlamasın. */
  const sayAndWait = async (t: string, extraMs: number) => {
    const st = store.get().settings;
    const est = st.speech ? estimateSpeechSec(t, st.speechRate) * 1000 : 0;
    // Konuşmanın gerçek bitişini bekle (yavaş seslerde tahmin yetmez); olay gelmezse tahminin 2 katı + 2 s.
    if (st.simulation) {
      say(t);
      await wait(est);
    } else await speech.speakAsync(t, est * 2 + 2000);
    await wait(extraMs);
  };

  async function countdown(n: number, live: () => boolean) {
    for (let i = n; i > 0; i--) {
      if (!live()) return false;
      setCount(i);
      tones.play('countdown');
      if (P) say(String(i));
      await wait(1000);
    }
    if (!live()) return false;
    setCount(0);
    return true;
  }

  async function run() {
    const my = ++runGen.current;
    const live = () => alive.current && runGen.current === my;
    setExitAsk(false);
    unlockAudio();
    void keepAwake();
    setError(null);
    sim.reading();
    const st = await source.start();
    if (!live()) return;
    if (st !== 'ok') {
      setSensorMsg(
        st === 'denied'
          ? isIos()
            ? 'Hareket sensörü izni verilmedi. Telefonun Ayarlar > Safari bölümünden "Hareket ve Yönelim Erişimi"ni açın ya da sayfayı yenileyip izin verin.'
            : 'Hareket sensörü izni verilmedi. Tarayıcının site ayarlarından "Hareket sensörleri" iznini açın ya da sayfayı yenileyip izin verin.'
          : !window.isSecureContext
            ? 'Hareket sensörü yalnızca güvenli (https://) adreste çalışır. Uygulamayı https ile başlayan adresinden açın.'
            : 'Bu cihazdan hareket sensörü verisi alınamadı. Telefonun ayarlarında bu site için "Hareket sensörleri" izni kapalı olabilir. Bilgisayarda denemek için Ayarlar > Demo modunu açabilirsiniz.'
      );
      setStage('nosensor');
      return;
    }
    // 1) İşaret kuralı (telefon şu an elde, okuma duruşunda)
    const reading = await collectSamples(source, 600);
    if (!live()) return;
    const sign = reading ? detectSign(reading.mean) : null;
    if (!sign) {
      fail('SIGN_AMBIGUOUS');
      return;
    }
    // 2) Alına yerleştir
    setStage('place');
    await sayAndWait(
      P
        ? 'Telefonun arkasını alnınıza yaslayın; ekranı karşıya baksın, üst kenarı saçlarınıza doğru olsun. Dik oturun ve tam karşıya bakın. Kıpırdamayın.'
        : 'Telefonu ekranı size bakacak şekilde hastanın alnına yaslayın; üst kenar saç çizgisine doğru. Hasta dik oturup karşıya baksın.',
      P ? 2500 : 1500
    );
    if (!live()) return;
    sim.upright();
    setStage('upright');
    if (!(await countdown(3, live))) return;
    const up = await collectSamples(source, 1500);
    if (!live()) return;
    if (!up || up.maxDevDeg > 6) {
      fail(null, P ? 'Telefon ölçüm sırasında kıpırdadı. Tekrar deneyelim; bu kez tamamen hareketsiz kalın.' : 'Ölçüm sırasında hareket oldu; tekrar deneyin.');
      return;
    }
    haptics.play('move');
    tones.play('move');
    // 3) Tavana bak
    setStage('lookup');
    await sayAndWait(
      P
        ? 'Şimdi başınızı yavaşça, zorlamadan, rahat olduğunuz kadar geriye yatırın ve tavana bakın. Öyle kalın.'
        : 'Hastanın başını zorlamadan geriye yatırıp tavana baktırın.',
      1200
    );
    if (!live()) return;
    sim.lookUp();
    if (!(await countdown(2, live))) return;
    const lu = await collectSamples(source, 1200);
    if (!live()) return;
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
    sim.upright();
    if (P) {
      // Hasta modunda ayrı onay ekranı yok: cümle bitince kendiliğinden devam (sonraki yönerge onu kesmesin).
      // Ses kapalıysa da "tanındı" en az 1,5 s görünür.
      await Promise.all([sayAndWait('Tamam, telefon tanındı. Başınızı düzeltin ve telefonu alnınızda tutun; başlıyoruz.', 300), wait(1500)]);
      if (live()) finish(res.calibration);
    } else say('Kalibrasyon tamam.');
  }

  function fail(code: CalibrationError | null, text?: string) {
    const msg = text ?? (code ? CALIBRATION_ERROR_TEXT[code] : 'Kalibrasyon başarısız.');
    setError(msg);
    setStage('error');
    tones.play('alarm');
    say(msg);
  }

  const exitCard = exitAsk && (
    <div className="card tint-warn stack" role="alertdialog" aria-live="assertive" data-testid="cal-exit-ask">
      <strong>{P ? 'Telefonu tanıtmadan çıkmak istiyor musunuz?' : 'Kalibrasyondan çıkmak istiyor musunuz?'}</strong>
      <p className="small">
        {P
          ? 'Ölçüm durduruldu. Kalmak isterseniz "Başla"ya yeniden dokunun; çıkarsanız ana ekrana dönersiniz.'
          : 'Ölçüm durduruldu. Çıkarsanız muayene ekranına dönersiniz.'}
      </p>
      <div className="row wrap">
        <button type="button" className="btn secondary grow" onClick={() => setExitAsk(false)} data-testid="cal-exit-stay">
          Kal
        </button>
        <button type="button" className="btn ghost grow" onClick={onCancel} data-testid="cal-exit-leave">
          Evet, çık
        </button>
      </div>
    </div>
  );

  // Alındaki adımlar: ekran çevirme açıksa yürütücüdeki gibi tam ekran ve 180° döner.
  const onForehead = stage === 'place' || stage === 'upright' || stage === 'lookup' || stage === 'done';
  const wrap = (children: ReactNode) =>
    flipped && onForehead ? (
      <div className="runner flipped" data-testid="calibrate-flipped">
        <div className="runner-body" style={{ justifyContent: 'center' }}>
          {children}
        </div>
      </div>
    ) : (
      children
    );

  return (
    <div className="stack" data-testid="calibrate">
      {exitCard}
      {wrap(
        <>
          {stage === 'intro' && (
            <>
              <PhoneOnForehead />
              <div className="card stack">
                <h2>{P ? 'Telefonu başınıza tanıtalım' : 'Sensör kalibrasyonu'}</h2>
                <p className="lead">
                  {P
                    ? 'Telefon, başınızın açısını ölçmek için alnınıza yaslanacak. Önce yaklaşık 30 saniyelik kısa bir ayar yapacağız (yalnız ilk kullanımda).'
                    : 'Telefon hastanın alnına yaslanır; ekran dışa baktığı için açıları siz görürsünüz.'}
                </p>
                {P ? (
                  <p>Telefonu elinizde normal tutup "Başla"ya dokunun; sonra nereye koyacağınızı sesle söyleyeceğim.</p>
                ) : (
                  <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Telefonu elinizde normal tutup "Başla"ya dokunun (cihazın yön kuralı ölçülür).</li>
                    <li>Telefonu ekranı size bakacak şekilde hastanın alnına yaslayın; hasta dik oturup karşıya baksın.</li>
                    <li>Ardından hastanın başını geriye yatırıp tavana baktırın.</li>
                  </ol>
                )}
                <button className="btn primary block xl" onClick={() => void run()} data-testid="cal-start">
                  <Icon name="play" /> Başla
                </button>
                {P && (
                  <button
                    className="btn ghost"
                    onClick={() => {
                      unlockAudio();
                      tones.play('test');
                      say('Beni duyuyor musunuz? Duyuyorsanız Başla düğmesine dokunun.');
                    }}
                    data-testid="cal-sound-test"
                  >
                    <Icon name="volume" /> Sesi dene: beni duyuyor musunuz?
                  </button>
                )}
                {P && !speech.usable() && (
                  <div className="notice small" data-testid="cal-no-voice">
                    <Icon name="alert" />
                    <span>Bu telefonda Türkçe sesli okuma bulunamadı. Bir yakınınızın yanınızda olmasını ve yönergeleri ekrandan okumasını öneririz.</span>
                  </div>
                )}
                <p className="small muted">Sesi açık tutun; telefonun sessiz modu kapalı olmalı.</p>
                {flipped && (
                  <p className="small muted" data-testid="cal-flip-note">
                    Ekran çevirme açık: telefon alna yaslanınca ekran, başucundaki kişinin okuyabileceği gibi ters döner.
                  </p>
                )}
              </div>
        </>
      )}

      {(stage === 'place' || stage === 'upright' || stage === 'lookup') && (
        <div className="card stack center" aria-live="assertive">
          <PhoneOnForehead lookUp={stage === 'lookup'} />
          <h2>
            {stage === 'place' && (P ? 'Telefonu alnınıza yaslayın' : 'Telefonu hastanın alnına yaslayın')}
            {stage === 'upright' && (P ? 'Karşıya bakın, kıpırdamayın' : 'Hasta karşıya baksın, kıpırdamasın')}
            {stage === 'lookup' && (P ? 'Tavana bakın' : 'Hasta tavana baksın')}
          </h2>
          <p className="lead">
            {stage === 'place' && (P ? 'Telefonun arkası alnınızda, ekran karşıya baksın. Dik oturun.' : 'Ekran size baksın, üst kenar saç çizgisine doğru.')}
            {stage === 'upright' && 'Ölçülüyor…'}
            {stage === 'lookup' && (P ? 'Başınızı yavaşça geriye yatırın.' : 'Başını yavaşça geriye yatırsın.')}
          </p>
          {count > 0 && <div style={{ fontSize: '3rem', fontWeight: 800 }}>{count}</div>}
        </div>
      )}

      {stage === 'done' && result && (
        <>
          <div className="card tint-ok stack" data-testid="cal-ok">
            <div className="card-title">
              <Icon name="check" />
              <h2>{P ? 'Telefon tanındı' : 'Kalibrasyon tamam'}</h2>
            </div>
            {!P && (
              <p>
                Ekran yönü: <strong>{result.facing === 'outward' ? 'dışa (önerilen)' : 'içe'}</strong>. Telefonun alındaki eğikliği: {result.mountTiltDeg}°
                (otomatik düzeltildi).
              </p>
            )}
            {result.facing === 'inward' && (
              <p className="small">Ekran içe dönük olduğu için yanınızdaki kişi ekranı göremez; sesli yönergeler yeterlidir.</p>
            )}
          </div>
          <button className="btn primary block xl" onClick={() => finish(result)} data-testid="cal-continue">
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
              {P ? 'Sensörsüz devam et (açı ölçülmez; yönergeyle ilerlenir)' : 'Sensörsüz devam et (yalnız zamanlayıcı, elle onay)'}
            </button>
          )}
          <button className="btn ghost" onClick={onCancel}>
            Geri
          </button>
        </>
      )}
        </>
      )}
    </div>
  );
}
