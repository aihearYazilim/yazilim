import { useNavigate, useParams } from 'react-router-dom';
import { decodePrescription, DECODE_ERROR_TEXT } from '../../../core/prescription';
import { sideName } from '../../../core/protocols';
import { store } from '../../../state/store';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';

export function PrescriptionImport() {
  const { token = '' } = useParams();
  const nav = useNavigate();
  const res = decodePrescription(decodeURIComponent(token));

  if (!res.ok) {
    return (
      <Screen title="Reçete" back="/">
        <div className="notice danger" role="alert" data-testid="rx-error">
          <Icon name="alert" />
          <span>{DECODE_ERROR_TEXT[res.error]}</span>
        </div>
      </Screen>
    );
  }
  const p = res.value;
  const accept = () => {
    store.update((d) => ({
      ...d,
      settings: { ...d.settings, role: 'patient' },
      patient: {
        contraindications: d.patient?.contraindications ?? [],
        ...d.patient,
        diagnosedByDoctor: true,
        canal: 'PC',
        side: p.side,
        dxDate: p.date,
        dxBy: p.by,
        prescription: p
      }
    }));
    const consented = !!store.get().patient?.consentAt;
    nav(consented ? '/hasta' : '/hasta/kurulum', { replace: true });
  };

  return (
    <Screen title="Odyolog reçetesi">
      <div className="card tint-primary stack" data-testid="rx-card">
        <div className="card-title">
          <Icon name="steth" />
          <h2>Ev manevrası reçetesi</h2>
        </div>
        <dl className="kv">
          <dt>Tanı</dt>
          <dd>{sideName(p.side).toLocaleUpperCase('tr-TR')} arka kanal BPPV</dd>
          <dt>Manevra</dt>
          <dd>{p.maneuver === 'epley' ? 'Epley' : 'Semont'}</dd>
          <dt>Doz</dt>
          <dd>
            Günde en fazla {p.perDay} kez, en fazla {p.days} gün
          </dd>
          <dt>Muayene tarihi</dt>
          <dd>{p.date}</dd>
          {p.by && (
            <>
              <dt>Yazan</dt>
              <dd>{p.by}</dd>
            </>
          )}
          {p.clinic && (
            <>
              <dt>Kurum</dt>
              <dd>{p.clinic}</dd>
            </>
          )}
          {p.note && (
            <>
              <dt>Not</dt>
              <dd>{p.note}</dd>
            </>
          )}
        </dl>
      </div>
      <p className="small muted">
        Reçeteyi kabul ettiğinizde bu bilgiler uygulamaya kaydedilir. Her seansta yine güvenlik soruları sorulur. Reçeteyi size veren kişiyi tanımıyorsanız kabul
        etmeyin.
      </p>
      <button className="btn primary block xl" onClick={accept} data-testid="rx-accept">
        Reçeteyi kabul et
      </button>
      <button className="btn ghost" onClick={() => nav('/', { replace: true })}>
        Vazgeç
      </button>
    </Screen>
  );
}
