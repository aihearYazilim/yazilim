import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { diagnosisGate, DOSE_TEXT, frequentRecurrence, GATE_TEXT } from '../../../core/safety';
import { episodeDose, episodeSide, formatDateTime, formatTime, maneuversToday, nextAction, doseLimitsFor } from '../../../state/episodes';
import { activeEpisode, store, useData } from '../../../state/store';
import { Icon, Logo } from '../../components/Icon';
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

  if (!p?.consentAt) {
    return (
      <Screen title="DengeYol" right={right}>
        <div className="hero">
          <div className="brand">
            <Logo size={48} />
            <div className="name">DengeYol</div>
          </div>
          <h1>Hoş geldiniz</h1>
          <p className="lead">Başlamadan önce 2 dakikalık kısa bir kurulum yapalım: tanınız ve size uygunluk.</p>
        </div>
        <button className="btn primary block xl" onClick={() => nav('/hasta/kurulum')} data-testid="start-onboarding">
          Kuruluma başla
        </button>
        <div className="card soft small stack">
          <strong>Odyologunuz size bir reçete bağlantısı ya da QR kodu verdiyse</strong>
          <p>Bağlantıyı bu telefonda açın ya da QR kodu telefon kamerasıyla okutun; bilgiler otomatik yüklenir.</p>
        </div>
      </Screen>
    );
  }

  const gate = diagnosisGate({
    diagnosedByDoctor: p.diagnosedByDoctor,
    canal: p.canal,
    side: p.side,
    hasPrescription: !!p.prescription,
    contraindications: p.contraindications
  });
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

      {gate.ok && !ep && (
        <>
          <button className="big-action" onClick={() => nav('/hasta/atak/start')} data-testid="start-episode">
            <Icon name="sparkle" size={34} />
            Baş dönmem başladı
            <span className="sub">Güvenlik soruları → telefonu tanıtma → manevra</span>
          </button>
          <button className="btn secondary block" onClick={() => nav('/hasta/atak/practice')} data-testid="practice">
            <Icon name="play" /> Deneme manevrası (baş dönmesi yokken)
          </button>
        </>
      )}

      {recurrent && (
        <div className="notice">
          <Icon name="alert" />
          <span>Son 30 günde 3 ya da daha fazla atak yaşadınız. Sık tekrarlayan BPPV'de hekiminizle görüşmeniz önerilir.</span>
        </div>
      )}

      <div className="card stack">
        <h3>Tanı bilgileriniz</h3>
        <dl className="kv">
          <dt>Kanal</dt>
          <dd>{p.prescription ? 'Arka kanal' : p.canal === 'PC' ? 'Arka kanal' : p.canal === 'HC' ? 'Yatay kanal' : 'Bilinmiyor'}</dd>
          <dt>Taraf</dt>
          <dd>{(p.prescription?.side ?? p.side) === 'R' ? 'Sağ' : (p.prescription?.side ?? p.side) === 'L' ? 'Sol' : 'Her atakta testle belirlenir'}</dd>
          {p.prescription && (
            <>
              <dt>Reçete</dt>
              <dd>
                {p.prescription.maneuver === 'epley' ? 'Epley' : 'Semont'}, günde en fazla {p.prescription.perDay}, {p.prescription.days} gün
                {p.prescription.by ? ` · ${p.prescription.by}` : ''}
              </dd>
            </>
          )}
        </dl>
        <Link to="/hasta/kurulum" className="small">
          Düzenle
        </Link>
      </div>

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
  const dose = episodeDose(ep, d.patient, now, d.episodes);
  const side = episodeSide(ep, d.patient);
  const limits = doseLimitsFor(d.patient);
  const today = maneuversToday(ep, now);

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
            {today} / {limits.maxPerDay} manevra
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
          <p>Manevranın işe yarayıp yaramadığını görmek için 30 dakika sonra kısa bir test yapacağız.</p>
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
          <p>Hem 30 dakika sonraki hem de sabah testi baş dönmesini tetiklemedi.</p>
          <button className="btn primary block" onClick={() => close('resolved', 'Tekrar testleri negatif')} data-testid="close-resolved">
            Atağı kapat
          </button>
        </div>
      )}

      <div className="row wrap">
        <button className="btn secondary grow" onClick={() => nav(`/hasta/rapor/${ep.id}`)}>
          <Icon name="print" /> Rapor
        </button>
        <button className="btn ghost grow" onClick={() => close('closed', 'Kullanıcı kapattı')}>
          Atak geçti, kapat
        </button>
      </div>
    </div>
  );
}
