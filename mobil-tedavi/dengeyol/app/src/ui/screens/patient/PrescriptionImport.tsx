import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  decodePrescription,
  DECODE_ERROR_TEXT,
  type Prescription,
  rxCanalName,
  rxCanalOf,
  rxDoseLine,
  rxIssuedAt,
  rxManeuverName,
  rxPossibleDx,
  rxValidityLabel,
  rxValidUntil
} from '../../../core/prescription';
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

/** Santral ya da muayene başı güvenlik uyarısıyla verilen reçetede tanının adı (yeni kullanıcı turu 3, y05 #2). */
export const RX_POSSIBLE_DX = 'Olası BPPV (hekim uyarısıyla)';

/**
 * Reçete kartındaki tanı satırı; sesli metinle aynı sözcükler ("kristal oynaması"), taraf büyük harfle. Santral ya da muayene
 * başı güvenlik uyarısına rağmen verilen reçetede "Olası BPPV (hekim uyarısıyla) — SAĞ kulak, arka kanal kristal oynaması".
 */
export function rxDiagnosisText(p: Pick<Prescription, 'side'> & Partial<Pick<Prescription, 'maneuver' | 'ov' | 'ovk'>>): string {
  const side = sideName(p.side).toLocaleUpperCase('tr-TR');
  const canal = p.maneuver ? rxCanalName({ maneuver: p.maneuver }) : 'arka kanal';
  if (rxPossibleDx(p)) return `${RX_POSSIBLE_DX} — ${side} kulak, ${canal} kristal oynaması`;
  return `${side} kulak — ${canal} kristal oynaması (BPPV)`;
}

/**
 * Hekim reçeteyi bir uyarıya rağmen verdiyse kartta ve seste okunan satır (kullanıcı turu yeni-1, L4-2; y05). Uyarı yoksa null.
 */
export function rxOverrideText(p: Pick<Prescription, 'ov'>): string | null {
  return p.ov ? `Hekim uyarıya rağmen verdi: ${p.ov}.` : null;
}

/** Uyarılı reçetede hastaya yönelik ek cümle (kartta ve seste). */
export const RX_OVERRIDE_ADVICE =
  'Baş dönmeniz düzelmezse ya da konuşma bozukluğu, güçsüzlük, çift görme, yürüyememe gibi yeni bir belirti olursa hemen hekime başvurun ya da 112\'yi arayın.';

/** Reçete kartının sesli metni (açılınca bir kez okunur; "Tekrar dinle" ile yeniden). */
export function rxCardSpeech(p: Prescription, o: { expired: boolean; future: boolean; contraLabels: string[] }): string {
  const parts = [
    'Ev manevrası reçetesi.',
    rxPossibleDx(p)
      ? `Tanı: olası kristal oynaması, hekim uyarısıyla; ${sideName(p.side)} kulak, ${rxCanalName(p)}.`
      : `Tanı: ${sideName(p.side)} kulak, ${rxCanalName(p)} kristal oynaması.`,
    `Manevra: ${rxManeuverName(p)}. Günde en çok ${p.perDay} kez, en çok ${p.days} gün.`
  ];
  const ov = rxOverrideText(p);
  if (ov) parts.push(ov, RX_OVERRIDE_ADVICE);
  const label = rxValidityLabel(p);
  if (o.future) parts.push('Reçetenin tarihi ileride görünüyor; telefonunuzun tarihini kontrol edin ya da hekiminize sorun.');
  else if (o.expired) parts.push('Bu reçetenin süresi doldu; kabul ederseniz yalnız tanı bilgisi olarak kullanılır.');
  else if (label) parts.push(`Geçerlilik: ${label.replace(' (dahil)', ', o gün dahil')}.`);
  if (o.contraLabels.length)
    parts.push(`Dikkat: işaretlediğiniz durum var: ${o.contraLabels.join(', ')}. Manevrayı evde yapmadan önce hekiminize danışmanız önerilir.`);
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
        // Reçetenin kanalı: yatay kanalda hasta akışı sırtüstü baş çevirme testi ve BBQ roll'a gider (reçeteli kısa yolda
        // doğrudan BBQ roll).
        canal: rxCanalOf(p),
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
          <dd data-testid="rx-maneuver">{rxManeuverName(p)}</dd>
          {/* Tek süre cümlesi, klinisyenin reçete ekranındakiyle aynı: tedavi gün sayısı ve son geçerli gün (geçerlilik gün sayısı
              ayrıca yazılmaz; yeni kullanıcı turu 3, y04 #5). */}
          <dt>Süre</dt>
          <dd data-testid="rx-dose">
            <span data-testid="rx-valid-until">{rxDoseLine(p)}</span>
            {expired ? ' SÜRESİ DOLDU.' : future ? ' TARİHİ İLERİDE.' : ''}
          </dd>
          <dt>Muayene tarihi</dt>
          <dd>{issued !== null ? formatDate(issued) : p.date}</dd>
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
        {p.ov && (
          <div className="notice danger small" role="note" data-testid="rx-override-line">
            <Icon name="alert" />
            <span>
              <strong>{rxOverrideText(p)}</strong> {RX_OVERRIDE_ADVICE}
            </span>
          </div>
        )}
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
      {/* Kontrendikasyon engel değildir (yeniden tasarım): yalnız uyarı; reçete yine kabul edilebilir. */}
      {contraItems.length > 0 && (
        <div className="notice small" data-testid="rx-contra">
          <Icon name="alert" />
          <span>
            <strong>Dikkat: {contraItems.map((c) => c.label).join(', ')}.</strong> Manevrayı evde yapmadan önce hekiminize danışmanız önerilir.
            Reçeteyi yine de kabul edebilirsiniz. Yanlış işaretlediyseniz Ayarlar'dan düzeltebilirsiniz.
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
