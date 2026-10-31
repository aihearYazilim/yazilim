import { ReportQr } from './ReportQr';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PROTOCOLS, sideName } from '../../../core/protocols';
import { RED_FLAGS } from '../../../core/safety';
import { formatDateTime, formatDateTimeYear } from '../../../state/episodes';
import { store, useData } from '../../../state/store';
import type { Episode, EpisodeStatus } from '../../../state/types';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { consentLine } from './consent';
import {
  assistFallbackText,
  decisionText,
  doseSummaryText,
  episodeEndNoteText,
  maneuverHeadText,
  maneuverTags,
  PERIOD_REPORT_PATH,
  periodDoseText,
  periodEpisodes,
  periodReportPlainText,
  periodSummaryLine,
  priorDiagnosisText,
  profileRxCode,
  reportOriginText,
  reportPeriod,
  reportPlainText,
  retestText,
  rxHeaderLine,
  rxShortcutText,
  rxShortcutUsed,
  rxValidityText,
  sideCellText,
  STATUS_LABEL,
  stepDefFor,
  stepSummary,
  stopReasonText,
  stopWhereText
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
 * ("2 atak · 4 manevra · son sabah testi negatif"), sonra her atak sırayla. Hekime giden düz metin de aynı sırada.
 */
export function PeriodReport() {
  const d = useData();
  const p = d.patient;
  const now = Date.now();
  const period = reportPeriod(d, now);
  const eps = periodEpisodes(d, now, period);
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
          <p className="lead" data-testid="period-summary">
            <strong>{periodSummaryLine(eps)}</strong>
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
        </dl>
      </div>

      {e.redFlags.length > 0 && (
        <div className="card stack">
          <h3>Güvenlik soruları</h3>
          {e.redFlags.map((r, i) => {
            const pos = RED_FLAGS.filter((q) => r.answers[q.id] === q.stopsOn);
            return (
              <div key={i} className="small">
                <strong>{formatDateTimeYear(r.at)}</strong>: {pos.length === 0 ? 'tümü güvenli yanıtlandı' : 'DURDURULDU — ' + pos.map((q) => q.text).join(' | ')}
              </div>
            );
          })}
        </div>
      )}

      {e.sideTests.length > 0 && (
        <div className="card stack">
          <h3>Taraf testleri (belirtiyle Dix-Hallpike)</h3>
          {e.sideTests.map((t, i) => (
            <div key={i} className="small stack" style={{ gap: 2 }}>
              <strong>{formatDateTimeYear(t.at)}</strong>
              <span>Sağ: {sideCellText(t, 'R')}</span>
              <span>Sol: {sideCellText(t, 'L')}</span>
              <span>Karar: {decisionText(t.decision)}</span>
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
                <span className="chip">
                  {PROTOCOLS[m.protocolId].shortName} {m.side ? sideName(m.side) : ''}
                </span>
                <span className={`chip ${m.completed ? 'ok' : 'warn'}`}>{m.completed ? 'tamamlandı' : stopReasonText(m.stopReason)}</span>
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
