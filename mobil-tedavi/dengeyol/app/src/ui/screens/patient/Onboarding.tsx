/**
 * Hasta modu ilk kurulum: bilgilendirme ve onay → tanı bilgisi → kontrendikasyonlar → kapı kararı.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONTRAINDICATIONS, diagnosisGate, GATE_TEXT, type CanalAnswer, type SideAnswer } from '../../../core/safety';
import { store, useData } from '../../../state/store';
import { CheckList, Choice, Segmented, StepDots } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';

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
  const [none, setNone] = useState(false);

  const idx = ['info', 'dx', 'contra', 'gate'].indexOf(stage);

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
      onBack={() => (stage === 'info' ? nav('/hasta') : setStage((['info', 'dx', 'contra', 'gate'] as Stage[])[idx - 1]!))}
      footer={
        stage === 'info' ? (
          <button className="btn primary block xl" disabled={!consent} onClick={() => setStage('dx')} data-testid="ob-next">
            Devam
          </button>
        ) : stage === 'dx' ? (
          <button className="btn primary block xl" disabled={!dx || (dx === 'yes' && (!canal || !side))} onClick={() => setStage('contra')} data-testid="ob-next">
            Devam
          </button>
        ) : stage === 'contra' ? (
          <button
            className="btn primary block xl"
            disabled={!none && contra.length === 0}
            onClick={() => {
              save();
              setStage('gate');
            }}
            data-testid="ob-next"
          >
            Devam
          </button>
        ) : gate.ok ? (
          <button
            className="btn primary block xl"
            onClick={() => {
              save();
              nav('/hasta', { replace: true });
            }}
            data-testid="ob-finish"
          >
            Kurulumu bitir
          </button>
        ) : (
          <button className="btn secondary block" onClick={() => nav('/hasta', { replace: true })}>
            Ana ekrana dön
          </button>
        )
      }
    >
      <StepDots total={4} index={idx} />

      {stage === 'info' && (
        <>
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
          <div className="card soft stack small">
            <p>
              DengeYol tanı koymaz ve hekim muayenesinin yerine geçmez. Bir araştırma prototipidir; tıbbi cihaz onayı yoktur. Verileriniz yalnızca bu cihazda
              saklanır.
            </p>
          </div>
          <button
            type="button"
            role="checkbox"
            aria-checked={consent}
            className="choice check"
            onClick={() => setConsent(!consent)}
            data-testid="ob-consent"
          >
            <span className="dot" />
            <span>Okudum ve anladım. Uygulamayı hekimimin tanısı doğrultusunda, kendi sorumluluğumda kullanacağım.</span>
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
                Odyolog/hekim reçeteniz yüklü: <strong>{rx.side === 'R' ? 'sağ' : 'sol'} arka kanal</strong>, {rx.maneuver === 'epley' ? 'Epley' : 'Semont'} manevrası.
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
        (gate.ok ? (
          <>
            <h1>Hazırsınız</h1>
            <div className="card tint-ok stack">
              <p>
                Baş dönmeniz tekrarladığında ana ekrandaki <strong>"Baş dönmem başladı"</strong> düğmesine dokunun. Uygulama önce birkaç güvenlik sorusu
                soracak, telefonu başınıza tanıtacak{gate.requireSideTest ? ', hangi taraf olduğunu kısa bir testle bulacak' : ''} ve manevrayı adım adım
                yaptıracak.
              </p>
            </div>
            <div className="card soft stack small">
              <strong>İpucu</strong>
              <p>Baş dönmeniz yokken bir kez "Deneme manevrası" yapmanızı öneririz; böylece adımları atak sırasında tanıyor olursunuz.</p>
            </div>
          </>
        ) : (
          <>
            <h1>Önce hekiminize danışın</h1>
            <div className="card tint-warn stack" data-testid="ob-gate-blocked">
              <p>{GATE_TEXT[gate.reason]}</p>
            </div>
            <p className="small muted">Yanıtlarınızı değiştirmek için geri dönebilirsiniz. Odyologunuz size bir reçete bağlantısı verirse uygulama açılır.</p>
          </>
        ))}
    </Screen>
  );
}
