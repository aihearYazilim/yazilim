/**
 * Hasta modu ilk kurulum: bilgilendirme ve onay → tanı bilgisi → kontrendikasyonlar → kapı kararı.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONTRAINDICATIONS, diagnosisGate, GATE_TEXT, type CanalAnswer, type SideAnswer } from '../../../core/safety';
import { store, useData } from '../../../state/store';
import { CheckList, Choice, Segmented, StepDots } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { RxPaste } from './PatientHome';

type Stage = 'info' | 'dx' | 'contra' | 'gate';

export function Onboarding() {
  const d = useData();
  const nav = useNavigate();
  const rx = d.patient?.prescription;
  const [stage, setStage] = useState<Stage>('info');
  const [consent, setConsent] = useState(false);
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
          {contra.length === 0 && !none && <p className="small muted center">Size uyanları ya da "Hiçbiri bana uymuyor"u işaretleyin.</p>}
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
          <h1>DengeYol'u kimler kullanabilir?</h1>
          <div className="card stack">
            <div className="row">
              <Icon name="check" />
              <span>Daha önce hekim ya da odyolog muayenesiyle <strong>BPPV (kristal oynaması)</strong> tanısı almış yetişkinler.</span>
            </div>
            <div className="row">
              <Icon name="check" />
              <span>Baş dönmesi yatarken, yatakta dönerken ya da yukarı bakarken <strong>saniyeler süren</strong> ataklar halinde tekrarlayanlar.</span>
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
              Sürekli baş dönmesi, çift görme, konuşma bozukluğu, yüzde-kolda-bacakta güçsüzlük, şiddetli baş ağrısı ya da göğüs ağrısı varsa hemen{' '}
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
              Okudum. DengeYol tanı koymaz, hekim muayenesinin yerine geçmez ve tıbbi cihaz onayı olmayan bir araştırma prototipidir; hekimimin tanısıyla, kendi
              sorumluluğumda kullanacağım. (Verilerim yalnızca bu telefonda saklanır.)
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
            <label>Bir hekim ya da odyolog size muayeneyle BPPV (kristal oynaması) tanısı koydu mu?</label>
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
                <label>Hangi kanal olduğu söylendi?</label>
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
          <p className="lead">Aşağıdakilerden size uyanları işaretleyin.</p>
          <div className="notice info small">
            <Icon name="info" />
            <span>
              İşitme kaybınız varsa da kullanabilirsiniz: işitme cihazınızı ya da kulaklığınızı Bluetooth ile telefona bağlayın, sesi en yükseğe alın ya da bir
              yakınınızla yapın. Yazılar ekranda da görünür; titreşim ve bip sesleri ne zaman hareket edeceğinizi bildirir.
            </span>
          </div>
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
        </>
      )}

      {stage === 'gate' &&
        !gate.ok && (
          <>
            <h1>Önce hekiminize danışın</h1>
            <div className="card tint-warn stack" data-testid="ob-gate-blocked">
              <p>{GATE_TEXT[gate.reason]}</p>
            </div>
            <p className="small muted">
              Yanıtlarınızı değiştirmek için geri dönebilirsiniz. Hekiminiz ya da odyoloğunuz size bir reçete bağlantısı verirse manevralar açılır.
            </p>
          </>
        )}
    </Screen>
  );
}
