/**
 * Hasta modu ilk kurulum: bilgilendirme ve onay → tanı bilgisi → kontrendikasyonlar → kapı kararı.
 * Düzenlemede ("Bilgilerimi düzenle") onay işaretli gelir ve ilgili adımdan açılır. Adım adresle de seçilebilir:
 * `#/hasta/kurulum?adim=uygunluk` (kontrendikasyonlar), `?adim=tani` (tanı), `?adim=baslangic` (bilgilendirme).
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CONTRA_NOT_BLOCKING_TEXT,
  contraDoctorQuestions,
  CONTRAINDICATIONS,
  contraindicationsFor,
  diagnosisGate,
  GATE_TEXT,
  type CanalAnswer,
  type SideAnswer
} from '../../../core/safety';
import { applySettings, unlockAudio } from '../../../platform/feedback';
import { speech, Speech, SPEECH_RATES, SPEECH_SAMPLE } from '../../../platform/speech';
import { store, useData } from '../../../state/store';
import { CheckList, Choice, Segmented, StepDots } from '../../components/Controls';
import { HapticLegend } from '../../components/HapticLegend';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { RxPaste } from './PatientHome';

type Stage = 'info' | 'dx' | 'contra' | 'gate';

/** Seçili hızla örnek yönerge okur (kullanıcı dokunuşu içinde çağrılır: iOS ses kilidi). */
function trySpeech() {
  unlockAudio();
  const st = store.get().settings;
  applySettings({ ...st, speech: true });
  speech.speak(SPEECH_SAMPLE, 'high');
  // Kullanıcı sesli yönergeleri kapatmışsa deneme sonrası ayar geri gelsin.
  if (!st.speech) setTimeout(() => applySettings(store.get().settings), 0);
}

export function Onboarding() {
  const d = useData();
  const nav = useNavigate();
  const rx = d.patient?.prescription;
  const [params] = useSearchParams();
  // Kurulumu tamamlamış kişi (düzenleme): onay ekranından yeniden geçmesin; ilgili adımdan başlasın.
  const [stage, setStage] = useState<Stage>(() => {
    const p = d.patient;
    if (!p?.consentAt) return 'info';
    const want = params.get('adim');
    if (want === 'baslangic') return 'info';
    if (want === 'uygunluk') return 'contra';
    if (want === 'tani') return rx ? 'contra' : 'dx';
    const g = diagnosisGate({
      diagnosedByDoctor: p.diagnosedByDoctor,
      canal: p.canal,
      side: p.side,
      hasPrescription: !!rx,
      contraindications: p.contraindications
    });
    if (!g.ok && g.reason === 'CONTRAINDICATION') return 'contra';
    return rx ? 'contra' : 'dx';
  });
  // Düzenlemede daha önce verilen onay işaretli gelir.
  const [consent, setConsent] = useState(!!d.patient?.consentAt);
  const [dx, setDx] = useState<'yes' | 'no' | null>(rx ? 'yes' : (d.patient?.diagnosedByDoctor ? 'yes' : null));
  const [canal, setCanal] = useState<CanalAnswer | null>(rx ? 'PC' : (d.patient?.canal ?? null));
  const [side, setSide] = useState<SideAnswer | null>(rx ? rx.side : (d.patient?.side ?? null));
  const [dxDate, setDxDate] = useState(d.patient?.dxDate ?? rx?.date ?? '');
  const [contra, setContra] = useState<string[]>(d.patient?.contraindications ?? []);
  // Düzenlemede önceki "hiçbiri" yanıtı korunur; ilk kurulumda açıkça işaretlenmeli.
  const [none, setNone] = useState(!!d.patient?.consentAt && (d.patient?.contraindications ?? []).length === 0);

  // Reçete varsa tanı adımı reçeteden dolar ve atlanır.
  const flow: Stage[] = rx ? ['info', 'contra'] : ['info', 'dx', 'contra'];
  const idx = Math.max(0, flow.indexOf(stage));
  // Yeni adım sayfanın başından açılsın (başlık görünmeden liste ortasından açılmasın).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);
  const finish = () => {
    save();
    nav('/hasta', { replace: true });
  };

  const save = () => {
    store.update((x) => ({
      ...x,
      patient: {
        ...(x.patient ?? {}),
        consentAt: x.patient?.consentAt || new Date().toISOString(),
        diagnosedByDoctor: dx === 'yes',
        dxDate: dxDate || undefined,
        canal: canal ?? 'unknown',
        side: side ?? 'unknown',
        contraindications: contra
      }
    }));
  };

  const gate = diagnosisGate({
    diagnosedByDoctor: dx === 'yes',
    canal: canal ?? 'unknown',
    side: side ?? 'unknown',
    hasPrescription: !!rx,
    contraindications: contra
  });

  return (
    <Screen
      title="Kurulum"
      onBack={() => {
        if (stage !== 'info') return setStage(stage === 'gate' ? 'contra' : flow[idx - 1]!);
        // İlk adımdan geri: rol seçimine dön (rol "hasta" kalırsa ana sayfa yine kuruluma yönlendirirdi).
        store.update((x) => ({ ...x, settings: { ...x.settings, role: null } }));
        nav('/', { replace: true });
      }}
      footer={
        stage === 'info' ? (
          <>
            <button
              className="btn primary block xl"
              aria-disabled={!consent}
              onClick={() => {
                if (consent) setStage(flow[1]!);
                else {
                  // Pasif düğmeye dokunulursa onay kutusunu göster.
                  const el = document.querySelector('[data-testid="ob-consent"]') as HTMLElement | null;
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el?.focus();
                }
              }}
              data-testid="ob-next"
            >
              Devam
            </button>
            {!consent && <p className="small muted center">Devam etmek için yukarıdaki onay kutusunu işaretleyin.</p>}
          </>
        ) : stage === 'dx' ? (
          <button className="btn primary block xl" disabled={!dx || (dx === 'yes' && (!canal || !side))} onClick={() => setStage('contra')} data-testid="ob-next">
            Devam
          </button>
        ) : stage === 'contra' ? (
          <>
          <button
            className="btn primary block xl"
            // Güvenlik: seçim yapılmadan geçilmez; "Hiçbiri" açıkça işaretlenmeli.
            disabled={contra.length === 0 && !none}
            onClick={() => {
              // Kapı açıksa doğrudan ana ekran; kapalıysa nedenini gösteren ekran.
              if (gate.ok) finish();
              else {
                save();
                setStage('gate');
              }
            }}
            data-testid="ob-next"
          >
            Devam
          </button>
          {contra.length === 0 && !none && (
            <p className="small muted center">Size uyanları işaretleyin; hiçbiri uymuyorsa en alttaki "Hiçbiri bana uymuyor"u seçin.</p>
          )}
          </>
        ) : (
          <button className="btn secondary block" onClick={() => nav('/hasta', { replace: true })}>
            Ana ekrana dön
          </button>
        )
      }
    >
      {stage !== 'gate' && <StepDots total={flow.length} index={idx} />}

      {stage === 'info' && (
        <>
          <div className="card stack" data-testid="ob-fontsize">
            <strong>Yazılar rahat okunuyor mu?</strong>
            <Segmented
              label="Yazı boyutu"
              value={d.settings.fontScale}
              onChange={(v) => store.update((x) => ({ ...x, settings: { ...x.settings, fontScale: v } }))}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'large', label: 'Büyük' },
                { value: 'xlarge', label: 'Çok büyük' }
              ]}
            />
          </div>
          <div className="card stack" data-testid="ob-speech">
            <strong>Sesli yönergeler rahat anlaşılıyor mu?</strong>
            <p className="small muted">Manevrada telefon alnınızda olur; yönergeleri sesle duyarsınız. Bir hız seçin, örnek cümle okunur.</p>
            <Segmented
              label="Konuşma hızı"
              value={d.settings.speechRate}
              onChange={(v) => {
                store.update((x) => ({ ...x, settings: { ...x.settings, speechRate: v } }));
                trySpeech();
              }}
              options={SPEECH_RATES}
            />
            <button type="button" className="btn secondary" onClick={trySpeech} data-testid="ob-speech-test">
              <Icon name="volume" /> Sesi dene
            </button>
            {Speech.supported() && !speech.hasTurkishVoice() && (
              <p className="small muted">
                Telefonda Türkçe okuma sesi bulunamadı. Telefonun ayarlarından Türkçe metin okuma sesi yükleyebilir ya da bir yakınınızla yapabilirsiniz.
              </p>
            )}
            <p className="small muted">Sesi duyamıyorsanız telefonun sessiz modunu kapatıp sesi açın. Hızı sonra Ayarlar'dan da değiştirebilirsiniz.</p>
          </div>
          <h1>DengeYol'u kimler kullanabilir?</h1>
          <div className="card stack">
            <div className="row">
              <Icon name="check" />
              <span>
                Daha önce hekim ya da odyolog (işitme uzmanı) muayenesiyle <strong>kristal oynaması (BPPV)</strong> tanısı almış yetişkinler.
              </span>
            </div>
            <div className="row">
              <Icon name="check" />
              <span>
                Baş dönmesi yatarken, yataktan kalkarken, yatakta yan dönerken ya da yukarı bakarken gelen ve <strong>kısa süren</strong> (saniyeler, en çok
                bir dakika) ataklar hâlinde tekrarlayanlar.
              </span>
            </div>
            <div className="row">
              <Icon name="check" />
              <span>Yatağa yatıp kalkabilen ve başını çevirebilenler (gerekirse yanında bir yardımcıyla).</span>
            </div>
          </div>
          <div className="card tint-danger stack">
            <div className="card-title">
              <Icon name="alert" />
              <h3>Acil durumda kullanmayın</h3>
            </div>
            <p>
              Durmadan süren (hiç geçmeyen) baş dönmesi, çift görme, konuşma bozukluğu, yüzde-kolda-bacakta güçsüzlük ya da uyuşma, şiddetli baş ağrısı ya da göğüs
              ağrısı varsa hemen{' '}
              <a href="tel:112">112'yi arayın</a>.
            </p>
          </div>
          {!rx && (
            <details className="card soft small">
              <summary>Hekimim ya da odyoloğum bir reçete bağlantısı verdi</summary>
              <div style={{ marginTop: 10 }}>
                <RxPaste />
              </div>
            </details>
          )}
          <button
            type="button"
            role="checkbox"
            aria-checked={consent}
            className="choice check"
            onClick={() => setConsent(!consent)}
            data-testid="ob-consent"
          >
            <span className="dot" />
            <span>
              Okudum ve anladım: DengeYol tanı koymaz, doktorun yerine geçmez ve yalnız hekim tanısıyla kullanılabilir. Tıbbi cihaz onayı olmayan, deneme
              aşamasındaki bir araştırma uygulamasıdır; kullanımı kendi sorumluluğumdadır. (Verilerim yalnızca bu telefonda saklanır.)
            </span>
          </button>
        </>
      )}

      {stage === 'dx' && (
        <>
          <h1>Tanınız</h1>
          {rx && (
            <div className="notice ok">
              <Icon name="check" />
              <span>
                Reçeteniz yüklü: <strong>{rx.side === 'R' ? 'sağ' : 'sol'} arka kanal</strong>, {rx.maneuver === 'epley' ? 'Epley' : 'Semont'} manevrası.
              </span>
            </div>
          )}
          <div className="field">
            <label>Bir hekim ya da odyolog (işitme uzmanı) size muayeneyle kristal oynaması (BPPV) tanısı koydu mu?</label>
            <Choice
              name="Tanı"
              value={dx}
              onChange={setDx}
              options={[
                { value: 'yes', label: 'Evet, tanı kondu' },
                { value: 'no', label: 'Hayır / emin değilim' }
              ]}
            />
          </div>
          {dx === 'yes' && (
            <>
              <div className="field">
                <label>Hangi kanalda (tipte) olduğu söylendi?</label>
                <Choice
                  name="Kanal"
                  value={canal}
                  onChange={setCanal}
                  options={[
                    { value: 'PC', label: 'Arka (posterior) kanal', sub: 'En sık tip. Epley manevrası yapılır.' },
                    { value: 'HC', label: 'Yatay (lateral) kanal', sub: 'Barbekü ya da Gufoni manevrası yapılır.' },
                    { value: 'unknown', label: 'Bilmiyorum / söylenmedi' }
                  ]}
                />
              </div>
              <div className="field">
                <label>Hangi kulak?</label>
                <Choice
                  name="Taraf"
                  value={side}
                  onChange={setSide}
                  options={[
                    { value: 'R', label: 'Sağ kulak' },
                    { value: 'L', label: 'Sol kulak' },
                    { value: 'unknown', label: 'Bilmiyorum', sub: 'Uygulama her atakta kısa bir testle tarafı belirler.' }
                  ]}
                />
              </div>
              <div className="field">
                <label htmlFor="dxdate">Tanı tarihi (isteğe bağlı)</label>
                <input id="dxdate" className="input" type="date" value={dxDate} onChange={(e) => setDxDate(e.target.value)} />
              </div>
            </>
          )}
        </>
      )}

      {stage === 'contra' && (
        <>
          <h1>Sizin için uygun mu?</h1>
          <p className="lead">Aşağıdakilerden size uyanları işaretleyin. Emin olmadığınız bir madde varsa işaretleyin ve doktorunuza sorun.</p>
          <div className="notice info small">
            <Icon name="info" />
            <span>
              İşitme kaybınız varsa da kullanabilirsiniz: işitme cihazınızı ya da kulaklığınızı Bluetooth ile telefona bağlayın, sesi en yükseğe alın ya da bir
              yakınınızla yapın. Yazılar ekranda da görünür; titreşim ve bip sesleri ne zaman hareket edeceğinizi bildirir.
            </span>
          </div>
          <details className="card soft small" data-testid="ob-haptics">
            <summary>Titreşimleri tanı</summary>
            <HapticLegend />
          </details>
          <CheckList
            options={CONTRAINDICATIONS.map((c) => ({ value: c.id, label: c.text }))}
            values={contra}
            onToggle={(v) => {
              setNone(false);
              setContra((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));
            }}
          />
          <button
            type="button"
            role="checkbox"
            aria-checked={none}
            className="choice check"
            onClick={() => {
              setNone(!none);
              setContra([]);
            }}
            data-testid="ob-none"
          >
            <span className="dot" />
            <span>Hiçbiri bana uymuyor</span>
          </button>
          <div className="notice info small" data-testid="ob-not-blocking">
            <Icon name="info" />
            <span>{CONTRA_NOT_BLOCKING_TEXT}</span>
          </div>
        </>
      )}

      {stage === 'gate' && !gate.ok && <GateInfo reason={gate.reason} contra={contra} />}
    </Screen>
  );
}

/** Kapı kapalı: nedeni, engelleyen maddeler (adıyla) ve hekime sorulacaklar. */
function GateInfo({ reason, contra }: { reason: 'NO_DIAGNOSIS' | 'HORIZONTAL_CANAL' | 'CONTRAINDICATION'; contra: string[] }) {
  const items = reason === 'CONTRAINDICATION' ? contraindicationsFor(contra) : [];
  const questions = reason === 'CONTRAINDICATION' ? contraDoctorQuestions(contra) : [];
  const [msg, setMsg] = useState<string | null>(null);
  const shareQuestions = async () => {
    const text = [
      'DengeYol — hekimime sorularım',
      items.length ? `Durumum: ${items.map((c) => c.label).join('; ')}` : '',
      ...questions.map((q, i) => `${i + 1}. ${q}`)
    ]
      .filter(Boolean)
      .join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Hekimime sorularım', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg('Sorular kopyalandı; bir mesaja ya da notlarınıza yapıştırabilirsiniz.');
    } catch {
      /* kullanıcı vazgeçti ya da pano kullanılamıyor */
    }
  };
  return (
    <>
      <h1>Önce hekiminize danışın</h1>
      <div className="card tint-warn stack" data-testid="ob-gate-blocked">
        {items.length > 0 && (
          <div className="stack" style={{ gap: 4 }} data-testid="ob-gate-items">
            <strong>{items.length > 1 ? 'Sizi engelleyen durumlar:' : 'Sizi engelleyen durum:'}</strong>
            <ul style={{ margin: 0, paddingLeft: 22 }}>
              {items.map((c) => (
                <li key={c.id}>{c.label}</li>
              ))}
            </ul>
          </div>
        )}
        <p>{GATE_TEXT[reason]}</p>
      </div>
      {questions.length > 0 && (
        <div className="card stack" data-testid="ob-gate-questions">
          <h3>Hekiminize sorabilecekleriniz</h3>
          <ol className="stack" style={{ margin: 0, paddingLeft: 22, gap: 8 }}>
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <button type="button" className="btn secondary" onClick={() => void shareQuestions()}>
            <Icon name="share" /> Soruları kaydet / gönder
          </button>
          {msg && <p className="small muted">{msg}</p>}
        </div>
      )}
      {reason === 'CONTRAINDICATION' ? (
        <>
          <p className="small muted">{CONTRA_NOT_BLOCKING_TEXT}</p>
          <p className="small muted">Bir maddeyi yanlışlıkla işaretlediyseniz geri dönüp düzeltebilirsiniz.</p>
        </>
      ) : (
        <p className="small muted">
          Yanıtlarınızı değiştirmek için geri dönebilirsiniz. Hekiminiz ya da odyoloğunuz muayeneden sonra size bir reçete bağlantısı (QR) verirse manevralar
          açılır.
        </p>
      )}
    </>
  );
}
