import { ReportQr } from './ReportQr';
import { Fragment, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sideName } from '../../../core/protocols';
import { formatDateTime, formatDateTimeYear } from '../../../state/episodes';
import { store, useData } from '../../../state/store';
import type { Episode, EpisodeStatus } from '../../../state/types';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { consentLine } from './consent';
import {
  assistFallbackText,
  doseSummaryText,
  episodeEndNoteText,
  maneuverHeadText,
  maneuverStatusText,
  maneuverTags,
  neuroAlertText,
  PERIOD_REPORT_PATH,
  periodDoseText,
  periodCountsLine,
  periodEpisodes,
  periodLastOutcomeText,
  periodReportPlainText,
  priorDiagnosisText,
  profileRxCode,
  protocolReportName,
  recordSourceText,
  redFlagLineText,
  RESEARCH_GROUP_TITLE,
  researchEntries,
  researchLineText,
  reportOriginText,
  reportPeriod,
  reportPlainText,
  retestText,
  rxHeaderLine,
  rxShortcutText,
  rxShortcutUsed,
  vasReportText,
  rxValidityText,
  sideCellLabel,
  sideCellText,
  sideTestDecisionText,
  sideTestName,
  STATUS_LABEL,
  stepDefFor,
  stepSummary,
  stopWhereText,
  studyIdLine,
  testStopText
} from './reportText';

const STATUS: Record<EpisodeStatus, { label: string; cls: string }> = {
  active: { label: 'Şu anki atak', cls: 'primary' },
  resolved: { label: STATUS_LABEL.resolved, cls: 'ok' },
  referred: { label: STATUS_LABEL.referred, cls: 'warn' },
  emergency: { label: STATUS_LABEL.emergency, cls: 'danger' },
  closed: { label: STATUS_LABEL.closed, cls: '' }
};

export function History() {
  const d = useData();
  const nav = useNavigate();
  const eps = [...d.episodes].sort((a, b) => b.startedAt - a.startedAt);
  return (
    <Screen title="Geçmiş ataklar" back="/hasta">
      {eps.length === 0 ? (
        <div className="card soft center">
          <p className="muted">Henüz kayıtlı atak yok. Bir atak başlattığınızda raporu burada görünür.</p>
        </div>
      ) : (
        <>
        <button className="btn secondary block" onClick={() => nav(PERIOD_REPORT_PATH)} data-testid="history-period">
          <Icon name="share" /> Dönem raporu (bütün ataklar tek raporda)
        </button>
        <div className="list">
          {eps.map((e) => (
            <button key={e.id} className="list-item" onClick={() => nav(`/hasta/rapor/${e.id}`)}>
              <div className="grow">
                <div>
                  <strong>{formatDateTime(e.startedAt)}</strong>
                </div>
                <div className="sub">
                  {e.side ? `${sideName(e.side)} taraf · ` : ''}
                  {e.maneuvers.filter((m) => m.completed).length} manevra · {e.retests.length} tekrar testi
                </div>
              </div>
              <span className={`chip ${STATUS[e.status].cls}`}>{STATUS[e.status].label}</span>
              <Icon name="chevron" />
            </button>
          ))}
        </div>
        </>
      )}
    </Screen>
  );
}

export function EpisodeReport() {
  const { id } = useParams();
  const d = useData();
  const e = d.episodes.find((x) => x.id === id);
  if (!e) {
    return (
      <Screen title="Rapor" back="/hasta">
        <p>Kayıt bulunamadı.</p>
      </Screen>
    );
  }
  return (
    <Screen
      title="Atak raporu"
      back={true}
    >
      <ShareReport text={() => reportPlainText(e, store.get())} title="DengeYol atak raporu" />
      {/* Muayenede hekimin telefonuna internetsiz aktarım (QR/bağlantı). */}
      <ReportQr data={d} episodeId={e.id} />
      <ReportBody e={e} />
      <button className="btn secondary block no-print" onClick={() => window.print()}>
        <Icon name="print" /> Yazdır / PDF olarak kaydet
      </button>
    </Screen>
  );
}

/**
 * Reçete dönemindeki (yoksa son 14 gün) bütün ataklar tek raporda (kullanıcı turu 3, k09): başta tek satırlık sonuç
 * (kullanıcı turu 4: önce son atağın sonucu, sonra "2 atak · 4 manevra · son sabah testi negatif"), muayenede hekime
 * gösterilecek QR kartı (dönemin atakları), sonra her atak sırayla. Hekime giden düz metin de aynı sırada.
 */
export function PeriodReport() {
  const d = useData();
  const p = d.patient;
  // Sayfa açıkken sabit: QR kodu her çizimde yeniden üretilmesin (ReportQr `episodes`/`now` değişince yeniden kodlar).
  const [now] = useState(() => Date.now());
  const period = useMemo(() => reportPeriod(d, now), [d, now]);
  const eps = useMemo(() => periodEpisodes(d, now, period), [d, now, period]);
  const lastOutcome = periodLastOutcomeText(eps);
  const head = rxHeaderLine(p?.prescription, profileRxCode(p));
  const validity = p?.prescription ? rxValidityText(p.prescription, now) : null;
  const consent = consentLine(p);
  return (
    <Screen title="Dönem raporu" back={true}>
      <ShareReport text={() => periodReportPlainText(store.get())} title="DengeYol dönem raporu" />
      <div className="stack" data-testid="period-report" style={{ overflowWrap: 'anywhere' }}>
        <div className="card stack">
          <h2>DengeYol — BPPV dönem raporu</h2>
          {head && (
            <p>
              <strong>{head}</strong>
            </p>
          )}
          {studyIdLine(p) && <p data-testid="period-study-id">{studyIdLine(p)}</p>}
          {/* Önce son atağın sonucu (kullanıcı turu 4, k09), sonra sayılar; düz metindeki "Sonuç:" satırıyla aynı sıra. */}
          {lastOutcome && (
            <p className="lead" data-testid="period-last">
              <strong>{lastOutcome}</strong>
            </p>
          )}
          <p className={lastOutcome ? undefined : 'lead'} data-testid="period-summary">
            <strong>{periodCountsLine(eps)}</strong>
          </p>
          <p className="small muted">Tanı belgesi değildir. Oluşturma: {formatDateTimeYear(now)}</p>
          <dl className="kv">
            <dt>Dönem</dt>
            <dd>{period.label}</dd>
            <dt>Önceki tanı</dt>
            <dd>{priorDiagnosisText(p)}</dd>
            <dt>Doz</dt>
            <dd>{periodDoseText(d, now, eps)}</dd>
            {validity && (
              <>
                <dt>Reçete geçerliliği</dt>
                <dd>{validity}</dd>
              </>
            )}
            {consent && (
              <>
                <dt>Onam</dt>
                <dd>{consent}</dd>
              </>
            )}
          </dl>
        </div>
        {/* Muayenede hekimin telefonuna internetsiz aktarım: dönem raporundan gelen hasta da QR'ı burada bulsun (k09). */}
        <ReportQr data={d} episodes={eps} now={now} />
        {eps.length === 0 && (
          <div className="card soft center">
            <p className="muted">Bu dönemde kayıtlı atak yok.</p>
          </div>
        )}
        {eps.map((e, i) => (
          <section key={e.id} className="stack" data-testid="period-episode">
            <h3>
              {i + 1}. atak — {formatDateTimeYear(e.startedAt)}
            </h3>
            <ReportBody e={e} inPeriod />
          </section>
        ))}
      </div>
      <button className="btn secondary block no-print" onClick={() => window.print()}>
        <Icon name="print" /> Yazdır / PDF olarak kaydet
      </button>
    </Screen>
  );
}

/** Atak raporunun gövdesi. Dönem raporunda (`inPeriod`) ortak satırlar (başlık, tanı, doz, onam) bir kez, üstte yazılır. */
function ReportBody({ e, inPeriod = false }: { e: Episode; inPeriod?: boolean }) {
  const d = useData();
  const p = d.patient;
  const now = Date.now();
  const head = rxHeaderLine(p?.prescription, profileRxCode(p));
  const validity = p?.prescription ? rxValidityText(p.prescription, now) : null;
  const note = episodeEndNoteText(e);
  const where = stopWhereText(e);
  const assistFallback = assistFallbackText(e, d.settings);
  const shortcut = rxShortcutUsed(e, p);
  const consent = consentLine(p);
  const studyId = studyIdLine(p);
  const source = recordSourceText(e);
  const neuro = neuroAlertText(e);
  const vas = vasReportText(e);
  const research = researchEntries(e);
  // Büyük yazıda sağdan taşmasın: tablolar yerine satır satır liste (uzun sözcükler de kırılır).
  const wrap = { overflowWrap: 'anywhere' as const };
  return (
    <div className="stack" data-testid={inPeriod ? undefined : 'episode-report'} style={wrap}>
      <div className="card stack">
        {!inPeriod && (
          <>
            <h2>DengeYol — BPPV atak raporu</h2>
            {head && (
              <p data-testid="report-head">
                <strong>{head}</strong>
              </p>
            )}
            {studyId && <p data-testid="report-study-id">{studyId}</p>}
            <p className="small muted" data-testid="report-origin">
              {reportOriginText(e)}; tanı belgesi değildir. Oluşturma: {formatDateTimeYear(now)}
            </p>
          </>
        )}
        <dl className="kv">
          <dt>Atak başlangıcı</dt>
          <dd>{formatDateTimeYear(e.startedAt)}</dd>
          <dt>Durum</dt>
          <dd>
            {STATUS_LABEL[e.status]}
            {note ? ` — ${note}` : ''}
          </dd>
          {where && (
            <>
              <dt>Durulan yer</dt>
              <dd data-testid="report-stop-where">{where}</dd>
            </>
          )}
          <dt>Tedavi edilen taraf</dt>
          <dd>{e.side ? sideName(e.side) : '—'}</dd>
          <dt>Manevra</dt>
          <dd>{maneuverHeadText(e)}</dd>
          {!inPeriod && (
            <>
              <dt>Önceki tanı</dt>
              <dd>{priorDiagnosisText(p)}</dd>
            </>
          )}
          {shortcut !== null && (
            <>
              <dt>Reçeteli kısa yol</dt>
              <dd data-testid="report-shortcut">{rxShortcutText(shortcut)}</dd>
            </>
          )}
          {!inPeriod && (
            <>
              <dt>Doz</dt>
              <dd data-testid="report-dose">{doseSummaryText(e, d, now)}</dd>
            </>
          )}
          {e.sideConflictNote && (
            <>
              <dt>Taraf uyuşmazlığı</dt>
              <dd data-testid="report-side-conflict">{e.sideConflictNote}</dd>
            </>
          )}
          {(e.testStops ?? []).map((t, i) => (
            <Fragment key={`ts${i}`}>
              <dt>Testte durdurma</dt>
              <dd data-testid="report-test-stop">{testStopText(t)}</dd>
            </Fragment>
          ))}
          {validity && !inPeriod && (
            <>
              <dt>Reçete geçerliliği</dt>
              <dd>{validity}</dd>
            </>
          )}
          {assistFallback && (
            <>
              <dt>Manevrayı yaptıran</dt>
              <dd>{assistFallback}</dd>
            </>
          )}
          {consent && !inPeriod && (
            <>
              <dt>Onam</dt>
              <dd data-testid="report-consent">{consent}</dd>
            </>
          )}
          {vas && (
            <>
              <dt>Belirti şiddeti (0–10)</dt>
              <dd data-testid="report-vas">{vas}</dd>
            </>
          )}
          {neuro && (
            <>
              <dt>Yeni belirti</dt>
              <dd data-testid="report-neuro-alert">{neuro}</dd>
            </>
          )}
          {source && (
            <>
              <dt>Kayıt</dt>
              <dd data-testid="report-source">{source}</dd>
            </>
          )}
        </dl>
      </div>

      {e.redFlags.length > 0 && (
        <div className="card stack">
          <h3>Güvenlik soruları</h3>
          {e.redFlags.map((r, i) => (
            <div key={i} className="small" data-testid="report-redflag">
              <strong>{formatDateTimeYear(r.at)}</strong>: {redFlagLineText(e, r)}
            </div>
          ))}
        </div>
      )}

      {e.sideTests.length > 0 && (
        <div className="card stack">
          <h3>Taraf testleri</h3>
          {e.sideTests.map((t, i) => (
            <div key={i} className="small stack" style={{ gap: 2 }} data-testid="report-side-test">
              <strong>
                {formatDateTimeYear(t.at)} — {sideTestName(t.canal)}
              </strong>
              <span>
                {sideCellLabel(t.canal, 'R')}: {sideCellText(t, 'R')}
              </span>
              <span>
                {sideCellLabel(t.canal, 'L')}: {sideCellText(t, 'L')}
              </span>
              <span>Karar: {sideTestDecisionText(e, t)}</span>
            </div>
          ))}
        </div>
      )}

      {e.maneuvers.length > 0 && (
        <div className="card stack">
          <h3>Manevralar</h3>
          {e.maneuvers.map((m) => (
            <div key={m.id} className="stack" style={{ gap: 6 }}>
              <div className="row wrap">
                <strong>{formatDateTimeYear(m.at)}</strong>
                <span className="chip" data-testid="report-maneuver-name">
                  {protocolReportName(m.protocolId)} {m.side ? sideName(m.side) : ''}
                </span>
                <span className={`chip ${m.completed ? 'ok' : 'warn'}`}>{maneuverStatusText(m)}</span>
                {maneuverTags(m).map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
              <ol className="stack small" style={{ margin: 0, paddingLeft: 22, gap: 6 }}>
                {m.records.map((r, i) => (
                  <li key={i}>
                    <strong>{r.title}</strong>: {stepSummary(r, stepDefFor(m.protocolId, m.side, r.stepId))}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="small muted">Gecikme, pozisyona gelişten baş dönmesinin işaretlenmesine kadar geçen süredir; süre, en uzun tek baş dönmesi dalgasıdır.</p>
        </div>
      )}

      {e.retests.length > 0 && (
        <div className="card stack">
          <h3>Tekrar testleri</h3>
          {e.retests.map((r, i) => (
            <div key={i} className="small">
              {retestText(r)}
            </div>
          ))}
        </div>
      )}

      {/* Araştırma kaydı (Episode.overrides): aşılan uyarılar, uygulamanın kararları, seçimler ve bilgi kayıtları ayrı. */}
      {research.length > 0 && (
        <div className="card stack" data-testid="report-overrides">
          <h3>Araştırma kaydı</h3>
          {(['override', 'decision', 'info'] as const).map((g) => {
            const xs = research.filter((x) => x.group === g);
            if (g !== 'override' && xs.length === 0) return null;
            const n = xs.reduce((k, x) => k + x.count, 0);
            return (
              <div key={g} className="stack" style={{ gap: 2 }} data-testid={`report-research-${g}`}>
                <strong className="small">
                  {RESEARCH_GROUP_TITLE[g]}
                  {g === 'override' ? `: ${n || 'yok'}` : ''}
                </strong>
                {xs.map((x, i) => (
                  <div key={i} className="small" data-testid={g === 'override' ? 'report-override' : undefined}>
                    {researchLineText(x)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Raporu düz metin olarak paylaş (WhatsApp, e-posta vb.); paylaşma yoksa panoya kopyalar. */
function ShareReport({ text: makeText, title }: { text: () => string; title: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const share = async () => {
    // Ekrandaki HTML'in innerText'i değil: satır satır okunur, tablo/sekme içermeyen ayrı özet.
    const text = makeText();
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg('Rapor panoya kopyalandı; mesaj ya da e-postaya yapıştırabilirsiniz.');
    } catch {
      /* kullanıcı paylaşmaktan vazgeçti */
    }
  };
  return (
    <div className="stack no-print">
      <button className="btn primary block xl" onClick={() => void share()} data-testid="report-share">
        <Icon name="share" /> Hekime gönder
      </button>
      {msg && <p className="small muted">{msg}</p>}
    </div>
  );
}
