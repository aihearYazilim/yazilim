import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { decodePrescription, DECODE_ERROR_TEXT, type Prescription, rxIssuedAt, rxValidityLabel, rxValidUntil, RX_VALID_DAYS } from '../../../core/prescription';
import { sideName } from '../../../core/protocols';
import { contraindicationsFor } from '../../../core/safety';
import { isIos, isStandalone } from '../../../platform/reminders';
import { speech } from '../../../platform/speech';
import { store, useData } from '../../../state/store';
import { formatDate } from '../../../state/episodes';
import { RxPaste } from './PatientHome';
import { ListenAgain } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';

/** Kabul uyarısı: korkutmadan, hekimin bağlantıyı yakına vermesini de kapsayarak (k05, k02). */
const RX_TRUST_TEXT =
  'Bu reçeteyi yalnız hekiminiz ya da odyoloğunuz size ya da yakınınıza kendisi verdiyse (QR kod ya da bağlantı) kabul edin. Uygulama reçeteyi kimin hazırladığını denetleyemez; başka yerden gelen bir reçeteyi kabul etmeyin.';

/** Reçete kartındaki tanı satırı; sesli metinle aynı sözcükler ("kristal oynaması"), taraf büyük harfle. */
export function rxDiagnosisText(p: Pick<Prescription, 'side'>): string {
  return `${sideName(p.side).toLocaleUpperCase('tr-TR')} kulak — arka kanal kristal oynaması (BPPV)`;
}

/** Reçete kartının sesli metni (açılınca bir kez okunur; "Tekrar dinle" ile yeniden). */
export function rxCardSpeech(p: Prescription, o: { expired: boolean; future: boolean; contraLabels: string[] }): string {
  const parts = [
    'Ev manevrası reçetesi.',
    `Tanı: ${sideName(p.side)} kulak, arka kanal kristal oynaması.`,
    `Manevra: ${p.maneuver === 'epley' ? 'Epley' : 'Semont'}. Günde en çok ${p.perDay} kez, en çok ${p.days} gün.`
  ];
  const label = rxValidityLabel(p);
  if (o.future) parts.push('Reçetenin tarihi ileride görünüyor; telefonunuzun tarihini kontrol edin ya da hekiminize sorun.');
  else if (o.expired) parts.push('Bu reçetenin süresi doldu; kabul ederseniz yalnız tanı bilgisi olarak kullanılır.');
  else if (label) parts.push(`Geçerlilik: ${label.replace(' (dahil)', ', o gün dahil')}.`);
  if (o.contraLabels.length) parts.push(`Kurulumda işaretlediğiniz durum nedeniyle bu reçete ev manevralarını açmaz: ${o.contraLabels.join(', ')}.`);
  parts.push(RX_TRUST_TEXT);
  return parts.join(' ');
}

export function PrescriptionImport() {
  const { token = '' } = useParams();
  const nav = useNavigate();
  const d = useData();
  // useParams değeri zaten çözülmüş gelir; ikinci kez decodeURIComponent bozuk "%" içeren bağlantılarda hata fırlatır.
  const res = decodePrescription(token);

  const now = Date.now();
  const p = res.ok ? res.value : null;
  const until = p ? rxValidUntil(p) : null;
  const issued = p ? rxIssuedAt(p) : null;
  const expired = until !== null && now >= until;
  const future = issued !== null && now < issued;
  const contraItems = contraindicationsFor(d.patient?.contraindications ?? []);
  const say = p ? rxCardSpeech(p, { expired, future, contraLabels: contraItems.map((c) => c.label) }) : '';
  // Açılınca bir kez okunur (k05: en çok okunması gereken ekran sessizdi). Tarayıcı ses iznini dokunuşa bağlarsa
  // "Tekrar dinle" düğmesi okur.
  useEffect(() => {
    if (say) speech.speak(say, 'normal');
    return () => speech.cancel();
  }, [say]);

  if (!res.ok || !p) {
    return (
      <Screen title="Reçete" back="/">
        <div className="notice danger" role="alert" data-testid="rx-error">
          <Icon name="alert" />
          <span>{res.ok ? '' : DECODE_ERROR_TEXT[res.error]}</span>
        </div>
        <RxPaste />
        <button className="btn ghost" onClick={() => nav('/', { replace: true })}>
          Ana ekran
        </button>
      </Screen>
    );
  }
  const accept = () => {
    store.update((x) => ({
      ...x,
      settings: { ...x.settings, role: 'patient' },
      patient: {
        contraindications: x.patient?.contraindications ?? [],
        ...x.patient,
        diagnosedByDoctor: true,
        canal: 'PC',
        side: p.side,
        dxDate: p.date,
        dxWhen: 'date',
        dxWhenAt: undefined,
        dxBy: p.by,
        prescription: p,
        // Raporda reçete kodu klinisyenin HBYS notundakiyle aynı çıksın diye bağlantının kendisi saklanır.
        prescriptionToken: token.trim()
      }
    }));
    const consented = !!store.get().patient?.consentAt;
    nav(consented ? '/hasta' : '/hasta/kurulum', { replace: true });
  };
  const validity = rxValidityLabel(p);
  const ios = isIos() && !isStandalone();

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
          {/* Ekran da sesle aynı sözcükleri kullanır (kullanıcı turu 4, k05): "SAĞ kulak — arka kanal kristal oynaması (BPPV)". */}
          <dd data-testid="rx-dx">{rxDiagnosisText(p)}</dd>
          <dt>Manevra</dt>
          <dd>{p.maneuver === 'epley' ? 'Epley' : 'Semont'}</dd>
          <dt>Doz</dt>
          <dd>
            Günde en fazla {p.perDay} kez, en fazla {p.days} gün
          </dd>
          <dt>Muayene tarihi</dt>
          <dd>{issued !== null ? formatDate(issued) : p.date}</dd>
          {validity && (
            <>
              <dt>Geçerlilik</dt>
              <dd data-testid="rx-valid-until">
                {validity} ({RX_VALID_DAYS} gün){expired ? ' · SÜRESİ DOLDU' : future ? ' · TARİHİ İLERİDE' : ''}
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
      <ListenAgain text={say} testid="rx-listen" />
      {expired && (
        <div className="notice small" data-testid="rx-expired">
          <Icon name="alert" />
          <span>
            Bu reçetenin süresi doldu. Kabul ederseniz yalnız tanı bilgisi olarak kullanılır: manevra sayısı varsayılana döner ve her atakta iki taraf
            yeniden test edilir.
          </span>
        </div>
      )}
      {future && (
        <div className="notice small" data-testid="rx-future">
          <Icon name="alert" />
          <span>
            Reçetenin tarihi ileride görünüyor; muayene tarihine gelene kadar geçerli sayılmaz. Telefonunuzun tarihini kontrol edin ya da hekiminize sorun.
          </span>
        </div>
      )}
      {contraItems.length > 0 && (
        <div className="notice small" data-testid="rx-contra">
          <Icon name="alert" />
          <span>
            Kurulumda işaretlediğiniz durum nedeniyle (<strong>{contraItems.map((c) => c.label).join(', ')}</strong>) bu reçete ev manevralarını açmaz.
            Kabul ederseniz yalnız tanı bilgisi olarak kaydedilir; manevrayı hekiminiz muayenede yapabilir. Bir maddeyi yanlışlıkla işaretlediyseniz
            "Bilgilerimi düzenle"den düzeltebilirsiniz.
          </span>
        </div>
      )}
      <div className="notice" role="note" data-testid="rx-unsigned">
        <Icon name="info" />
        <span>{RX_TRUST_TEXT}</span>
      </div>
      {ios && (
        <div className="notice info small" data-testid="rx-ios">
          <Icon name="phone" />
          <span>
            <strong>iPhone'da önce ana ekrana ekleyin:</strong> Safari'de alttaki Paylaş düğmesine, ardından "Ana Ekrana Ekle"ye dokunun. Sonra
            DengeYol'u ana ekrandan açıp bu bağlantıyı orada yeniden açın ya da yapıştırın. Safari'de kabul edilen reçeteyi ana ekrandaki uygulama
            görmez.
          </span>
        </div>
      )}
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
