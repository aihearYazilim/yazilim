/**
 * Hasta atak akışı.
 * Modlar:
 *   start    — yeni atak (ya da yarım kalan ataka devam): kırmızı bayrak → kalibrasyon → taraf → manevra → sonrası
 *   retest   — 30 dk / sabah tekrar testi: (kırmızı bayrak) → kalibrasyon → Dix-Hallpike (tedavi edilen taraf) → sonuç
 *   treat    — pozitif tekrar testi sonrası yeniden manevra
 *   practice — deneme manevrası (kayıt tutulmaz)
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Calibration } from '../../../core/calibration';
import type { Side } from '../../../core/protocols';
import { sideName } from '../../../core/protocols';
import { vertigoSummary } from '../../../core/runner';
import {
  diagnosisGate,
  DOSE_TEXT,
  evaluateRedFlags,
  interpretSideTests,
  RED_FLAGS,
  REFER_TEXT,
  type RedFlagQuestion,
  type SideDecision,
  type SideTestResult,
  type StopAction,
  type YesNo
} from '../../../core/safety';
import { episodeDose, episodeSide, formatTime, EARLY_RETEST_MS, needsRedFlags, nextAction } from '../../../state/episodes';
import { activeEpisode, store, uid, useData } from '../../../state/store';
import type { Episode, ManeuverLog } from '../../../state/types';
import { Choice, StepDots, YesNo as YesNoButtons } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Calibrate } from '../Calibrate';
import { RunnerView, type RunnerOutcome } from '../RunnerView';

type Mode = 'start' | 'retest' | 'treat' | 'practice';

type Stage =
  | { k: 'redflags'; i: number; answers: Record<string, YesNo> }
  | { k: 'stop'; action: StopAction; triggered: RedFlagQuestion[] }
  | { k: 'calibrate' }
  | { k: 'sideConfirm'; known: Side }
  | { k: 'sideQ' }
  | { k: 'sideRun'; order: Side[]; results: SideTestResult[] }
  | { k: 'sideRest'; order: Side[]; results: SideTestResult[] }
  | { k: 'stronger'; results: SideTestResult[] }
  | { k: 'practiceSide' }
  | { k: 'maneuver'; side: Side }
  | { k: 'after'; side: Side }
  | { k: 'retestRun'; side: Side }
  | { k: 'end'; tone: 'ok' | 'warn' | 'danger' | 'info'; title: string; text: string; testid: string; extra?: 'treat' };

function updateEpisode(id: string, fn: (e: Episode) => Episode) {
  store.update((d) => ({ ...d, episodes: d.episodes.map((e) => (e.id === id ? fn(e) : e)) }));
}

export function EpisodeFlow() {
  const { mode: modeParam } = useParams();
  const mode = (['start', 'retest', 'treat', 'practice'].includes(modeParam ?? '') ? modeParam : 'start') as Mode;
  const d = useData();
  const nav = useNavigate();
  const profile = d.patient;
  const [episodeId, setEpisodeId] = useState<string | null>(() => activeEpisode(d)?.id ?? null);
  const [cal, setCal] = useState<Calibration | null>(null);

  const initialStage = (): Stage => {
    if (mode === 'practice') return { k: 'calibrate' };
    if (needsRedFlags(activeEpisode(d), Date.now())) return { k: 'redflags', i: 0, answers: {} };
    return { k: 'calibrate' };
  };
  const [stage, setStage] = useState<Stage>(initialStage);

  const gate = profile
    ? diagnosisGate({
        diagnosedByDoctor: profile.diagnosedByDoctor,
        canal: profile.canal,
        side: profile.side,
        hasPrescription: !!profile.prescription,
        contraindications: profile.contraindications
      })
    : null;

  const maneuverId = profile?.prescription?.maneuver ?? 'epley';

  const ensureEpisode = useCallback((): string => {
    const existing = activeEpisode(store.get());
    if (existing) {
      setEpisodeId(existing.id);
      return existing.id;
    }
    const e: Episode = {
      id: uid(),
      startedAt: Date.now(),
      side: null,
      protocolId: maneuverId,
      redFlags: [],
      sideTests: [],
      maneuvers: [],
      retests: [],
      status: 'active'
    };
    store.update((x) => ({ ...x, episodes: [...x.episodes, e] }));
    setEpisodeId(e.id);
    return e.id;
  }, [maneuverId]);

  // ---- Kilit: kurulum yapılmamış ya da kapı kapalı --------------------------------------------
  if (!profile?.consentAt || !gate || !gate.ok) {
    return (
      <Screen title="DengeYol" back="/hasta">
        <div className="card tint-warn">
          <p>Önce kurulumu tamamlayın. Kurulum, manevranın sizin için uygun olup olmadığını kontrol eder.</p>
        </div>
        <button className="btn primary block" onClick={() => nav('/hasta/kurulum')}>
          Kuruluma git
        </button>
      </Screen>
    );
  }

  const requireSideTest = gate.requireSideTest;

  // ---- Akış geçişleri --------------------------------------------------------------------------
  const afterCalibration = (c: Calibration) => {
    setCal(c);
    store.update((x) => ({ ...x, patient: x.patient ? { ...x.patient, calibration: c } : x.patient }));
    if (mode === 'practice') {
      const s = profile.prescription?.side ?? (profile.side !== 'unknown' ? profile.side : null);
      if (s) setStage({ k: 'maneuver', side: s });
      else setStage({ k: 'practiceSide' });
      return;
    }
    const ep = activeEpisode(store.get());
    if (mode === 'retest') {
      const s = ep ? episodeSide(ep, profile) : null;
      if (!s) return toStart();
      setStage({ k: 'retestRun', side: s });
      return;
    }
    if (mode === 'treat') {
      const s = ep ? episodeSide(ep, profile) : null;
      if (!s) return toStart();
      if (!checkDose()) return;
      setStage({ k: 'maneuver', side: s });
      return;
    }
    // start
    if (ep && ep.side) {
      if (!checkDose()) return;
      setStage({ k: 'maneuver', side: ep.side });
      return;
    }
    const known = profile.prescription?.side ?? (profile.side !== 'unknown' ? profile.side : null);
    if (known && !requireSideTest) setStage({ k: 'sideConfirm', known });
    else setStage({ k: 'sideQ' });
  };

  const toStart = () => {
    setStage({
      k: 'end',
      tone: 'warn',
      title: 'Taraf belirlenmemiş',
      text: 'Bu atakta tedavi edilen taraf bulunamadı. Ana ekrandan atağa yeniden başlayın.',
      testid: 'end-noside'
    });
  };

  const checkDose = (): boolean => {
    const ep = activeEpisode(store.get());
    if (!ep) return true;
    const ds = episodeDose(ep, store.get().patient, Date.now());
    if (!ds.allowed) {
      if (ds.reason !== 'DAILY_LIMIT') {
        updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: DOSE_TEXT[ds.reason] }));
      }
      setStage({ k: 'end', tone: 'warn', title: 'Manevra sınırına ulaşıldı', text: DOSE_TEXT[ds.reason], testid: 'end-dose' });
      return false;
    }
    return true;
  };

  const onRedFlagsDone = (answers: Record<string, YesNo>) => {
    const out = evaluateRedFlags(answers);
    if (mode !== 'practice') {
      const id = ensureEpisode();
      updateEpisode(id, (e) => ({ ...e, redFlags: [...e.redFlags, { at: Date.now(), answers, stopped: out.stop }] }));
      if (out.stop) {
        updateEpisode(id, (e) => ({
          ...e,
          status: out.action === 'emergency' ? 'emergency' : 'referred',
          endedAt: Date.now(),
          endNote: out.triggered.map((q) => q.id).join(', ')
        }));
      }
    }
    if (out.stop && out.action) setStage({ k: 'stop', action: out.action, triggered: out.triggered });
    else setStage({ k: 'calibrate' });
  };

  const logSideTest = (results: SideTestResult[], stronger: Side | 'equal' | null, decision: SideDecision) => {
    const id = ensureEpisode();
    updateEpisode(id, (e) => ({
      ...e,
      side: decision.kind === 'TREAT' ? decision.side : e.side,
      sideTests: [...e.sideTests, { at: Date.now(), results, stronger, decision }],
      ...(decision.kind === 'REFER' ? { status: 'referred' as const, endedAt: Date.now(), endNote: decision.reason } : {})
    }));
  };

  const knownSideForConflict = (): Side | null =>
    profile.prescription?.side ?? (profile.side !== 'unknown' ? profile.side : null);

  const decide = (results: SideTestResult[], stronger: Side | 'equal' | null) => {
    const dec = interpretSideTests(results, knownSideForConflict(), stronger);
    if (dec.kind === 'ASK_STRONGER') {
      setStage({ k: 'stronger', results });
      return;
    }
    logSideTest(results, stronger, dec);
    if (dec.kind === 'TREAT') {
      if (!checkDose()) return;
      setStage({ k: 'maneuver', side: dec.side });
    } else if (dec.kind === 'NOT_TRIGGERED') {
      setStage({
        k: 'end',
        tone: 'info',
        title: 'Bugün baş dönmesi tetiklenmedi',
        text: 'Pozisyon testleri baş dönmesini başlatmadı. Bu durumda manevra yapılmaz. Kristaller kendiliğinden yerine oturmuş olabilir. Yarın sabah yeniden test edebilirsiniz. Baş dönmesi farklı ya da sürekli ise hekiminize başvurun.',
        testid: 'end-not-triggered'
      });
    } else if (dec.kind === 'REFER') {
      setStage({ k: 'end', tone: 'warn', title: 'Hekiminize ya da odyologunuza başvurun', text: REFER_TEXT[dec.reason], testid: 'end-refer' });
    }
  };

  const onSideRunExit = (o: RunnerOutcome, order: Side[], results: SideTestResult[]) => {
    const side = order[results.length]!;
    if (o.phase === 'aborted') {
      setStage({ k: 'end', tone: 'info', title: 'Test yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz.', testid: 'end-aborted' });
      return;
    }
    const rec = o.state.records.find((r) => r.stepId === 'dh-lie');
    const v = rec ? vertigoSummary(rec) : null;
    const res: SideTestResult = {
      side,
      vertigo: !!v,
      latencySec: v?.latencySec ?? null,
      durationSec: v?.durationSec ?? null,
      safetyStopped: o.phase === 'safetyStop'
    };
    const all = [...results, res];
    if (o.phase === 'safetyStop') {
      // Diğer tarafı test etmeden yönlendir
      const filled = (['R', 'L'] as Side[]).map(
        (s) => all.find((x) => x.side === s) ?? { side: s, vertigo: false, latencySec: null, durationSec: null, safetyStopped: false }
      );
      decide(filled, null);
      return;
    }
    if (all.length < order.length) setStage({ k: 'sideRest', order, results: all });
    else decide(all, null);
  };

  const logManeuver = (o: RunnerOutcome, side: Side) => {
    if (mode === 'practice') return;
    const id = ensureEpisode();
    const log: ManeuverLog = {
      id: uid(),
      at: Date.now(),
      protocolId: maneuverId,
      side,
      completed: o.phase === 'done',
      stopReason: o.state.stopReason,
      records: o.state.records,
      manual: o.manual
    };
    updateEpisode(id, (e) => ({ ...e, side, maneuvers: [...e.maneuvers, log] }));
  };

  const onManeuverExit = (o: RunnerOutcome, side: Side) => {
    logManeuver(o, side);
    if (o.phase === 'done') {
      setStage({ k: 'after', side });
    } else if (o.phase === 'safetyStop') {
      const ep = activeEpisode(store.get());
      if (ep && mode !== 'practice') updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: 'VERTIGO_TOO_LONG' }));
      setStage({ k: 'end', tone: 'warn', title: 'Manevra durduruldu', text: REFER_TEXT.ATYPICAL_LONG, testid: 'end-safety' });
    } else if (o.state.stopReason === 'USER_FEELS_UNWELL') {
      setStage({
        k: 'end',
        tone: 'warn',
        title: 'Dinlenin',
        text: 'Manevrayı durdurdunuz. Yavaşça oturun, dinlenin ve su için. Kendinizi iyi hissetmiyorsanız ya da yeni bir belirti varsa hekiminize başvurun; acil belirtilerde 112\'yi arayın.',
        testid: 'end-unwell'
      });
    } else {
      setStage({ k: 'end', tone: 'info', title: 'Manevra yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz.', testid: 'end-aborted' });
    }
  };

  const onRetestExit = (o: RunnerOutcome, side: Side) => {
    if (o.phase === 'aborted') {
      setStage({ k: 'end', tone: 'info', title: 'Test yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden deneyin.', testid: 'end-aborted' });
      return;
    }
    const ep = activeEpisode(store.get());
    const rec = o.state.records.find((r) => r.stepId === 'dh-lie');
    const v = rec ? vertigoSummary(rec) : null;
    const na = ep ? nextAction(ep, Date.now()) : null;
    const kind = na?.kind === 'morning-retest' ? 'morning' : na?.kind === 'early-retest' ? 'early' : 'other';
    if (ep) {
      updateEpisode(ep.id, (e) => ({
        ...e,
        retests: [...e.retests, { at: Date.now(), kind, side, vertigo: !!v || o.phase === 'safetyStop', latencySec: v?.latencySec ?? null, durationSec: v?.durationSec ?? null }]
      }));
    }
    if (o.phase === 'safetyStop' || (v && (v.durationSec === null || v.durationSec >= 60))) {
      if (ep) updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: 'ATYPICAL_LONG' }));
      setStage({ k: 'end', tone: 'warn', title: 'Hekiminize başvurun', text: REFER_TEXT.ATYPICAL_LONG, testid: 'end-refer' });
      return;
    }
    if (!v) {
      setStage(
        kind === 'morning'
          ? {
              k: 'end',
              tone: 'ok',
              title: 'Düzelmiş görünüyor',
              text: 'Sabah testi de baş dönmesini tetiklemedi. Ana ekrandan atağı kapatabilirsiniz. Baş dönmesi yeniden başlarsa uygulamayı tekrar kullanabilirsiniz.',
              testid: 'end-resolved'
            }
          : {
              k: 'end',
              tone: 'ok',
              title: 'Test baş dönmesini tetiklemedi',
              text: 'Manevra işe yaramış görünüyor. Kristallerin yerinde kaldığını görmek için yarın sabah bir kez daha test edelim.',
              testid: 'end-retest-negative'
            }
      );
      return;
    }
    setStage({
      k: 'end',
      tone: 'warn',
      title: 'Baş dönmesi hâlâ tetikleniyor',
      text: 'Manevrayı yeniden yapabilirsiniz. Sınırlar: günde en fazla 3 manevra.',
      testid: 'end-retest-positive',
      extra: 'treat'
    });
  };

  // ---- Görünüm ------------------------------------------------------------------------------------
  switch (stage.k) {
    case 'redflags': {
      const q = RED_FLAGS[stage.i]!;
      const answer = (v: YesNo) => {
        const answers = { ...stage.answers, [q.id]: v };
        if (v === q.stopsOn || stage.i === RED_FLAGS.length - 1) onRedFlagsDone(answers);
        else setStage({ k: 'redflags', i: stage.i + 1, answers });
      };
      return (
        <Screen
          title="Güvenlik soruları"
          onBack={() => (stage.i === 0 ? nav('/hasta') : setStage({ k: 'redflags', i: stage.i - 1, answers: stage.answers }))}
        >
          <StepDots total={RED_FLAGS.length} index={stage.i} />
          <p className="small muted">
            Soru {stage.i + 1} / {RED_FLAGS.length}
          </p>
          <h1 data-testid="redflag-question" data-qid={q.id}>
            {q.text}
          </h1>
          <div className="spacer" />
          <YesNoButtons onAnswer={answer} value={stage.answers[q.id]} />
        </Screen>
      );
    }

    case 'stop':
      return (
        <Screen title={stage.action === 'emergency' ? 'Acil değerlendirme gerekli' : 'Hekiminize başvurun'} back="/hasta">
          <div className={`card ${stage.action === 'emergency' ? 'tint-danger' : 'tint-warn'} stack`} data-testid={`stop-${stage.action}`}>
            <div className="card-title">
              <Icon name="alert" />
              <h2>{stage.action === 'emergency' ? 'Manevra yapmayın, hemen yardım isteyin' : 'Manevra yapmayın'}</h2>
            </div>
            {stage.triggered.map((q) => (
              <p key={q.id}>{q.why}</p>
            ))}
          </div>
          {stage.action === 'emergency' ? (
            <a className="btn danger block xl" href="tel:112">
              <Icon name="phone" /> 112'yi ara
            </a>
          ) : (
            <div className="card soft small">
              <p>Hekiminize ya da odyologunuza başvurun. Aşağıdaki rapor, verdiğiniz yanıtları içerir.</p>
            </div>
          )}
          {episodeId && (
            <button className="btn secondary block" onClick={() => nav(`/hasta/rapor/${episodeId}`)}>
              <Icon name="print" /> Raporu göster
            </button>
          )}
          <button className="btn ghost" onClick={() => nav('/hasta', { replace: true })}>
            Ana ekran
          </button>
        </Screen>
      );

    case 'calibrate':
      return (
        <Screen title="Telefonu tanıtma" back="/hasta">
          <Calibrate audience="patient" onDone={afterCalibration} onCancel={() => nav('/hasta')} />
        </Screen>
      );

    case 'sideConfirm':
      return (
        <Screen title="Hangi taraf?" back="/hasta">
          <h1>Baş dönmesi yine {sideName(stage.known)} tarafa yattığınızda ya da {sideName(stage.known)} tarafa döndüğünüzde mi başlıyor?</h1>
          <Choice
            name="Taraf onayı"
            value={null}
            onChange={(v: 'yes' | 'unsure' | 'no') => {
              if (v === 'yes') {
                const id = ensureEpisode();
                updateEpisode(id, (e) => ({ ...e, side: stage.known }));
                if (!checkDose()) return;
                setStage({ k: 'maneuver', side: stage.known });
              } else setStage({ k: 'sideQ' });
            }}
            options={[
              { value: 'yes', label: `Evet, ${sideName(stage.known)} taraf` },
              { value: 'unsure', label: 'Emin değilim', sub: 'Kısa bir testle bakalım.' },
              { value: 'no', label: 'Hayır, bu kez farklı', sub: 'Kısa bir testle bakalım.' }
            ]}
          />
        </Screen>
      );

    case 'sideQ':
      return (
        <Screen title="Taraf testi" back="/hasta">
          <h1>Yatakta hangi tarafa döndüğünüzde baş dönmesi daha çok oluyor?</h1>
          <p className="lead">Ardından her iki tarafı kısa bir testle deneyeceğiz. Test baş dönmesini tetikleyebilir; bu beklenen bir durumdur.</p>
          <Choice
            name="Şüpheli taraf"
            value={null}
            onChange={(v: 'R' | 'L' | 'both') => {
              // Önce şüpheli olmayan taraf test edilir.
              const order: Side[] = v === 'R' ? ['L', 'R'] : v === 'L' ? ['R', 'L'] : ['R', 'L'];
              setStage({ k: 'sideRun', order, results: [] });
            }}
            options={[
              { value: 'R', label: 'Sağa dönünce' },
              { value: 'L', label: 'Sola dönünce' },
              { value: 'both', label: 'İki tarafta da / bilmiyorum' }
            ]}
          />
        </Screen>
      );

    case 'sideRun': {
      const side = stage.order[stage.results.length]!;
      return (
        <RunnerView
          key={`side-${side}`}
          protocolId="dix-hallpike"
          side={side}
          mode="patient"
          calibration={cal}
          onExit={(o) => onSideRunExit(o, stage.order, stage.results)}
          intro={
            <div className="notice info">
              <Icon name="info" />
              <span>
                Test {stage.results.length + 1} / 2: <strong>{sideName(side)}</strong> taraf. Baş dönmesi başlarsa ekrana dokunun, geçince yeniden dokunun.
              </span>
            </div>
          }
        />
      );
    }

    case 'sideRest':
      return <RestBetween onContinue={() => setStage({ k: 'sideRun', order: stage.order, results: stage.results })} next={stage.order[stage.results.length]!} />;

    case 'stronger':
      return (
        <Screen title="İki tarafta da baş dönmesi" back="/hasta">
          <h1>Hangisinde baş dönmesi daha şiddetliydi?</h1>
          <Choice
            name="Şiddetli taraf"
            value={null}
            onChange={(v: 'R' | 'L' | 'equal') => decide(stage.results, v)}
            options={[
              { value: 'R', label: 'Sağ tarafa yatınca' },
              { value: 'L', label: 'Sol tarafa yatınca' },
              { value: 'equal', label: 'Aşağı yukarı aynı' }
            ]}
          />
        </Screen>
      );

    case 'practiceSide':
      return (
        <Screen title="Deneme manevrası" back="/hasta">
          <h1>Hangi taraf için denemek istersiniz?</h1>
          <Choice
            name="Deneme tarafı"
            value={null}
            onChange={(v: Side) => setStage({ k: 'maneuver', side: v })}
            options={[
              { value: 'R', label: 'Sağ' },
              { value: 'L', label: 'Sol' }
            ]}
          />
        </Screen>
      );

    case 'maneuver':
      return (
        <RunnerView
          key={`man-${stage.side}`}
          protocolId={maneuverId}
          side={stage.side}
          mode="patient"
          calibration={cal}
          onExit={(o) => onManeuverExit(o, stage.side)}
          intro={
            mode === 'practice' ? (
              <div className="notice info">
                <Icon name="info" />
                <span>Deneme manevrası: kayıt tutulmaz, sayılmaz.</span>
              </div>
            ) : undefined
          }
        />
      );

    case 'after':
      return <AfterManeuver practice={mode === 'practice'} onDone={(sev) => {
        if (mode !== 'practice') {
          const ep = activeEpisode(store.get());
          if (ep) {
            updateEpisode(ep.id, (e) => {
              const ms = e.maneuvers.slice();
              const last = ms[ms.length - 1];
              if (last) ms[ms.length - 1] = { ...last, afterSymptoms: sev };
              return { ...e, maneuvers: ms };
            });
          }
        }
        if (sev === 'severe') {
          setStage({
            k: 'end',
            tone: 'warn',
            title: 'Hekiminize danışın',
            text: 'Şiddetli bulantı, kusma ya da yeni bir belirti varsa manevrayı tekrarlamayın ve hekiminize danışın. Acil belirtilerde 112\'yi arayın.',
            testid: 'end-severe'
          });
        } else {
          setStage({
            k: 'end',
            tone: 'ok',
            title: mode === 'practice' ? 'Deneme tamamlandı' : 'Manevra tamamlandı',
            text:
              mode === 'practice'
                ? 'Artık adımları biliyorsunuz. Baş dönmeniz başladığında aynı yönergelerle yapacaksınız.'
                : `10 dakika oturarak dinlenin; ani baş hareketlerinden kaçının. ${formatTime(Date.now() + EARLY_RETEST_MS)} civarında ana ekrandan tekrar testini yapın.`,
            testid: 'end-maneuver-done'
          });
        }
      }} />;

    case 'retestRun':
      return (
        <RunnerView
          key="retest"
          protocolId="dix-hallpike"
          side={stage.side}
          mode="patient"
          calibration={cal}
          onExit={(o) => onRetestExit(o, stage.side)}
          intro={
            <div className="notice info">
              <Icon name="info" />
              <span>
                Tekrar testi: tedavi edilen <strong>{sideName(stage.side)}</strong> taraf. Baş dönmesi başlarsa ekrana dokunun.
              </span>
            </div>
          }
        />
      );

    case 'end': {
      const canTreat = stage.extra === 'treat' && (() => {
        const ep = activeEpisode(d);
        return ep ? episodeDose(ep, profile, Date.now()).allowed : false;
      })();
      const ep = activeEpisode(d);
      const side = ep ? episodeSide(ep, profile) : null;
      return (
        <Screen title="DengeYol" back="/hasta">
          <div className={`card tint-${stage.tone === 'info' ? 'accent' : stage.tone === 'danger' ? 'danger' : stage.tone} stack`} data-testid={stage.testid}>
            <h1>{stage.title}</h1>
            <p className="lead">{stage.text}</p>
          </div>
          {canTreat && side && (
            <button className="btn primary block xl" onClick={() => setStage({ k: 'maneuver', side })} data-testid="treat-now">
              Manevrayı şimdi tekrarla
            </button>
          )}
          {stage.extra === 'treat' && !canTreat && ep && (
            <div className="notice danger">
              <Icon name="alert" />
              <span>{(() => { const ds = episodeDose(ep, profile, Date.now()); return ds.allowed ? '' : DOSE_TEXT[ds.reason]; })()}</span>
            </div>
          )}
          <button className="btn secondary block" onClick={() => nav('/hasta', { replace: true })} data-testid="go-home">
            Ana ekran
          </button>
          {episodeId && mode !== 'practice' && (
            <button className="btn ghost" onClick={() => nav(`/hasta/rapor/${episodeId}`)}>
              <Icon name="print" /> Rapor
            </button>
          )}
        </Screen>
      );
    }
  }
}

function RestBetween({ onContinue, next }: { onContinue: () => void; next: Side }) {
  const [left, setLeft] = useState(30);
  const sim = store.get().settings;
  const step = sim.simulation ? sim.timeScale : 1;
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - step)), 1000);
    return () => clearInterval(id);
  }, [step]);
  return (
    <Screen title="Kısa ara">
      <div className="card stack center">
        <h1>Oturun ve dinlenin</h1>
        <p className="lead">Baş dönmesi tamamen geçene kadar oturun. Ardından {sideName(next)} tarafı test edeceğiz.</p>
        <div style={{ fontSize: '3rem', fontWeight: 800 }} aria-live="polite">
          {left > 0 ? left : '✓'}
        </div>
      </div>
      <button className="btn primary block xl" disabled={left > 0} onClick={onContinue} data-testid="rest-continue">
        {sideName(next).charAt(0).toLocaleUpperCase('tr-TR') + sideName(next).slice(1)} tarafı test et
      </button>
    </Screen>
  );
}

function AfterManeuver({ onDone, practice }: { onDone: (sev: 'none' | 'mild' | 'severe') => void; practice: boolean }) {
  return (
    <Screen title={practice ? 'Deneme bitti' : 'Manevra bitti'}>
      <h1>Şu an nasılsınız?</h1>
      <Choice
        name="Manevra sonrası"
        value={null}
        onChange={onDone}
        options={[
          { value: 'none', label: 'İyiyim' },
          { value: 'mild', label: 'Hafif baş dönmesi ya da bulantı var', sub: 'Manevradan sonra birkaç dakika sürebilir.' },
          { value: 'severe', label: 'Şiddetli bulantı, kusma ya da yeni bir belirti var' }
        ]}
      />
    </Screen>
  );
}
