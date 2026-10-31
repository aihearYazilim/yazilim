import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PROTOCOLS, sideName } from '../../../core/protocols';
import { RED_FLAGS } from '../../../core/safety';
import { formatDateTime, formatDateTimeYear } from '../../../state/episodes';
import { store, useData } from '../../../state/store';
import type { Episode, EpisodeStatus } from '../../../state/types';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import {
  assistFallbackText,
  decisionText,
  endNoteText,
  maneuverTags,
  priorDiagnosisText,
  reportPlainText,
  retestText,
  rxHeaderLine,
  rxValidityText,
  sideCellText,
  STATUS_LABEL,
  stepSummary,
  stopReasonText
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
      <ShareReport e={e} />
      <ReportBody e={e} />
      <button className="btn secondary block no-print" onClick={() => window.print()}>
        <Icon name="print" /> Yazdır / PDF olarak kaydet
      </button>
    </Screen>
  );
}

function ReportBody({ e }: { e: Episode }) {
  const d = useData();
  const p = d.patient;
  const now = Date.now();
  const head = rxHeaderLine(p?.prescription);
  const validity = p?.prescription ? rxValidityText(p.prescription, now) : null;
  const note = e.endNote ? endNoteText(e.endNote) : '';
  const assistFallback = assistFallbackText(e, d.settings);
  // Büyük yazıda sağdan taşmasın: tablolar yerine satır satır liste (uzun sözcükler de kırılır).
  const wrap = { overflowWrap: 'anywhere' as const };
  return (
    <div className="stack" data-testid="episode-report" style={wrap}>
      <div className="card stack">
        <h2>DengeYol — BPPV atak raporu</h2>
        {head && (
          <p data-testid="report-head">
            <strong>{head}</strong>
          </p>
        )}
        <p className="small muted">Bu rapor hastanın kendi kullanımıyla oluşturulmuştur; tanı belgesi değildir. Oluşturma: {formatDateTimeYear(now)}</p>
        <dl className="kv">
          <dt>Atak başlangıcı</dt>
          <dd>{formatDateTimeYear(e.startedAt)}</dd>
          <dt>Durum</dt>
          <dd>
            {STATUS_LABEL[e.status]}
            {note ? ` — ${note}` : ''}
          </dd>
          <dt>Tedavi edilen taraf</dt>
          <dd>{e.side ? sideName(e.side) : '—'}</dd>
          <dt>Manevra</dt>
          <dd>{PROTOCOLS[e.protocolId].shortName}</dd>
          <dt>Önceki tanı</dt>
          <dd>{priorDiagnosisText(p)}</dd>
          {validity && (
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
                    <strong>{r.title}</strong>: {stepSummary(r)}
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
function ShareReport({ e }: { e: Episode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const share = async () => {
    // Ekrandaki HTML'in innerText'i değil: satır satır okunur, tablo/sekme içermeyen ayrı özet.
    const text = reportPlainText(e, store.get());
    try {
      if (navigator.share) {
        await navigator.share({ title: 'DengeYol atak raporu', text });
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
