import { useNavigate, useParams } from 'react-router-dom';
import { decodePrescription, DECODE_ERROR_TEXT, rxValidUntil } from '../../../core/prescription';
import { sideName } from '../../../core/protocols';
import { store } from '../../../state/store';
import { formatDate, RX_VALID_DAYS } from '../../../state/episodes';
import { RxPaste } from './PatientHome';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';

export function PrescriptionImport() {
  const { token = '' } = useParams();
  const nav = useNavigate();
  // useParams değeri zaten çözülmüş gelir; ikinci kez decodeURIComponent bozuk "%" içeren bağlantılarda hata fırlatır.
  const res = decodePrescription(token);

  if (!res.ok) {
    return (
      <Screen title="Reçete" back="/">
        <div className="notice danger" role="alert" data-testid="rx-error">
          <Icon name="alert" />
          <span>{DECODE_ERROR_TEXT[res.error]}</span>
        </div>
        <RxPaste />
        <button className="btn ghost" onClick={() => nav('/', { replace: true })}>
          Ana ekran
        </button>
      </Screen>
    );
  }
  const p = res.value;
  const until = rxValidUntil(p, RX_VALID_DAYS);
  const expired = until !== null && Date.now() > until;
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
    <Screen title="Ev manevrası reçetesi">
      <div className="card tint-primary stack" data-testid="rx-card">
        <div className="card-title">
          <Icon name="steth" />
          <h2>Ev manevrası reçetesi</h2>
        </div>
        <dl className="kv">
          {p.pid && (
            <>
              <dt>Hasta kodu</dt>
              <dd>{p.pid}</dd>
            </>
          )}
          <dt>Tanı</dt>
          <dd>{sideName(p.side).toLocaleUpperCase('tr-TR')} arka kanal BPPV</dd>
          <dt>Manevra</dt>
          <dd>{p.maneuver === 'epley' ? 'Epley' : 'Semont'}</dd>
          <dt>Doz</dt>
          <dd>
            Günde en fazla {p.perDay} kez, en fazla {p.days} gün
          </dd>
          <dt>Muayene tarihi</dt>
          <dd>{formatDate(new Date(`${p.date}T00:00:00`).getTime())}</dd>
          {until !== null && (
            <>
              <dt>Geçerlilik</dt>
              <dd data-testid="rx-valid-until">
                {formatDate(until)} tarihine kadar ({RX_VALID_DAYS} gün){expired ? ' · SÜRESİ DOLDU' : ''}
              </dd>
            </>
          )}
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
      {expired && (
        <div className="notice small" data-testid="rx-expired">
          <Icon name="alert" />
          <span>
            Bu reçetenin süresi doldu. Kabul ederseniz yalnız tanı bilgisi olarak kullanılır: manevra sayısı varsayılana döner ve her atakta iki taraf
            yeniden test edilir.
          </span>
        </div>
      )}
      <div className="notice" role="note" data-testid="rx-unsigned">
        <Icon name="alert" />
        <span>
          <strong>Bu bağlantı imzasızdır:</strong> kimin hazırladığı uygulama tarafından doğrulanamaz. Yalnız muayenede hekiminizin ya da odyoloğunuzun size elden
          verdiği QR kodu ya da bağlantıyı kabul edin. Başka yoldan (mesaj, internet) gelen bir reçeteyi kabul etmeyin.
        </span>
      </div>
      <p className="small muted">
        Reçeteyi kabul ettiğinizde bu bilgiler uygulamaya kaydedilir. Her seansta yine güvenlik soruları sorulur. Reçete, hekiminizin muayenede belirlediği ev
        manevrası talimatıdır; durumunuz değişirse yeniden muayene gerekir.
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
