import { useNavigate, useParams } from 'react-router-dom';
import { PROTOCOLS, sideName } from '../../../core/protocols';
import { recordStats } from '../../../core/runner';
import { RED_FLAGS, REFER_TEXT } from '../../../core/safety';
import { formatDate, formatDateTime } from '../../../state/episodes';
import { useData } from '../../../state/store';
import type { Episode, EpisodeStatus } from '../../../state/types';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';

const STATUS: Record<EpisodeStatus, { label: string; cls: string }> = {
  active: { label: 'Aktif', cls: 'primary' },
  resolved: { label: 'Düzeldi', cls: 'ok' },
  referred: { label: 'Hekime yönlendirildi', cls: 'warn' },
  emergency: { label: 'Acil yönlendirme', cls: 'danger' },
  closed: { label: 'Kapatıldı', cls: '' }
};

export function History() {
  const d = useData();
  const nav = useNavigate();
  const eps = [...d.episodes].sort((a, b) => b.startedAt - a.startedAt);
  return (
    <Screen title="Geçmiş ataklar" back="/hasta">
      {eps.length === 0 ? (
        <div className="card soft center">
          <p className="muted">Henüz kayıtlı atak yok.</p>
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
      back="/hasta/gecmis"
      right={
        <button className="btn icon" aria-label="Yazdır / PDF" onClick={() => window.print()}>
          <Icon name="print" />
        </button>
      }
    >
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
  return (
    <div className="stack" data-testid="episode-report">
      <div className="card stack">
        <h2>DengeYol — BPPV atak raporu</h2>
        <p className="small muted">Bu rapor hastanın kendi kullanımıyla oluşturulmuştur; tanı belgesi değildir. Oluşturma: {formatDateTime(Date.now())}</p>
        <dl className="kv">
          <dt>Atak başlangıcı</dt>
          <dd>{formatDateTime(e.startedAt)}</dd>
          <dt>Durum</dt>
          <dd>{STATUS[e.status].label}{e.endNote ? ` (${humanNote(e.endNote)})` : ''}</dd>
          <dt>Tedavi edilen taraf</dt>
          <dd>{e.side ? sideName(e.side) : '—'}</dd>
          <dt>Manevra</dt>
          <dd>{PROTOCOLS[e.protocolId].shortName}</dd>
          <dt>Önceki tanı</dt>
          <dd>
            {p?.prescription
              ? `Reçete: ${sideName(p.prescription.side)} arka kanal, ${formatDate(new Date(p.prescription.date).getTime())}${p.prescription.by ? ', ' + p.prescription.by : ''}`
              : p?.diagnosedByDoctor
                ? `Hekim tanısı (${p.canal === 'PC' ? 'arka kanal' : p.canal === 'HC' ? 'yatay kanal' : 'kanal bilinmiyor'}, ${p.side === 'R' ? 'sağ' : p.side === 'L' ? 'sol' : 'taraf bilinmiyor'})${p.dxDate ? ', ' + p.dxDate : ''}`
                : '—'}
          </dd>
        </dl>
      </div>

      {e.redFlags.length > 0 && (
        <div className="card stack">
          <h3>Güvenlik soruları</h3>
          {e.redFlags.map((r, i) => {
            const pos = RED_FLAGS.filter((q) => r.answers[q.id] === q.stopsOn);
            return (
              <div key={i} className="small">
                <strong>{formatDateTime(r.at)}</strong>: {pos.length === 0 ? 'tümü güvenli yanıtlandı' : 'DURDURULDU — ' + pos.map((q) => q.text).join(' | ')}
              </div>
            );
          })}
        </div>
      )}

      {e.sideTests.length > 0 && (
        <div className="card stack">
          <h3>Taraf testleri (semptom Dix-Hallpike)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Sağ</th>
                <th>Sol</th>
                <th>Karar</th>
              </tr>
            </thead>
            <tbody>
              {e.sideTests.map((t, i) => {
                const cell = (s: 'R' | 'L') => {
                  const r = t.results.find((x) => x.side === s);
                  if (!r) return '—';
                  if (r.safetyStopped) return 'durduruldu (>2 dk)';
                  return r.vertigo ? `baş dönmesi: gecikme ${r.latencySec ?? '?'} s, süre ${r.durationSec ?? '?'} s` : 'yok';
                };
                return (
                  <tr key={i}>
                    <td>{formatDateTime(t.at)}</td>
                    <td>{cell('R')}</td>
                    <td>{cell('L')}</td>
                    <td>{decisionText(t.decision)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {e.maneuvers.length > 0 && (
        <div className="card stack">
          <h3>Manevralar</h3>
          {e.maneuvers.map((m) => (
            <div key={m.id} className="stack" style={{ gap: 6 }}>
              <div className="row wrap">
                <strong>{formatDateTime(m.at)}</strong>
                <span className="chip">{PROTOCOLS[m.protocolId].shortName} {m.side ? sideName(m.side) : ''}</span>
                <span className={`chip ${m.completed ? 'ok' : 'warn'}`}>{m.completed ? 'tamamlandı' : stopText(m.stopReason)}</span>
                {m.manual && <span className="chip">sensörsüz</span>}
                {m.afterSymptoms && <span className="chip">{m.afterSymptoms === 'none' ? 'sonrası: iyi' : m.afterSymptoms === 'mild' ? 'sonrası: hafif belirti' : 'sonrası: şiddetli belirti'}</span>}
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Adım</th>
                    <th>Süre</th>
                    <th>Hedefte</th>
                    <th>Ort. |θ| hata</th>
                    <th>Belirti</th>
                  </tr>
                </thead>
                <tbody>
                  {m.records.map((r, i) => {
                    const st = recordStats(r);
                    return (
                      <tr key={i}>
                        <td>{r.title}</td>
                        <td>{Math.round(r.holdSec)} s</td>
                        <td>{st.inRangePct !== null ? `%${st.inRangePct}` : '—'}</td>
                        <td>{st.meanAbsThetaErr !== null ? `${st.meanAbsThetaErr}°` : '—'}</td>
                        <td>{r.vertigoMarks.length ? r.vertigoMarks.map((v) => `${Math.round(v.start)}–${v.end !== null ? Math.round(v.end) : '?'} s`).join(', ') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {e.retests.length > 0 && (
        <div className="card stack">
          <h3>Tekrar testleri</h3>
          {e.retests.map((r, i) => (
            <div key={i} className="small">
              <strong>{formatDateTime(r.at)}</strong> ({r.kind === 'early' ? '30 dk' : r.kind === 'morning' ? 'sabah' : 'diğer'}, {sideName(r.side)}):{' '}
              {r.vertigo ? `baş dönmesi var (gecikme ${r.latencySec ?? '?'} s, süre ${r.durationSec ?? '?'} s)` : 'tetiklenmedi'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function decisionText(d: Episode['sideTests'][number]['decision']): string {
  switch (d.kind) {
    case 'TREAT':
      return `${sideName(d.side)} tarafa manevra`;
    case 'NOT_TRIGGERED':
      return 'tetiklenmedi';
    case 'ASK_STRONGER':
      return 'şiddet sorusu';
    case 'REFER':
      return 'hekime yönlendirildi';
  }
}

function stopText(r: string | null): string {
  if (r === 'VERTIGO_TOO_LONG') return 'durduruldu: uzun baş dönmesi';
  if (r === 'USER_FEELS_UNWELL') return 'durduruldu: kendini iyi hissetmedi';
  return 'yarıda bırakıldı';
}

function humanNote(n: string): string {
  if (n in REFER_TEXT) return REFER_TEXT[n as keyof typeof REFER_TEXT];
  return n;
}
