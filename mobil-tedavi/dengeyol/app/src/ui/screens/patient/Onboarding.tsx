/**
 * Hasta modu kurulumu (yeniden tasarım: tek ekran, kilit yok).
 * - İlk açılış: kısa bilgilendirme + onay kutusu + "Başla". Tanı, kanal, taraf, sağlık durumu ve ses ayarları sorulmaz;
 *   isteğe bağlıdır ve sonra Ayarlar'dan ("Tanı ve sağlık bilgilerim") girilir. Reçete bağlantısı varsa bilgiler kendiliğinden dolar.
 * - Onay verilmişse aynı adres "Bilgilerim" düzenleme sayfasıdır (hepsi isteğe bağlı; işaretlenen sağlık durumu yalnız uyarılır).
 *   `?adim=baslangic` onam ekranını yeniden açar; `?adim=uygunluk` sayfayı sağlık durumu bölümünden, `?adim=tani` tanıdan açar.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CONTRA_NOT_BLOCKING_TEXT,
  CONTRA_NOT_BLOCKING_TEXT_HELPER,
  contraDoctorQuestions,
  CONTRAINDICATIONS,
  contraindicationsFor,
  contraText,
  GATE_TEXT,
  type CanalAnswer,
  type SideAnswer
} from '../../../core/safety';
import { unlockAudio } from '../../../platform/feedback';
import { speech } from '../../../platform/speech';
import { localDayKey } from '../../../core/safety';
import { dxIsRecent, dxRecentAnswerExpired } from '../../../state/dxTiming';
import { formatDate } from '../../../state/episodes';
import { store, useData } from '../../../state/store';
import type { PatientProfile } from '../../../state/types';
import { CheckList, Choice, ListenAgain } from '../../components/Controls';
import { HapticLegend } from '../../components/HapticLegend';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { CONSENT_OPTIONS, CONSENT_OPTIONS_GIST, CONSENT_RISKS, CONSENT_RISKS_GIST, CONSENT_VERSION, consentStatement } from './consent';
import {
  CONSENT_FIRST_SPOKEN,
  consentCheckLabel,
  CONTRA_LISTEN_LABEL,
  contraHearingText,
  contraSpeech,
  contraSpeechShort,
  dxRecentAnsweredText
} from './onboardingText';
import { RxPaste } from './PatientHome';

type DxWhen = NonNullable<PatientProfile['dxWhen']>;

export { contraSpeech, contraSpeechShort } from './onboardingText';
export const CONTRA_SPEECH = contraSpeech(false);

export function Onboarding() {
  const d = useData();
  const [params] = useSearchParams();
  const want = params.get('adim');
  if (!d.patient?.consentAt || want === 'baslangic') return <ConsentScreen />;
  return <PatientInfo focus={want === 'uygunluk' ? 'contra' : want === 'tani' ? 'dx' : null} />;
}

/** Tek ekranlık kurulum: onay + "Başla". Onamı yeniden okuyan kişide de aynı ekran (onay işaretli gelir). */
function ConsentScreen() {
  const d = useData();
  const nav = useNavigate();
  const rx = d.patient?.prescription;
  const consented = !!d.patient?.consentAt;
  // Daha önce verilen onay işaretli gelir (onam metni o zamandan beri değiştiyse yeniden işaretlenir).
  const [consent, setConsent] = useState(consented && (d.patient?.consentVersion ?? '1') === CONSENT_VERSION);
  // Hasta adına yakını kuruyor (k02): manevra ekranları da yardımcıya göre konuşur (settings.assist).
  const [helperSetup, setHelperSetup] = useState(d.patient?.consentBy === 'helper' || (!consented && d.settings.assist === 'helper'));
  /** Yakını kutusu, yakını kurulumuysa açık gelir (yalnız ilk açılışta). */
  const [helperBoxOpen] = useState(helperSetup);
  /** Soluk "Başla"ya dokunuldu: hemen üstündeki onay kutusu kısa süre yanıp söner. */
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(0), 1200);
    return () => clearTimeout(t);
  }, [flash]);

  const start = () => {
    if (!consent) {
      // Soluk düğmeye dokunulursa hemen üstündeki onay kutusu yanıp söner ve kısa ses (y03, y06).
      setFlash(Date.now());
      speech.speak(CONSENT_FIRST_SPOKEN, 'high');
      (document.querySelector('[data-testid="ob-consent"]') as HTMLElement | null)?.focus();
      return;
    }
    // Dokunuş içinde ses kilidi açılır (iOS): ilk manevrada sesli yönerge hemen çalışsın.
    unlockAudio();
    store.update((x) => {
      const prev = x.patient;
      return {
        ...x,
        settings: { ...x.settings, role: 'patient' },
        patient: {
          // Bilgi girilmemişse varsayılanlar: tanı yok, kanal/taraf bilinmiyor (uygulama her atakta iki tarafı test eder).
          diagnosedByDoctor: false,
          canal: 'unknown',
          side: 'unknown',
          contraindications: [],
          ...(prev ?? {}),
          consentAt: new Date().toISOString(),
          consentVersion: CONSENT_VERSION,
          consentBy: helperSetup ? 'helper' : 'self'
        }
      };
    });
    nav('/hasta', { replace: true });
  };

  return (
    <Screen
      title="DengeYol"
      onBack={() => {
        if (consented) return nav(-1);
        // Onaydan önce geri: rol seçimine dön (rol "hasta" kalırsa ana sayfa yine kuruluma yönlendirirdi).
        store.update((x) => ({ ...x, settings: { ...x.settings, role: null } }));
        nav('/', { replace: true });
      }}
      footer={
        <>
          {/* Onay kutusu "Başla"nın hemen üstünde (yeni kullanıcı turu 1, L2-3; y01, y03, y06): ilk dokunuş boşa gitmesin;
              tam metin yukarıda. "Başla" onaysızken soluk görünür. */}
          <button
            type="button"
            role="checkbox"
            aria-checked={consent}
            className={`choice check consent-check${flash ? ' flash' : ''}`}
            onClick={() => setConsent(!consent)}
            data-testid="ob-consent"
          >
            <span className="dot" />
            <span>{consentCheckLabel(helperSetup)}</span>
          </button>
          <button className={`btn primary block xl${consent ? '' : ' is-off'}`} aria-disabled={!consent} onClick={start} data-testid="ob-start">
            Başla
          </button>
        </>
      }
    >
      <h1>DengeYol</h1>
      <p className="lead">
        Yatarken, kalkarken ya da yatakta dönerken gelen kısa baş dönmesinde (kristal oynaması, BPPV) testi ve manevrayı sesle adım adım
        yaptırır. Telefon alnınızda durur. Hekim tanınız olmasa da kullanabilirsiniz.
      </p>
      <div className="card tint-danger stack">
        <div className="card-title">
          <Icon name="alert" />
          <h3>Acil durumda kullanmayın</h3>
        </div>
        <p>
          Durmadan süren baş dönmesi, çift görme, konuşma bozukluğu, yüzde-kolda-bacakta güçsüzlük ya da uyuşma, şiddetli baş ya da göğüs ağrısı varsa
          hemen <a href="tel:112">112'yi arayın</a>.
        </p>
      </div>
      {/* Yan etkiler ve seçenekler katlanır (k03); kapalıyken de özet satırı görünür. */}
      <div className="stack" data-testid="ob-risks">
        <details className="card soft" data-testid="ob-risks-side-effects">
          <summary>
            <strong>Olası yan etkiler</strong>
            <span className="small muted" style={{ display: 'block' }}>
              {CONSENT_RISKS_GIST}
            </span>
          </summary>
          <ul className="stack" style={{ margin: '10px 0 0', paddingLeft: 22, gap: 6 }}>
            {CONSENT_RISKS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
        <details className="card soft" data-testid="ob-risks-options">
          <summary>
            <strong>Seçenekleriniz</strong>
            <span className="small muted" style={{ display: 'block' }}>
              {CONSENT_OPTIONS_GIST}
            </span>
          </summary>
          <ul className="stack" style={{ margin: '10px 0 0', paddingLeft: 22, gap: 6 }}>
            {CONSENT_OPTIONS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </div>
      {!rx && (
        <details className="card soft small">
          <summary>Hekimim bir reçete bağlantısı (QR) verdi</summary>
          <div style={{ marginTop: 10 }}>
            <RxPaste />
          </div>
        </details>
      )}
      {/* Onam metninin tamamı; onay kutusu ekranın altında, "Başla"nın hemen üstünde. */}
      <div className="card soft small" data-testid="ob-consent-text">
        <p style={{ margin: 0 }}>{consentStatement(helperSetup)}</p>
      </div>
      {/* Yakını kurulumu onaydan açıkça ayrı ve katlanır (y03: iki benzer kutu karıştırılıyordu). */}
      <details className="card soft small" data-testid="ob-helper-box" open={helperBoxOpen}>
        <summary>Hasta adına bir yakını mı kuruyor?</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <button
            type="button"
            role="checkbox"
            aria-checked={helperSetup}
            className="choice check"
            onClick={() => {
              const v = !helperSetup;
              setHelperSetup(v);
              // Manevra ekranları da yardımcıya göre konuşsun. Yakını seçimi kaldırılınca "ekranı çevir" de kalkar.
              store.update((x) => ({ ...x, settings: { ...x.settings, assist: v ? 'helper' : 'self', ...(v ? {} : { screenFlip: false }) } }));
            }}
            data-testid="ob-helper"
          >
            <span className="dot" />
            <span>
              Hasta adına, onun bilgisi ve isteğiyle bir yakını olarak kuruyorum
              <span className="sub">Manevrada yönergeler size söylenir; hastaya yalnız kıpırdamaması söylenir.</span>
            </span>
          </button>
          {/* Kullanıcı turu 4 (k02): başucunda durma seçimi yakını seçilince burada da sorulur (hazırlık ekranındakiyle aynı ayar). */}
          {helperSetup && (
            <button
              type="button"
              role="checkbox"
              aria-checked={!!d.settings.screenFlip}
              className="choice check"
              onClick={() => store.update((x) => ({ ...x, settings: { ...x.settings, screenFlip: !x.settings.screenFlip } }))}
              data-testid="ob-flip"
            >
              <span className="dot" />
              <span>
                Hastanın başucunda duracağım (ekranı bana göre çevir)
                <span className="sub">Manevrada ekran size göre ters döner. Sonra hazırlık ekranında da değiştirebilirsiniz.</span>
              </span>
            </button>
          )}
        </div>
      </details>
      <p className="small muted" data-testid="ob-optional">
        Tanınız, hangi kulak olduğu ve sağlık durumunuz isteğe bağlıdır; isterseniz sonra Ayarlar'dan girersiniz. Ses ve yazı boyutu da Ayarlar'da.
      </p>
    </Screen>
  );
}

/**
 * "Bilgilerim": tanı ve sağlık durumu (hepsi isteğe bağlı). Boş bırakılan tanıda uygulama her atakta iki tarafı test eder;
 * işaretlenen sağlık durumu yalnız uyarılır (kilit yok).
 */
function PatientInfo({ focus }: { focus: 'dx' | 'contra' | null }) {
  const d = useData();
  const nav = useNavigate();
  const rx = d.patient?.prescription;
  const helperWording = d.patient?.consentBy === 'helper' || d.settings.assist === 'helper';
  const [dx, setDx] = useState<'yes' | 'no' | null>(rx ? 'yes' : d.patient?.diagnosedByDoctor ? 'yes' : null);
  const [canal, setCanal] = useState<CanalAnswer | null>(rx ? 'PC' : d.patient?.canal && d.patient.canal !== 'unknown' ? d.patient.canal : null);
  const [side, setSide] = useState<SideAnswer | null>(rx ? rx.side : d.patient?.side && d.patient.side !== 'unknown' ? d.patient.side : null);
  const [dxDate, setDxDate] = useState(d.patient?.dxDate ?? rx?.date ?? '');
  // "Son 2 hafta içinde" yanıtının üzerinden 2 haftadan fazla geçtiyse seçim "Daha önce" olarak gelir (k03).
  const [recentExpired] = useState(() => !rx && dxRecentAnswerExpired(d.patient));
  const recentAnsweredAt = d.patient?.dxWhen === 'recent' && typeof d.patient.dxWhenAt === 'number' ? d.patient.dxWhenAt : null;
  const [dxWhen, setDxWhen] = useState<DxWhen | null>(
    rx ? 'date' : recentExpired ? 'older' : (d.patient?.dxWhen ?? (d.patient?.dxDate ? 'date' : null))
  );
  const recentAt = dxWhen === 'recent' ? (recentAnsweredAt !== null && !recentExpired ? recentAnsweredAt : Date.now()) : null;
  const today = localDayKey(Date.now());
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(dxDate) && dxDate <= today;
  const dxOld = dxWhen === 'older' || (dxWhen === 'date' && dateOk && !dxIsRecent({ dxWhen: 'date', dxDate }));
  const [contra, setContra] = useState<string[]>(d.patient?.contraindications ?? []);
  const contraItems = contraindicationsFor(contra);
  const contraRef = useRef<HTMLDivElement | null>(null);
  const dxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = focus === 'contra' ? contraRef.current : focus === 'dx' ? dxRef.current : null;
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
    // Sağlık durumu bölümünden açıldıysa kısa giriş bir kez sesli okunur (tam liste "Tekrar dinle"de; k01, k05).
    if (focus === 'contra') speech.speak(contraSpeechShort(helperWording), 'high');
    return () => speech.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    store.update((x) => {
      const prev = x.patient;
      // Tarih seçilip geçersiz bırakıldıysa tanı zamanı boş sayılır (isteğe bağlı alan; kaydı engellemez).
      const when = dx === 'yes' && dxWhen && (dxWhen !== 'date' || dateOk) ? dxWhen : null;
      return {
        ...x,
        patient: {
          ...(prev ?? { consentAt: new Date().toISOString() }),
          diagnosedByDoctor: dx === 'yes',
          dxWhen: when ?? undefined,
          dxDate: when === 'date' ? dxDate || undefined : undefined,
          // "Son 2 hafta içinde": yakınlık yanıt anından sayılır; yanıt değişmediyse ilk yanıt zamanı korunur.
          dxWhenAt:
            when === 'recent'
              ? prev?.dxWhen === 'recent' && prev.dxWhenAt && !dxRecentAnswerExpired(prev)
                ? prev.dxWhenAt
                : Date.now()
              : undefined,
          canal: dx === 'yes' ? (canal ?? 'unknown') : 'unknown',
          side: dx === 'yes' ? (side ?? 'unknown') : 'unknown',
          contraindications: contra
        }
      };
    });
    nav('/hasta', { replace: true });
  };

  return (
    <Screen
      title="Bilgilerim"
      back="/hasta"
      footer={
        <button className="btn primary block xl" onClick={save} data-testid="ob-save">
          Kaydet
        </button>
      }
    >
      <div className="notice info small" data-testid="ob-info-optional">
        <Icon name="info" />
        <span>Hepsi isteğe bağlı. Boş bırakırsanız uygulama her atakta önce iki tarafı kısa bir testle dener.</span>
      </div>

      <div className="stack" ref={dxRef} data-testid="ob-dx">
        <h2>Tanınız</h2>
        {rx && (
          <div className="notice ok">
            <Icon name="check" />
            <span>
              Reçeteniz yüklü: <strong>{rx.side === 'R' ? 'sağ' : 'sol'} arka kanal</strong>, {rx.maneuver === 'epley' ? 'Epley' : 'Semont'} manevrası.
            </span>
          </div>
        )}
        <div className="field">
          <label>Bir hekim ya da odyolog size muayeneyle kristal oynaması (BPPV) tanısı koydu mu?</label>
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
                  { value: 'PC', label: 'Arka (posterior) kanal', sub: 'En sık tip.' },
                  { value: 'HC', label: 'Yatay (lateral) kanal' },
                  { value: 'unknown', label: 'Bilmiyorum / söylenmedi' }
                ]}
              />
            </div>
            {canal === 'HC' && (
              <div className="notice small" data-testid="ob-hc-warning">
                <Icon name="alert" />
                <span>{GATE_TEXT.HORIZONTAL_CANAL}</span>
              </div>
            )}
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
            <div className="field" data-testid="ob-dx-when">
              <label>Tanı ne zaman kondu?</label>
              <Choice
                name="Tanı zamanı"
                value={dxWhen}
                onChange={setDxWhen}
                options={[
                  {
                    value: 'recent',
                    label: 'Son 2 hafta içinde',
                    // Seçiliyse yanıtın verildiği gün ve yakın sayıldığı son gün, süre dolmadan da (kullanıcı turu 4, k03).
                    sub: (
                      <>
                        Hekiminiz "2 hafta önce" dediyse de bunu seçin.
                        {recentAt !== null && (
                          <span style={{ display: 'block' }} data-testid="ob-dx-recent-at">
                            {dxRecentAnsweredText(recentAt, Date.now())}
                          </span>
                        )}
                      </>
                    )
                  },
                  { value: 'older', label: 'Daha önce', sub: '2 haftadan uzun süre önce' },
                  { value: 'date', label: 'Tarihi biliyorum' }
                ]}
              />
            </div>
            {recentExpired && recentAnsweredAt !== null && dxWhen === 'older' && (
              <div className="notice info small" data-testid="ob-dx-expired">
                <Icon name="info" />
                <span>
                  {formatDate(recentAnsweredAt)} tarihinde "Son 2 hafta içinde" seçmiştiniz; artık "Daha önce" sayılıyor. Yeni bir tanı aldıysanız "Son 2
                  hafta içinde"yi ya da tarihi seçin.
                </span>
              </div>
            )}
            {dxWhen === 'date' && (
              <div className="field">
                <label htmlFor="dxdate">Tanı tarihi</label>
                <input id="dxdate" className="input" type="date" max={today} value={dxDate} onChange={(e) => setDxDate(e.target.value)} />
                {dxDate && !dateOk && <span className="small" style={{ color: 'var(--danger)' }}>Bugünden sonraki bir tarih seçilemez.</span>}
              </div>
            )}
            {dxOld && (
              <div className="notice info small" data-testid="ob-dx-older">
                <Icon name="info" />
                <span>Tanı 2 haftadan eskiyse kristaller başka tarafta olabilir. Uygulama her atakta önce iki tarafı dener; farklı çıkarsa size söyler.</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="stack" ref={contraRef} data-testid="ob-contra">
        <h2 data-testid="ob-contra-title">{helperWording ? 'Hasta için uygun mu?' : 'Sizin için uygun mu?'}</h2>
        <p className="small">
          {helperWording
            ? 'Hastaya uyan varsa işaretleyin. İşaretlemek manevrayı engellemez; uyarı gösterilir ve hekime danışmanız önerilir.'
            : 'Size uyan varsa işaretleyin. İşaretlemek manevrayı engellemez; uyarı gösterilir ve hekiminize danışmanız önerilir.'}
        </p>
        <ListenAgain text={contraSpeech(helperWording)} testid="ob-contra-listen" label={CONTRA_LISTEN_LABEL} />
        <CheckList
          // Her maddenin başında sesteki kısa ad kalın (k05): sesle duyulanla ekrandaki madde eşleşsin.
          options={CONTRAINDICATIONS.map((c) => ({
            value: c.id,
            label: (
              <>
                <strong>{c.label}:</strong> {contraText(c, helperWording)}
              </>
            )
          }))}
          values={contra}
          onToggle={(v) => setContra((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]))}
        />
        {contraItems.length > 0 && (
          <div className="notice small" data-testid="ob-contra-warning">
            <Icon name="alert" />
            <div className="stack" style={{ gap: 4 }}>
              <span>
                <strong>{contraItems.map((c) => c.label).join(', ')}:</strong> {GATE_TEXT.CONTRAINDICATION}
              </span>
              <details>
                <summary>Hekiminize sorun</summary>
                <ol style={{ margin: '6px 0 0', paddingLeft: 22 }}>
                  {contraDoctorQuestions(contra).map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              </details>
            </div>
          </div>
        )}
        <div className="notice info small" data-testid="ob-contra-hearing">
          <Icon name="info" />
          <span>{contraHearingText(helperWording)}</span>
        </div>
        <div className="notice info small" data-testid="ob-not-blocking">
          <Icon name="info" />
          <span>{helperWording ? CONTRA_NOT_BLOCKING_TEXT_HELPER : CONTRA_NOT_BLOCKING_TEXT}</span>
        </div>
        <details className="card soft small" data-testid="ob-haptics">
          <summary>Titreşimleri tanı</summary>
          <HapticLegend />
        </details>
      </div>
    </Screen>
  );
}
