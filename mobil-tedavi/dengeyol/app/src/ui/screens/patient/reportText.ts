/**
 * Hasta atak raporunun metinleri (ekran raporu ve hekime gönderilen düz metin aynı kaynaktan).
 * İç kodlar (endNote, StopReason, kırmızı bayrak kimliği) burada Türkçe cümleye çevrilir; ham kod rapora yazılmaz.
 */
import { type Prescription, rxValidUntil } from '../../../core/prescription';
import { PROTOCOLS, sideName } from '../../../core/protocols';
import { recordStats, type StepRecord, vertigoSummary } from '../../../core/runner';
import { RED_FLAGS, type SideDecision } from '../../../core/safety';
import { formatDate, formatDateTimeYear, RX_VALID_DAYS } from '../../../state/episodes';
import type { AppData, Episode, EpisodeStatus, ManeuverLog, PatientProfile, Settings } from '../../../state/types';

export const STATUS_LABEL: Record<EpisodeStatus, string> = {
  active: 'Şu anki atak (sürüyor)',
  resolved: 'Düzeldi',
  referred: 'Hekime yönlendirildi',
  emergency: 'Acil yönlendirme',
  closed: 'Kapatıldı'
};

/** Yönlendirme/kapanış kodlarının rapordaki kısa karşılığı. */
const CODE_TEXT: Record<string, string> = {
  ATYPICAL_LONG: 'baş dönmesi bir dakikadan uzun sürdü ya da bitişi işaretlenmedi (tipik arka kanal BPPV\'ye uymuyor)',
  BOTH_SIDES: 'iki tarafa yatınca da baş dönmesi oldu (yatay kanal ya da iki taraflı BPPV olabilir)',
  SIDE_CONFLICT: 'baş dönmesi hekimin belirlediği taraftan farklı tarafta tetiklendi',
  INCOMPLETE: 'taraf testi tamamlanmadı',
  VERTIGO_TOO_LONG: 'manevrada baş dönmesi 2 dakikadan uzun sürdü ya da bitişi işaretlenmedi; güvenlik nedeniyle durduruldu',
  USER_FEELS_UNWELL: 'hasta kendini iyi hissetmedi',
  USER_ABORT: 'hasta manevrayı yarıda bıraktı',
  INTERRUPTED: 'uygulamadan çıkıldı'
};

/** Atağın kapanış notunu (endNote) Türkçe cümleye çevirir. */
export function endNoteText(note: string): string {
  const n = note.trim();
  if (!n) return '';
  if (n in CODE_TEXT) return CODE_TEXT[n]!;
  // Kırmızı bayrak kimlikleri virgülle birleştirilmiş olarak saklanır ("ear" ya da "ear, fever").
  const parts = n.split(/\s*,\s*/);
  if (parts.every((x) => /^[a-z][a-zA-Z0-9_]*$/.test(x))) {
    const texts = parts.map((id) => RED_FLAGS.find((q) => q.id === id)?.text);
    const known = texts.filter((t): t is string => !!t);
    if (known.length === 0) return 'güvenlik sorularından birine verilen yanıt';
    return `güvenlik sorusu yanıtı: ${known.map((t) => `"${t}"`).join(' · ')}`;
  }
  // Bilinmeyen büyük harfli iç kod: ham kod yazılmaz.
  if (/^[A-Z][A-Z0-9_]+$/.test(n)) return 'uygulamanın güvenlik kuralı gereği';
  return n;
}

export function stopReasonText(r: string | null): string {
  if (r === 'VERTIGO_TOO_LONG') return 'durduruldu: baş dönmesi 2 dakikadan uzun';
  if (r === 'USER_FEELS_UNWELL') return 'durduruldu: kendini iyi hissetmedi';
  if (r === 'INTERRUPTED') return 'kesildi: uygulamadan çıkıldı';
  return 'yarıda bırakıldı';
}

/** Adımdaki baş dönmesi: pozisyona gelişe göre gecikme ve süre (vertigoSummary). Yoksa null. */
export function symptomText(r: StepRecord): string | null {
  const vs = vertigoSummary(r);
  if (!vs) return null;
  const n = r.vertigoMarks.length;
  const dur = vs.durationSec === null ? 'bitişi işaretlenmedi' : `süre ${vs.durationSec} s`;
  return `baş dönmesi: gecikme ${vs.latencySec} s (pozisyona gelişten), ${dur}${n > 1 ? ` · ${n} kez işaretlendi, en uzunu` : ''}`;
}

/** Adımın tek satırlık özeti (başlık hariç). */
export function stepSummary(r: StepRecord): string {
  const st = recordStats(r);
  const parts = [`${Math.round(r.holdSec)} s`];
  if (st.inRangePct !== null) parts.push(`hedefte %${st.inRangePct}`);
  if (st.meanAbsThetaErr !== null) parts.push(`sapma ort. ${st.meanAbsThetaErr}° / en çok ${st.maxAbsThetaErr}°`);
  if (r.manual) parts.push('elle onaylandı');
  parts.push(symptomText(r) ?? 'baş dönmesi işaretlenmedi');
  return parts.join(' · ');
}

/** Rapor başı: "Hasta kodu X · reçete 30 Ekim 2026 · Dr. Y, Kurum". Reçete yoksa null. */
export function rxHeaderLine(rx: Prescription | undefined): string | null {
  if (!rx) return null;
  const parts: string[] = [];
  if (rx.pid) parts.push(`Hasta kodu ${rx.pid}`);
  parts.push(`reçete ${formatDate(new Date(`${rx.date}T00:00:00`).getTime())}`);
  const who = [rx.by, rx.clinic].filter(Boolean).join(', ');
  if (who) parts.push(who);
  return parts.join(' · ');
}

export function rxValidityText(rx: Prescription, now: number): string | null {
  const until = rxValidUntil(rx, RX_VALID_DAYS);
  if (until === null) return null;
  return `${formatDate(until)} tarihine kadar geçerli${now > until ? ' (süresi doldu)' : ''}`;
}

export function priorDiagnosisText(p: PatientProfile | undefined): string {
  if (p?.prescription) {
    const rx = p.prescription;
    return `Reçete: ${sideName(rx.side)} arka kanal, ${PROTOCOLS[rx.maneuver].shortName}, günde en çok ${rx.perDay}, ${rx.days} gün`;
  }
  if (p?.diagnosedByDoctor) {
    const canal = p.canal === 'PC' ? 'arka kanal' : p.canal === 'HC' ? 'yatay kanal' : 'kanal bilinmiyor';
    const side = p.side === 'R' ? 'sağ' : p.side === 'L' ? 'sol' : 'taraf bilinmiyor';
    return `Hekim tanısı (hastanın beyanı: ${canal}, ${side})${p.dxDate ? ', ' + p.dxDate : ''}`;
  }
  return '—';
}

export function decisionText(d: SideDecision): string {
  switch (d.kind) {
    case 'TREAT':
      return `${sideName(d.side)} tarafa manevra`;
    case 'NOT_TRIGGERED':
      return 'baş dönmesi gelmedi';
    case 'ASK_STRONGER':
      return 'hangi tarafın daha şiddetli olduğu soruldu';
    case 'REFER':
      return `hekime yönlendirildi: ${endNoteText(d.reason)}`;
  }
}

/** Manevra rozetleri (yardımcı, duraklatma, sonrası). */
export function maneuverTags(m: ManeuverLog): string[] {
  const tags: string[] = [];
  if (m.assisted === true) tags.push('yakını yaptırdı');
  else if (m.assisted === false) tags.push('kendi başına');
  if (m.manual) tags.push('sensörsüz');
  if (m.pauses && m.pauses > 0) tags.push(`${m.pauses} kez duraklatıldı`);
  if (m.afterSymptoms) {
    tags.push(
      m.afterSymptoms === 'none'
        ? 'sonrası: iyi'
        : m.afterSymptoms === 'mild'
          ? 'sonrası: hafif belirti'
          : m.afterSymptoms === 'neuro'
            ? 'sonrası: yeni nörolojik belirti'
            : 'sonrası: şiddetli belirti'
    );
  }
  return tags;
}

/**
 * Manevra kayıtlarında yardım bilgisi yoksa (eski kayıt) şu anki ayar, açıkça "şu anki ayar" diye etiketlenerek gösterilir.
 * Kayıtta bilgi varsa ya da kişi kendi başına kullanıyorsa null.
 */
export function assistFallbackText(e: Episode, s: Settings): string | null {
  if (e.maneuvers.length === 0 || e.maneuvers.some((m) => m.assisted !== undefined)) return null;
  return s.assist === 'helper' ? 'yakını yaptırıyor (uygulamanın şu anki ayarı; manevra anındaki kayıt yok)' : null;
}

export function retestText(r: Episode['retests'][number]): string {
  const kind = r.kind === 'early' ? 'erken (1. saat)' : r.kind === 'morning' ? 'sabah' : 'diğer';
  const res = r.vertigo ? `baş dönmesi var (gecikme ${r.latencySec ?? '?'} s, süre ${r.durationSec ?? '?'} s)` : 'baş dönmesi gelmedi';
  return `${formatDateTimeYear(r.at)} — ${kind}, ${sideName(r.side)}: ${res}`;
}

export function sideCellText(t: Episode['sideTests'][number], s: 'R' | 'L'): string {
  const r = t.results.find((x) => x.side === s);
  if (!r) return 'yapılmadı';
  if (r.safetyStopped) return 'durduruldu (baş dönmesi 2 dakikadan uzun)';
  return r.vertigo ? `baş dönmesi, gecikme ${r.latencySec ?? '?'} s, süre ${r.durationSec ?? '?'} s` : 'baş dönmesi yok';
}

/** Hekime gönderilen düz metin rapor (WhatsApp/e-posta: sekme ve tablo yok, satır satır okunur). */
export function reportPlainText(e: Episode, d: AppData, now: number = Date.now()): string {
  const p = d.patient;
  const L: string[] = [];
  L.push('DengeYol — BPPV atak raporu');
  const head = rxHeaderLine(p?.prescription);
  if (head) L.push(head);
  if (p?.prescription) {
    const v = rxValidityText(p.prescription, now);
    if (v) L.push(`Reçete geçerliliği: ${v}`);
  }
  L.push(`(Hastanın kendi kullanımıyla oluşturuldu; tanı belgesi değildir. Oluşturma: ${formatDateTimeYear(now)})`);
  L.push('');
  L.push(`Atak başlangıcı: ${formatDateTimeYear(e.startedAt)}`);
  const note = e.endNote ? endNoteText(e.endNote) : '';
  L.push(`Durum: ${STATUS_LABEL[e.status]}${note ? ` — ${note}` : ''}`);
  L.push(`Tedavi edilen taraf: ${e.side ? sideName(e.side) : '—'}`);
  L.push(`Manevra: ${PROTOCOLS[e.protocolId].shortName}`);
  L.push(`Önceki tanı: ${priorDiagnosisText(p)}`);
  const af = assistFallbackText(e, d.settings);
  if (af) L.push(`Manevrayı yaptıran: ${af}`);

  if (e.redFlags.length > 0) {
    L.push('', 'GÜVENLİK SORULARI');
    for (const r of e.redFlags) {
      const pos = RED_FLAGS.filter((q) => r.answers[q.id] === q.stopsOn);
      L.push(`- ${formatDateTimeYear(r.at)}: ${pos.length === 0 ? 'tümü güvenli yanıtlandı' : 'DURDURULDU — ' + pos.map((q) => q.text).join(' | ')}`);
    }
  }
  if (e.sideTests.length > 0) {
    L.push('', 'TARAF TESTLERİ (belirtiyle Dix-Hallpike)');
    for (const t of e.sideTests) {
      L.push(`- ${formatDateTimeYear(t.at)}: Sağ: ${sideCellText(t, 'R')}; Sol: ${sideCellText(t, 'L')}. Karar: ${decisionText(t.decision)}`);
    }
  }
  if (e.maneuvers.length > 0) {
    L.push('', 'MANEVRALAR');
    e.maneuvers.forEach((m, i) => {
      const status = m.completed ? 'tamamlandı' : stopReasonText(m.stopReason);
      const tags = maneuverTags(m);
      L.push(
        `${i + 1}) ${formatDateTimeYear(m.at)} — ${PROTOCOLS[m.protocolId].shortName}${m.side ? ' ' + sideName(m.side) : ''} — ${status}${tags.length ? ' · ' + tags.join(' · ') : ''}`
      );
      for (const r of m.records) L.push(`   • ${r.title}: ${stepSummary(r)}`);
    });
  }
  if (e.retests.length > 0) {
    L.push('', 'TEKRAR TESTLERİ');
    for (const r of e.retests) L.push(`- ${retestText(r)}`);
  }
  return L.join('\n');
}
