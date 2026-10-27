import { useNavigate } from 'react-router-dom';
import { store } from '../../state/store';
import type { Role } from '../../state/types';
import { Icon, Logo } from '../components/Icon';

export function Welcome() {
  const nav = useNavigate();
  const choose = (role: Role) => {
    store.update((d) => ({ ...d, settings: { ...d.settings, role } }));
    nav(role === 'patient' ? '/hasta' : '/odyolog', { replace: true });
  };
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
            <span className="muted">Hekim/odyolog tanısı aldığım BPPV tekrarladığında evde güvenle manevra yapmak istiyorum.</span>
          </span>
          <Icon name="chevron" />
        </button>

        <button className="role-card" onClick={() => choose('clinician')} data-testid="role-clinician">
          <span className="ic" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Icon name="steth" size={30} />
          </span>
          <span className="grow">
            <h2>Odyolog / hekimim</h2>
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
