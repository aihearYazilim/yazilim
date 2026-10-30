import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { diagnosisGate, DOSE_TEXT, frequentRecurrence, GATE_TEXT } from '../../../core/safety';
import {
  doseFor,
  episodeSide,
  formatDate,
  formatDateTime,
  formatTime,
  nextAction,
  doseLimitsFor,
  pendingReferral,
  RX_VALID_DAYS,
  rxActive
} from '../../../state/episodes';
import { sideName } from '../../../core/protocols';
import { downloadReminder, extractRxToken, isIos, isStandalone } from '../../../platform/reminders';
import { activeEpisode, store, useData } from '../../../state/store';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';

function useNow(ms = 15000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function PatientHome() {
  const d = useData();
  const nav = useNavigate();
  const now = useNow();
  const p = d.patient;
  const ep = activeEpisode(d);
  // Ana ekran her açılışta en üstten (kurulumdan gelince "Baş dönmem başladı" görünür olsun).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const right = (
    <>
      <button className="btn icon" aria-label="Geçmiş" onClick={() => nav('/hasta/gecmis')}>
        <Icon name="history" />
      </button>
      <button className="btn icon" aria-label="Ayarlar" onClick={() => nav('/ayarlar')} data-testid="nav-settings">
        <Icon name="settings" />
      </button>
    </>
  );

  // Kurulum yapılmamışsa doğrudan kuruluma (reçete bağlantısı da orada yapıştırılabilir).
  if (!p?.consentAt) return <Navigate to="/hasta/kurulum" replace />;

  const gate = diagnosisGate({
    diagnosedByDoctor: p.diagnosedByDoctor,
    canal: p.canal,
    side: p.side,
    hasPrescription: !!p.prescription,
    contraindications: p.contraindications
  });
  const referral = !ep && !!pendingReferral(d);
  const recurrent = frequentRecurrence(
    d.episodes.map((e) => e.startedAt),
    now
  );

  return (
    <Screen title="DengeYol" right={right}>
      {!gate.ok && (
        <div className="card tint-warn stack">
          <div className="card-title">
            <Icon name="alert" />
            <h3>Manevralar şu an kapalı</h3>
          </div>
          <p>{GATE_TEXT[gate.reason]}</p>
          <button className="btn secondary" onClick={() => nav('/hasta/kurulum')}>
            Bilgilerimi düzenle
          </button>
        </div>
      )}

      {gate.ok && ep && <ActiveEpisodeCard now={now} />}

      {gate.ok && !ep && referral && (
        <div className="card tint-warn stack" data-testid="home-referral">
          <div className="card-title">
            <Icon name="alert" />
            <h3>Önce hekiminizle görüşün</h3>
          </div>
          <p>Son atağınız hekime yönlendirmeyle sonlandı. Yeni bir manevradan önce hekiminiz ya da odyoloğunuzla görüşmeniz gerekir.</p>
          <DoctorClearance testid="home-doctor-cleared" />
        </div>
      )}

      {gate.ok && !ep && !referral && (
        <>
          <button className="big-action" onClick={() => nav('/hasta/atak/start')} data-testid="start-episode">
            <Icon name="sparkle" size={34} />
            Baş dönmem başladı
            <span className="sub">Birkaç soru, kısa test ve manevra; sesle yönlendirilirsiniz</span>
          </button>
          <button className="btn secondary block" onClick={() => nav('/hasta/atak/practice')} data-testid="practice">
            <Icon name="play" /> Deneme manevrası (baş dönmesi yokken)
          </button>
        </>
      )}

      {recurrent && (
        <div className="notice">
          <Icon name="alert" />
          <span>Son 30 günde 3 ya da daha fazla atak yaşadınız. Sık tekrarlayan BPPV'de hekiminizle görüşün; hekiminiz D vitamini düzeyinize de bakabilir.</span>
        </div>
      )}

      {/* Atak sürerken yalnız atak kartı; kapı kapalıyken kilit kartı yeterli. */}
      {gate.ok && !ep && (
        <div className="card stack">
          {p.prescription && rxActive(p, now) ? (
            <p className="small" data-testid="home-rx">
              <strong>Reçete:</strong> {sideName(p.prescription.side)} taraf, {p.prescription.maneuver === 'epley' ? 'Epley' : 'Semont'}, günde en fazla{' '}
              {p.prescription.perDay}
              {p.prescription.by ? ` · ${p.prescription.by}` : ''}. {formatDate(rxUntil(p.prescription.date))} tarihine kadar geçerli.
            </p>
          ) : (
            <p className="small muted">
              {p.prescription ? 'Reçetenin süresi doldu. ' : ''}Her atakta önce iki tarafı kısa bir testle deneyip baş dönmesinin hangi tarafta olduğunu
              buluruz.
            </p>
          )}
          <Link to="/hasta/kurulum" className="btn ghost">
            Bilgilerimi düzenle
          </Link>
        </div>
      )}

      {!ep && <InstallCard />}

      <div className="card soft row">
        <Icon name="phone" />
        <span className="grow small">Acil belirtilerde (sürekli baş dönmesi, konuşma bozukluğu, güçsüzlük) uygulamayı bırakın.</span>
        <a className="btn danger" href="tel:112">
          112
        </a>
      </div>
    </Screen>
  );
}

function ActiveEpisodeCard({ now }: { now: number }) {
  const d = useData();
  const nav = useNavigate();
  const ep = activeEpisode(d)!;
  const na = nextAction(ep, now);
  const dose = doseFor(d, ep, now);
  const side = episodeSide(ep, d.patient);
  const limits = doseLimitsFor(d.patient);
  // Doz sınırıyla aynı sayım (yarıda kalan manevralar ve diğer ataklar dahil).
  const today = dose.allowed ? limits.maxPerDay - dose.remainingToday : dose.reason === 'DAILY_LIMIT' ? limits.maxPerDay : null;
  const [confirmClose, setConfirmClose] = useState(false);

  const close = (status: 'resolved' | 'closed', note: string) =>
    store.update((x) => ({
      ...x,
      episodes: x.episodes.map((e) => (e.id === ep.id ? { ...e, status, endedAt: Date.now(), endNote: note } : e))
    }));

  return (
    <div className="stack" data-testid="active-episode">
      <div className="card tint-primary stack">
        <div className="row">
          <span className="chip primary">Aktif atak</span>
          <span className="small muted grow">başlangıç {formatDateTime(ep.startedAt)}</span>
        </div>
        <dl className="kv">
          <dt>Taraf</dt>
          <dd>{side === 'R' ? 'Sağ' : side === 'L' ? 'Sol' : 'Henüz belirlenmedi'}</dd>
          <dt>Bugün</dt>
          <dd>
            {today === null
              ? dose.allowed === false && dose.reason !== 'DAILY_LIMIT'
                ? 'atak için manevra süresi/sayısı doldu'
                : 'sınıra ulaşıldı'
              : `${today} / ${limits.maxPerDay} manevra`}
          </dd>
          <dt>Gün</dt>
          <dd>
            {dose.day}. gün (en fazla {limits.maxDays})
          </dd>
        </dl>
      </div>

      {na.kind === 'early-retest' && (
        <div className="card stack">
          <h2>Tekrar testi</h2>
          <p>{na.ready ? 'Tekrar testinin zamanı geldi (yaklaşık 2 dakika).' : 'Manevranın işe yarayıp yaramadığını görmek için 1 saat sonra kısa bir test yapacağız.'}</p>
          {na.ready ? (
            <button className="btn primary block xl" onClick={() => nav('/hasta/atak/retest')} data-testid="do-retest">
              Tekrar testini yap
            </button>
          ) : (
            <div className="notice info">
              <Icon name="timer" />
              <span>
                Test saati: <strong>{formatTime(na.at)}</strong>. Bu arada oturun ve dinlenin.
              </span>
            </div>
          )}
          {!na.ready && <ReminderButton at={na.at} title="DengeYol: tekrar testi zamanı" />}
        </div>
      )}

      {na.kind === 'morning-retest' && (
        <div className="card stack">
          <h2>Sabah testi</h2>
          <p>
            {na.needsSideTest
              ? 'Pozisyon testleri baş dönmesini tetiklemedi; manevra yapılmadı. Sabah iki tarafı yeniden test edeceğiz.'
              : 'Son test baş dönmesini tetiklemedi. Kristallerin yerinde kaldığını görmek için ertesi sabah bir kez daha test edelim.'}
          </p>
          {na.ready ? (
            <button
              className="btn primary block xl"
              onClick={() => nav(na.needsSideTest ? '/hasta/atak/start' : '/hasta/atak/retest')}
              data-testid="do-retest"
            >
              Sabah testini yap
            </button>
          ) : (
            <div className="notice info">
              <Icon name="calendar" />
              <span>
                Test zamanı: <strong>{formatDateTime(na.at)}</strong>
              </span>
            </div>
          )}
          {!na.ready && <ReminderButton at={na.at} title="DengeYol: sabah testi zamanı" />}
        </div>
      )}

      {na.kind === 'treat-again' && (
        <div className="card stack">
          <h2>Baş dönmesi sürüyor</h2>
          {dose.allowed ? (
            <>
              <p>Tekrar testi baş dönmesini tetikledi. Manevrayı yeniden yapabilirsiniz (bugün {dose.remainingToday} hakkınız kaldı).</p>
              <button className="btn primary block xl" onClick={() => nav('/hasta/atak/treat')} data-testid="do-treat">
                Manevrayı tekrarla
              </button>
            </>
          ) : (
            <div className="notice danger">
              <Icon name="alert" />
              <span>{DOSE_TEXT[dose.reason]}</span>
            </div>
          )}
        </div>
      )}

      {na.kind === 'retry-side-test' && (
        <button className="btn primary block xl" onClick={() => nav('/hasta/atak/start')} data-testid="continue-episode">
          Ataka devam et
        </button>
      )}

      {na.kind === 'resolved-suggest' && (
        <div className="card tint-ok stack">
          <h2>Düzelmiş görünüyor</h2>
          <p>Hem 1 saat sonraki hem de sabah testi baş dönmesini tetiklemedi.</p>
          <button className="btn primary block" onClick={() => close('resolved', 'Tekrar testleri negatif')} data-testid="close-resolved">
            Atağı kapat
          </button>
        </div>
      )}

      <div className="row wrap">
        <button className="btn secondary grow" onClick={() => nav(`/hasta/rapor/${ep.id}`)}>
          <Icon name="print" /> Rapor
        </button>
        {!confirmClose && (
          <button className="btn ghost grow" onClick={() => setConfirmClose(true)} data-testid="close-episode">
            Atak geçti, kapat
          </button>
        )}
      </div>
      {confirmClose && (
        <div className="card tint-warn stack" data-testid="close-confirm">
          <p>
            Atağı kapatırsanız kalan tekrar testleri yapılmaz. Tekrar testleri, kristallerin yerinde kalıp kalmadığını gösterir. Yine de kapatılsın mı?
          </p>
          <div className="row wrap">
            <button className="btn warn grow" onClick={() => close('closed', 'Kullanıcı kapattı')} data-testid="close-confirm-yes">
              Evet, kapat
            </button>
            <button className="btn secondary grow" onClick={() => setConfirmClose(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReminderButton({ at, title }: { at: number; title: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn secondary"
      onClick={() => {
        downloadReminder(at, title, 'DengeYol uygulamasını açıp ana ekrandaki testi yapın. Yaklaşık 2 dakika sürer.');
        setDone(true);
      }}
      data-testid="add-reminder"
    >
      <Icon name="calendar" /> {done ? `İndirildi; açılmazsa saat uygulamasında ${formatTime(at)} için alarm kurun` : 'Takvime hatırlatıcı ekle'}
    </button>
  );
}

/** Ana ekrana ekleme rehberi (yüklü değilse). iPhone'da Safari verisi ile ana ekran uygulaması ayrı tutulur. */
function InstallCard() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('dengeyol:installHidden') === '1';
    } catch {
      return false;
    }
  });
  if (hidden || isStandalone()) return null;
  const ios = isIos();
  return (
    <div className="card soft stack small" data-testid="install-card">
      <strong>Uygulamayı ana ekrana ekleyin</strong>
      <p>
        {ios
          ? 'Safari\'de alttaki Paylaş düğmesine, ardından "Ana Ekrana Ekle"ye dokunun. Atak geldiğinde DengeYol\'u ana ekrandan açın. Not: iPhone\'da ana ekrandaki uygulama Safari\'deki bilgileri görmez; reçeteniz varsa bağlantıyı ana ekrandan açtığınız uygulamada yeniden açın ya da yapıştırın.'
          : 'Tarayıcı menüsünden "Uygulamayı yükle" ya da "Ana ekrana ekle"yi seçin. Atak geldiğinde DengeYol\'u ana ekrandan açın; internet olmadan da çalışır.'}
      </p>
      <button
        className="btn ghost"
        onClick={() => {
          try {
            localStorage.setItem('dengeyol:installHidden', '1');
          } catch {
            /* yok say */
          }
          setHidden(true);
        }}
      >
        Anladım, gizle
      </button>
    </div>
  );
}

/** Reçete bağlantısını uygulamanın içine yapıştırma (QR okutulamadığında ya da iPhone ana ekran uygulamasında). */
export function RxPaste() {
  const nav = useNavigate();
  const [v, setV] = useState('');
  const [err, setErr] = useState(false);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <label htmlFor="rxpaste">Ya da bağlantıyı buraya yapıştırın:</label>
      <div className="row">
        <input
          id="rxpaste"
          className="input grow"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setErr(false);
          }}
          placeholder="https://…#/recete/…"
          data-testid="rx-paste"
        />
        <button
          className="btn secondary"
          onClick={() => {
            const t = extractRxToken(v);
            if (t) nav(`/recete/${t}`);
            else setErr(true);
          }}
          data-testid="rx-paste-open"
        >
          Aç
        </button>
      </div>
      {err && <span className="small" style={{ color: 'var(--danger)' }}>Bu bir reçete bağlantısına benzemiyor.</span>}
    </div>
  );
}

function rxUntil(date: string): number {
  return new Date(`${date}T00:00:00`).getTime() + RX_VALID_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Hekime yönlendirme kilidini açma: iki adımlı (düşünmeden dokunulmasın). Kilit beyana dayanır; bu yüzden soru açık ve
 * tek anlamlı sorulur. onCleared: kilit açıldıktan sonra yapılacak iş.
 */
export function DoctorClearance({ testid, onCleared }: { testid: string; onCleared?: () => void }) {
  const [ask, setAsk] = useState(false);
  if (!ask) {
    return (
      <button className="btn secondary block" onClick={() => setAsk(true)} data-testid={testid}>
        Hekimimle görüştüm
      </button>
    );
  }
  return (
    <div className="card stack" data-testid={`${testid}-confirm`}>
      <strong>Hekiminiz, bu baş dönmesi için evde manevra yapmanızda sakınca olmadığını söyledi mi?</strong>
      <button
        className="btn primary block"
        onClick={() => {
          store.update((x) => ({ ...x, patient: x.patient ? { ...x.patient, doctorClearedAt: Date.now() } : x.patient }));
          onCleared?.();
        }}
        data-testid={`${testid}-yes`}
      >
        Evet, söyledi
      </button>
      <button className="btn ghost block" onClick={() => setAsk(false)}>
        Hayır / henüz görüşmedim
      </button>
    </div>
  );
}
