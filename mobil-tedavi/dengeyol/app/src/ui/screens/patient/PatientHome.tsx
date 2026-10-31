import { rxValidityLabel } from '../../../core/prescription';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { contraDoctorQuestions, contraindicationsFor, diagnosisGate, GATE_TEXT, RED_FLAGS, redFlagDoctorAsk } from '../../../core/safety';
import {
  doseFor,
  doseLimitText,
  episodeSide,
  formatDateTime,
  formatTime,
  nextAction,
  nightNote,
  doseLimitsFor,
  pendingReferral,
  recurrenceWarning,
  referralFlags,
  rxActive,
  rxFirstEpisode,
  sameDayReopenable,
  startDose
} from '../../../state/episodes';
import type { AppData, Episode } from '../../../state/types';
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
  // Son 24 saatte kapatılan atak: raporu hekime göndermek bir dokunuş uzakta olsun.
  const recentlyClosed = ep
    ? null
    : ([...d.episodes].reverse().find((e) => (e.status === 'resolved' || e.status === 'closed') && e.endedAt && now - e.endedAt < 24 * 3600_000) ?? null);
  const recurrent = recurrenceWarning(
    d.episodes.map((e) => e.startedAt),
    now
  );
  // Yeni atak için doz: sınır doluyken büyük düğme yerine sınır ve bir sonraki izinli zaman (14 soru sordurulmaz).
  // Bugün manevrayla kapatılmış atak yeniden açılacaksa sınır o atağa göre hesaplanır (kullanıcı turu 2, k06: sınır doluyken
  // "Bugünkü atağınıza devam edilir" düğmesi çıkmasın).
  const reopenable = !ep ? sameDayReopenable(d, now) : null;
  const startDs = !ep ? startDose(d, now) : null;
  const startBlocked = startDs && !startDs.allowed ? startDs : null;
  const referralEp = !ep ? pendingReferral(d) : null;
  // Reçeteli kısa yolda taraf testi yapılmaz (kullanıcı turu 2, k02).
  const rxShort = !reopenable && rxFirstEpisode(d, now);
  const rxReport = !ep ? rxEndReport(d, now) : null;

  return (
    <Screen title="DengeYol" right={right}>
      {!gate.ok && (
        <div className="card tint-warn stack" data-testid="home-gate-blocked">
          <div className="card-title">
            <Icon name="alert" />
            <h3>Manevralar şu an kapalı</h3>
          </div>
          <p>{GATE_TEXT[gate.reason]}</p>
          {gate.reason === 'CONTRAINDICATION' && <ContraSummary ids={p.contraindications} />}
          <button className="btn secondary" onClick={() => nav('/hasta/kurulum')}>
            Bilgilerimi düzenle
          </button>
        </div>
      )}
      {!gate.ok && gate.reason === 'NO_DIAGNOSIS' && <UrgencyLadder />}

      {gate.ok && ep && <ActiveEpisodeCard now={now} />}

      {gate.ok && !ep && referral && (
        <div className="card tint-warn stack" data-testid="home-referral">
          <div className="card-title">
            <Icon name="alert" />
            <h3>Önce hekiminizle görüşün</h3>
          </div>
          <p>Son atağınız hekime yönlendirmeyle sonlandı. Yeni bir manevradan önce hekiminiz ya da odyoloğunuzla görüşmeniz gerekir.</p>
          {referralEp && <ReferralReason episode={referralEp} />}
          <DoctorClearance testid="home-doctor-cleared" />
        </div>
      )}

      {gate.ok && !ep && !referral && recentlyClosed && (
        <div className="card tint-ok stack" data-testid="home-closed">
          <div className="card-title">
            <Icon name="check" />
            <h3>Atak kapatıldı</h3>
          </div>
          <p className="small">Raporu hekiminize ya da odyoloğunuza gönderebilirsiniz.</p>
          <button className="btn secondary block" onClick={() => nav(`/hasta/rapor/${recentlyClosed.id}`)} data-testid="home-closed-report">
            <Icon name="print" /> Raporu hekime gönder
          </button>
        </div>
      )}

      {gate.ok && !ep && !referral && startBlocked && (
        <div className="card tint-warn stack" data-testid="home-dose-limit">
          <div className="card-title">
            <Icon name="timer" />
            <h3>{startBlocked.reason === 'DAILY_LIMIT' ? 'Bugünlük manevra sınırı doldu' : 'Evde manevra sınırı doldu'}</h3>
          </div>
          <p>{doseLimitText(startBlocked, d, now)}</p>
        </div>
      )}

      {gate.ok && !ep && !referral && !startBlocked && (
        <>
          <button className="big-action" onClick={() => nav('/hasta/atak/start')} data-testid="start-episode">
            <Icon name="sparkle" size={34} />
            Baş dönmem başladı
            <span className="sub">
              {reopenable
                ? 'Bugünkü atağınıza devam edilir'
                : rxShort
                  ? `${RED_FLAGS.length} güvenlik sorusu ve manevra · ~8 dk (gerekirse kısa test)`
                  : `${RED_FLAGS.length} güvenlik sorusu, iki kısa test ve manevra · ~15 dk`}
            </span>
          </button>
          <button className="btn secondary block" onClick={() => nav('/hasta/atak/practice')} data-testid="practice">
            <Icon name="play" /> Deneme manevrası (baş dönmesi yokken)
          </button>
        </>
      )}

      {rxReport && <RxEndReportCard report={rxReport} />}

      {recurrent && (
        <div className="notice" data-testid="home-recurrence">
          <Icon name="alert" />
          <span>{recurrent.text}</span>
        </div>
      )}

      {/* Atak sürerken yalnız atak kartı; kapı kapalıyken kilit kartı yeterli. */}
      {gate.ok && !ep && (
        <div className="card stack">
          {p.prescription && rxActive(p, now) ? (
            <p className="small" data-testid="home-rx">
              <strong>Reçete:</strong> {sideName(p.prescription.side)} taraf, {p.prescription.maneuver === 'epley' ? 'Epley' : 'Semont'}, günde en fazla{' '}
              {p.prescription.perDay}
              {p.prescription.by ? ` · ${p.prescription.by}` : ''}. {rxValidityLabel(p.prescription)} geçerli.
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

      <div className="card soft row" data-testid="home-112">
        <Icon name="phone" />
        <span className="grow small">
          Şunlardan biri varsa uygulamayı bırakıp 112'yi arayın: sürekli baş dönmesi, çift görme, konuşma ya da yutma bozukluğu, yüzde,
          kolda ya da bacakta güçsüzlük veya uyuşma, baş dönmesi yokken de yürüyememe, ani ve şiddetli baş ya da boyun ağrısı, göğüs
          ağrısı, çarpıntı ya da bayılma.
        </span>
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
          <span className="chip primary">Şu anki atak</span>
          <span className="small muted grow">başlangıç {formatDateTime(ep.startedAt)}</span>
        </div>
        <dl className="kv">
          <dt>Taraf</dt>
          <dd>
            {/* Test yapılmadan profildeki eski tanının tarafı "taraf" diye gösterilmez (test gereksiz sanılmasın). */}
            {ep.side || (d.patient && rxActive(d.patient, now))
              ? `${side === 'R' ? 'Sağ' : 'Sol'}${ep.side ? '' : ' (reçete)'}`
              : side
                ? `Henüz test edilmedi (son tanı: ${side === 'R' ? 'sağ' : 'sol'})`
                : 'Henüz belirlenmedi'}
          </dd>
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
                {nightNote(na.at) ? ` ${nightNote(na.at)}` : ''}
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
              ? 'Pozisyon testlerinde baş dönmesi başlamadı; manevra yapılmadı. Sabah iki tarafı yeniden test edeceğiz.'
              : 'Son testte baş dönmesi gelmedi. Kristallerin yerinde kaldığını görmek için yarın sabah bir kez daha bakalım.'}
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
              <p>Tekrar testinde baş dönmesi başladı. Manevrayı yeniden yapabilirsiniz (bugün {dose.remainingToday} hakkınız kaldı).</p>
              <button className="btn primary block xl" onClick={() => nav('/hasta/atak/treat')} data-testid="do-treat">
                Manevrayı tekrarla
              </button>
            </>
          ) : (
            <div className="notice danger">
              <Icon name="alert" />
              <span>{doseLimitText(dose, d, now)}</span>
            </div>
          )}
        </div>
      )}

      {/* Sınır doluyken "Ataka devam et" aynı sınır ekranına götüren çıkmaz bir döngüdür: yerine sınır ve sonraki zaman. */}
      {na.kind === 'retry-side-test' &&
        (dose.allowed ? (
          <button className="btn primary block xl" onClick={() => nav('/hasta/atak/start')} data-testid="continue-episode">
            Ataka devam et
          </button>
        ) : (
          <div className="notice danger" data-testid="home-dose-limit">
            <Icon name="alert" />
            <span>{doseLimitText(dose, d, now)}</span>
          </div>
        ))}

      {na.kind === 'resolved-suggest' && (
        <div className="card tint-ok stack">
          <h2>Düzelmiş görünüyor</h2>
          <p>Ne 1 saat sonraki ne de sabah testinde baş dönmesi başladı.</p>
          <button className="btn primary block" onClick={() => close('resolved', 'Tekrar testleri negatif')} data-testid="close-resolved">
            Atağı kapat
          </button>
        </div>
      )}

      <div className="row wrap">
        <button className="btn secondary grow" onClick={() => nav(`/hasta/rapor/${ep.id}`)}>
          <Icon name="print" /> Rapor
        </button>
        {/* Düzelmiş görünüyorsa tek kapatma düğmesi yukarıdaki kartta. */}
        {!confirmClose && na.kind !== 'resolved-suggest' && (
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

/**
 * Tanısız (ilk) baş dönmesi: kilit kalır; ama kişi korkutulup yalnız bırakılmaz. İki sakinleştirici cümle ve belirtiye göre
 * nereye, ne kadar acil gidileceği (112 / bugün acil / bugün KBB / birkaç gün içinde KBB). Belirti listesi kırmızı bayrak
 * sorularıyla aynı belirtileri kapsar.
 */
export function UrgencyLadder() {
  return (
    <div className="card stack" data-testid="urgency-ladder">
      <h3>İlk kez baş dönmesi: ne yapmalı?</h3>
      <p>
        Baş hareketiyle başlayıp saniyeler süren dönme hissinin en sık nedeni iyi huylu kristal oynamasıdır (BPPV); tehlikeli değildir ve
        muayenede yapılan birkaç dakikalık bir manevrayla çoğunlukla düzelir. Yine de ilk atakta tanının muayeneyle konması gerekir;
        aşağıdan size uyan ilk satıra göre davranın.
      </p>
      <ol className="stack small" style={{ margin: 0, paddingLeft: 22 }}>
        <li>
          <strong>Hemen 112:</strong> konuşma ya da yutma bozukluğu, çift görme, yüzde/kolda/bacakta güçsüzlük ya da uyuşma, yürüyememe, ani ve
          çok şiddetli baş ya da boyun ağrısı, göğüs ağrısı, çarpıntı ya da bayılma.
        </li>
        <li>
          <strong>Bugün acil servise:</strong> kıpırdamadan dururken de saatlerdir süren dönme, içtiğiniz suyu bile kusma, ateş, başınızı çarptıktan
          sonra başlayan baş dönmesi (kan sulandırıcı kullanıyorsanız özellikle).
        </li>
        <li>
          <strong>Bugün KBB hekimine</strong> (ya da KBB hekimi olan bir hastanenin acil servisine): bir kulakta ani işitme kaybı ya da yeni dolgunluk
          (tıkanma). Erken tedavi işitmeyi kurtarabilir.
        </li>
        <li>
          <strong>Birkaç gün içinde KBB hekimine ya da odyoloğa:</strong> yalnız yatarken, yataktan kalkarken, yatakta dönerken ya da yukarı bakınca
          başlayan, kısa süren dönme; yanında hafif bulantı ya da çınlama olabilir. Ne zaman başladığını, ne kadar sürdüğünü ve hangi
          hareketle başladığını hekiminize anlatın. Ayağa kalkınca gözleriniz kararıyorsa bunu da söyleyin.
        </li>
      </ol>
      <DoctorNotes />
      <p className="small muted">Tanı aldıktan sonra "Bilgilerimi düzenle" ile hekiminizin söylediğini girin; size uygunsa manevralar açılır.</p>
    </div>
  );
}

/** Tanısız kişinin muayenede hekime söyleyecekleri (kullanıcı turu 2, k03): paylaşılabilir, doldurulabilir liste. */
export const DOCTOR_NOTES: string[] = [
  'Baş dönmesi ilk kez ne zaman başladı?',
  'Her seferinde ne kadar sürüyor: saniyeler mi, dakikalar mı, saatler mi?',
  'Hangi hareketle başlıyor: yatarken, yataktan kalkarken, yatakta yana dönerken, yukarı bakınca ya da kendiliğinden?',
  'Kulağınızda işitme azalması, tıkanma, çınlama, ağrı ya da akıntı var mı; hangi kulakta?',
  'Bulantı ya da kusma oldu mu?',
  'Ayağa kalkınca, etraf dönmeden gözleriniz kararıyor mu?',
  'Yakın zamanda başınızı çarptınız mı ya da hastalandınız mı (ateş, grip)?',
  'Kullandığınız ilaçlar (özellikle kan sulandırıcı ve tansiyon ilaçları).'
];

function DoctorNotes() {
  const [msg, setMsg] = useState<string | null>(null);
  const share = async () => {
    const text = ['DengeYol — muayenede hekime söyleyeceklerim', ...DOCTOR_NOTES.map((q, i) => `${i + 1}. ${q} …`)].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Hekime söyleyeceklerim', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg('Liste kopyalandı; notlarınıza ya da bir mesaja yapıştırıp yanıtlarınızı yazabilirsiniz.');
    } catch {
      /* kullanıcı vazgeçti ya da pano kullanılamıyor */
    }
  };
  return (
    <div className="stack small" style={{ gap: 6 }} data-testid="doctor-notes">
      <strong>Muayenede hekime söyleyecekleriniz</strong>
      <ul style={{ margin: 0, paddingLeft: 22 }}>
        {DOCTOR_NOTES.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
      <button className="btn secondary" onClick={() => void share()} data-testid="doctor-notes-share">
        <Icon name="share" /> Listeyi kaydet / gönder
      </button>
      {msg && <span className="muted">{msg}</span>}
    </div>
  );
}

/** Kapalı kartta engelleyen maddeler ve hekime sorulacaklar (kullanıcı turu 2, k07). */
function ContraSummary({ ids }: { ids: string[] }) {
  const items = contraindicationsFor(ids);
  if (items.length === 0) return null;
  const questions = contraDoctorQuestions(ids);
  return (
    <div className="stack small" style={{ gap: 4 }} data-testid="home-gate-items">
      <strong>{items.length > 1 ? 'Sizi engelleyen durumlar:' : 'Sizi engelleyen durum:'}</strong>
      <ul style={{ margin: 0, paddingLeft: 22 }}>
        {items.map((c) => (
          <li key={c.id}>{c.label}</li>
        ))}
      </ul>
      <strong>Hekiminize sorun:</strong>
      <ol style={{ margin: 0, paddingLeft: 22 }}>
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Hekime yönlendirme kilidinde: hangi güvenlik sorusuna verilen yanıtla durdurulduğu ve hekime sorulacak cümle; sorunun
 * açıklaması varsa (kulak: KBB değerlendirmesinden sonra nasıl yanıtlanır) o da (kullanıcı turu 2, k03).
 */
export function ReferralReason({ episode }: { episode: Episode }) {
  const flags = referralFlags(episode);
  if (flags.length === 0) return null;
  return (
    <div className="stack small" style={{ gap: 6 }} data-testid="referral-reason">
      <p>
        <strong>Durdurma nedeni:</strong> güvenlik sorularında {flags.map((q) => `"${q.label}"`).join(', ')} için "Evet" dediniz.
      </p>
      {flags.map((q) => (
        <div key={q.id} className="stack" style={{ gap: 4 }}>
          <p>
            <strong>Hekiminize sorun:</strong> "{redFlagDoctorAsk(q)}"
          </p>
          {q.hint && <p className="muted">{q.hint}</p>}
        </div>
      ))}
    </div>
  );
}

/** Reçetenin süresi dolduysa ve o dönemde atak varsa: raporu reçeteyi yazan hekime gönderme hatırlatması (k09). */
function rxEndReport(d: AppData, now: number): { episodeId: string; by?: string; key: string } | null {
  const rx = d.patient?.prescription;
  if (!rx || rxActive(d.patient, now)) return null;
  const issued = new Date(`${rx.date}T00:00:00`).getTime();
  if (!Number.isFinite(issued) || issued > now) return null;
  const since = d.episodes.filter((e) => e.startedAt >= issued && e.status !== 'active').sort((a, b) => b.startedAt - a.startedAt);
  const last = since[0];
  if (!last) return null;
  return { episodeId: last.id, by: rx.by, key: `dengeyol:rxReportHidden:${rx.date}:${rx.pid ?? ''}` };
}

function RxEndReportCard({ report }: { report: { episodeId: string; by?: string; key: string } }) {
  const nav = useNavigate();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(report.key) === '1';
    } catch {
      return false;
    }
  });
  if (hidden) return null;
  const hide = () => {
    try {
      localStorage.setItem(report.key, '1');
    } catch {
      /* yok say */
    }
    setHidden(true);
  };
  return (
    <div className="card tint-accent stack" data-testid="home-rx-report">
      <div className="card-title">
        <Icon name="print" />
        <h3>Reçetenizin süresi doldu</h3>
      </div>
      <p className="small">
        Raporunuzu hekiminize{report.by ? ` (${report.by})` : ''} gönderin: hekiminiz tedavinin işe yarayıp yaramadığını görür.
      </p>
      <button
        className="btn secondary block"
        onClick={() => {
          hide();
          nav(`/hasta/rapor/${report.episodeId}`);
        }}
        data-testid="home-rx-report-open"
      >
        <Icon name="print" /> Raporu hekime gönder
      </button>
      <button className="btn ghost" onClick={hide}>
        Gönderdim, gizle
      </button>
    </div>
  );
}

/**
 * Hekime yönlendirme kilidini açma: iki adımlı (düşünmeden dokunulmasın). Kilit beyana dayanır; bu yüzden soru açık ve
 * tek anlamlı sorulur. onCleared: kilit açıldıktan sonra yapılacak iş.
 */
export function DoctorClearance({ testid, onCleared }: { testid: string; onCleared?: () => void }) {
  const [ask, setAsk] = useState(false);
  const d = useData();
  const ref = pendingReferral(d);
  const flags = ref ? referralFlags(ref) : [];
  // Kilit bir güvenlik sorusundan geldiyse soru o belirtiyi de anar (ör. kulak belirtisi; k03).
  const about = flags.length ? ` ve işaretlediğiniz belirti (${flags.map((q) => q.label).join(', ')})` : '';
  if (!ask) {
    return (
      <button className="btn secondary block" onClick={() => setAsk(true)} data-testid={testid}>
        Hekimimle görüştüm
      </button>
    );
  }
  return (
    <div className="card stack" data-testid={`${testid}-confirm`}>
      <strong>Hekiminiz, bu baş dönmesi{about} için evde manevra yapmanızda sakınca olmadığını söyledi mi?</strong>
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
