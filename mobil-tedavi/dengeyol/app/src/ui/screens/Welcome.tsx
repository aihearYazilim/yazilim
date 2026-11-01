import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { speech } from '../../platform/speech';
import { store } from '../../state/store';
import type { Role } from '../../state/types';
import { Icon, Logo } from '../components/Icon';
import { useTapLock } from '../components/Controls';
import { CLINICIAN_CONFIRM_SPOKEN, CLINICIAN_CONFIRM_TEXT, CLINICIAN_CONFIRM_TITLE, WELCOME_SPOKEN } from './patient/onboardingText';

/**
 * Karşılama: rol seçimi. Yeni kullanıcı turu 1 (L5-5, L5-6; y02): açılınca kısa ses; "Klinisyenim"e dokununca önce
 * "Hekim ya da odyolog musunuz?" sorulur (titreyen elle yanlış dokunuş klinisyen modunu kalıcı açıyordu). Önerilen yol
 * büyük dolu "Hayır, hastayım"; "Evet" ikincil.
 */
export function Welcome() {
  const nav = useNavigate();
  const [askClinician, setAskClinician] = useState(false);
  const choose = (role: Role) => {
    store.update((d) => ({ ...d, settings: { ...d.settings, role } }));
    nav(role === 'patient' ? '/hasta' : '/odyolog', { replace: true });
  };
  useEffect(() => {
    speech.speak(askClinician ? CLINICIAN_CONFIRM_SPOKEN : WELCOME_SPOKEN, askClinician ? 'high' : 'normal');
  }, [askClinician]);

  if (askClinician) return <ClinicianConfirm onPatient={() => choose('patient')} onClinician={() => choose('clinician')} onBack={() => setAskClinician(false)} />;

  return (
    <div className="screen">
      <main className="content">
        <div className="hero">
          <div className="brand">
            <Logo size={52} />
            <div>
              <div className="name">DengeYol</div>
              <div className="muted small">Pozisyonel baş dönmesi (BPPV) manevra rehberi</div>
            </div>
          </div>
          <h1 style={{ marginTop: 12 }}>Baş dönmesi kristalleri yerine oturtan manevrayı doğru yapmanıza yardım eder.</h1>
          <p className="lead">
            Telefon alnınızda bir açı ölçer gibi çalışır; her adımı sesli anlatır ve başınız doğru açıya gelince haber verir.
          </p>
        </div>

        <button className="role-card" onClick={() => choose('patient')} data-testid="role-patient">
          <span className="ic" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <Icon name="user" size={30} />
          </span>
          <span className="grow">
            <h2>Baş dönmesi yaşıyorum</h2>
            <span className="muted">Yatarken, kalkarken ya da yatakta dönerken gelen baş dönmesi için test ve manevra. Tanınız olmasa da kullanabilirsiniz.</span>
          </span>
          <Icon name="chevron" />
        </button>

        <button className="role-card" onClick={() => setAskClinician(true)} data-testid="role-clinician">
          <span className="ic" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Icon name="steth" size={30} />
          </span>
          <span className="grow">
            <h2>Klinisyenim (odyolog / hekim)</h2>
            <span className="muted">Pozisyon testlerini ve manevraları açı ölçümüyle yapmak, bulguları kaydetmek ve hastaya ev reçetesi vermek istiyorum.</span>
          </span>
          <Icon name="chevron" />
        </button>

        <div className="notice info small">
          <Icon name="shield" />
          <span>
            Verileriniz yalnızca bu cihazda saklanır, hiçbir sunucuya gönderilmez. DengeYol tanı koymaz ve acil durumlarda kullanılmaz.
          </span>
        </div>
      </main>
    </div>
  );
}

/** "Klinisyenim" onayı: açılışta kısa dokunuş kilidi (çift dokunuşun ikincisi "Evet" sayılmasın). */
function ClinicianConfirm({ onPatient, onClinician, onBack }: { onPatient: () => void; onClinician: () => void; onBack: () => void }) {
  const locked = useTapLock('role-clinician-confirm', 800);
  const lockStyle = locked ? { opacity: 0.55 } : undefined;
  return (
    <div className="screen">
      <main className="content">
        <div className="card tint-accent stack" data-testid="role-clinician-confirm">
          <div className="card-title">
            <Icon name="steth" />
            <h2>{CLINICIAN_CONFIRM_TITLE}</h2>
          </div>
          <p>{CLINICIAN_CONFIRM_TEXT}</p>
        </div>
        <div className="stack" data-locked={locked || undefined}>
          <button className="btn primary block xl" style={lockStyle} aria-disabled={locked || undefined} onClick={() => !locked && onPatient()} data-testid="role-clinician-no">
            Hayır, hastayım
          </button>
          <button className="btn secondary block xl" style={lockStyle} aria-disabled={locked || undefined} onClick={() => !locked && onClinician()} data-testid="role-clinician-yes">
            Evet, hekimim / odyoloğum
          </button>
          <button className="btn ghost" onClick={onBack} data-testid="role-clinician-back">
            Geri
          </button>
        </div>
      </main>
    </div>
  );
}
