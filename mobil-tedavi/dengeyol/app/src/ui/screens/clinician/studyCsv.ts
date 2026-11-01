/**
 * Çalışma verisinin dışa aktarımı (CSV; yeni kullanıcı turu 1, y04 #8): muayenelere eklenmiş ev raporlarından katılımcı
 * başına satır satır olaylar (atak, güvenlik sorusu, test, manevra, tekrar testi, testte durdurma, aşma, uygulama kararı,
 * bilgi kaydı). Ayırıcı ";" (Türkçe Excel), başta UTF-8 BOM. Saf işlev; arayüz ClinicianHome'da.
 *
 * Analize hazır (yeni kullanıcı turu 2, y04 #1): sayısal ve kodlu alanlar ayrı sütunlarda (gecikme, süre, adım, tamamlanma,
 * durma nedeni, sonrası, en uzun baş dönmesi, VAS önce/sonra, test kararı); taraf testi her taraf için ayrı satırdır (taraf =
 * test edilen taraf). Zamanlar ISO 8601, yerel saat ve saat dilimi farkıyla ("2026-10-31T14:05:00+03:00"). `ayrinti` okunur
 * metindir; araştırma kaydı açıklaması kısaltılmadan yazılır (bağlantıda kısaltıldıysa o kadarı).
 */
import { PROTOCOLS, sideName, type Side } from '../../../core/protocols';
import { decodeHomeReport, type HomeEpisode, type HomeReport, type HomeSideTest } from '../../../core/reportShare';
import { RED_FLAGS, type SideDecision } from '../../../core/safety';
import type { AppData } from '../../../state/types';
import { researchEntries } from '../patient/reportText';
import { homeManeuverText, homeNeuroAckText, homeRetestText, homeSideTestText, homeTestStopText } from './examReport';

export const STUDY_CSV_COLUMNS = [
  'katilimci_no',
  'hasta_kodu',
  'muayene',
  'rapor',
  'atak_baslangic',
  'zaman',
  'olay',
  'kod',
  'taraf',
  'bas_donmesi',
  'gecikme_s',
  'sure_s',
  'adim',
  'adim_toplam',
  'tamamlandi',
  'durma_nedeni',
  'sonrasi',
  'en_uzun_bas_donmesi_s',
  'vas_once',
  'vas_sonra',
  'karar',
  'ayrinti',
  'demo',
  'surum'
] as const;

type Column = (typeof STUDY_CSV_COLUMNS)[number];
type Row = Record<Column, string>;

/** ISO 8601, yerel saat + saat dilimi farkı: "2026-10-31T14:05:00+03:00". */
export function csvTime(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${p(Math.floor(a / 60))}:${p(a % 60)}`;
}

/** CSV alanı: ayırıcı, tırnak ya da satır sonu varsa tırnak içinde; formül sanılmasın diye =,+,-,@ ile başlayan metne ' eklenir. */
export function csvField(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const STATUS_CODE: Record<HomeEpisode['status'], string> = {
  active: 'acik',
  resolved: 'duzeldi',
  referred: 'hekime_yonlendirildi',
  emergency: 'acile_yonlendirildi',
  closed: 'kapatildi'
};

/** Taraf testi kararının kodu: TREAT_R, NOT_TRIGGERED, ASK_STRONGER, REFER_<neden>. */
export function decisionCode(d: SideDecision): string {
  switch (d.kind) {
    case 'TREAT':
      return `TREAT_${d.side}`;
    case 'REFER':
      return `REFER_${d.reason}`;
    default:
      return d.kind;
  }
}

const num = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? String(n) : '');
const yesNo = (b: boolean) => (b ? 'evet' : 'hayır');

/** Manevra adımlarındaki en uzun (bitişi işaretlenmiş) baş dönmesi (s); adım ayrıntısı yoksa ya da işaret yoksa null. */
export function longestVertigoSec(steps: { vertigo: { durationSec: number | null } | null }[] | null): number | null {
  const ds = (steps ?? []).map((s) => s.vertigo?.durationSec).filter((x): x is number => typeof x === 'number');
  return ds.length ? Math.max(...ds) : null;
}

type Base = Pick<Row, 'katilimci_no' | 'hasta_kodu' | 'muayene' | 'rapor'>;

function episodeRows(base: Base, r: HomeReport, e: HomeEpisode): Row[] {
  const rows: { at: number; seq: number; row: Row }[] = [];
  const start = csvTime(e.startedAt);
  const demo = e.simulation ? 'evet' : r.appVersion || r.v >= 3 ? 'hayır' : '';
  const ver = [e.appVersion ?? r.appVersion, e.rulesVersion ?? r.rulesVersion].filter(Boolean).join('/');
  const add = (at: number, olay: string, kod: string, taraf: string, ayrinti: string, extra: Partial<Row> = {}) => {
    const row = Object.fromEntries(STUDY_CSV_COLUMNS.map((c) => [c, ''])) as Row;
    Object.assign(row, base, { atak_baslangic: start, zaman: csvTime(at), olay, kod, taraf, ayrinti, demo, surum: ver }, extra);
    rows.push({ at, seq: rows.length, row });
  };
  add(e.startedAt, 'atak', STATUS_CODE[e.status], e.side ? sideName(e.side) : '', e.endNote ?? '', {
    vas_once: num(e.vas?.before),
    vas_sonra: num(e.vas?.after)
  });
  for (const f of e.redFlags ?? []) {
    add(f.at, 'guvenlik_sorusu', f.continued ? 'isaretlendi_devam' : 'isaretlendi_durdu', '', f.ids.map((id) => RED_FLAGS.find((q) => q.id === id)?.label ?? id).join(', '));
  }
  for (const t of e.sideTests) {
    const kod = t.canal === 'HC' ? 'supine-roll' : 'dix-hallpike';
    const text = homeSideTestText(t);
    const karar = decisionCode(t.decision);
    const cells = (['R', 'L'] as Side[]).filter((s) => t[s]);
    if (!cells.length) add(t.at, 'test', kod, '', text, { karar });
    for (const s of cells) {
      const c = t[s] as NonNullable<HomeSideTest['R']>;
      add(t.at, 'test', kod, sideName(s), text, {
        bas_donmesi: c.safetyStopped ? 'durduruldu' : yesNo(c.vertigo),
        gecikme_s: c.vertigo || c.safetyStopped ? num(c.latencySec) : '',
        sure_s: c.vertigo || c.safetyStopped ? num(c.durationSec) : '',
        karar
      });
    }
  }
  for (const m of e.maneuvers) {
    const def = PROTOCOLS[m.protocolId];
    add(m.at, 'manevra', def ? m.protocolId : 'bilinmiyor', m.side ? sideName(m.side) : '', homeManeuverText(m), {
      adim: String(m.stepCount),
      adim_toplam: def ? String(def.steps.length) : '',
      tamamlandi: yesNo(m.completed),
      durma_nedeni: m.stopReason ?? '',
      sonrasi: m.afterSymptoms ?? '',
      en_uzun_bas_donmesi_s: num(longestVertigoSec(m.steps))
    });
  }
  for (const x of e.retests) {
    add(x.at, 'tekrar_testi', x.kind, sideName(x.side), homeRetestText(x), {
      bas_donmesi: yesNo(x.vertigo),
      gecikme_s: x.vertigo ? num(x.latencySec) : '',
      sure_s: x.vertigo ? num(x.durationSec) : ''
    });
  }
  if (e.neuroAck) add(e.neuroAck.at, 'yeni_belirti_yaniti', e.neuroAck.by, '', homeNeuroAckText(e) ?? '');
  for (const x of e.testStops ?? []) add(x.at, 'testte_durdurma', x.test === 'side' ? 'taraf_testi' : 'tekrar_testi', sideName(x.side), homeTestStopText(x), { durma_nedeni: x.reason });
  for (const x of researchEntries(e)) {
    const olay = x.group === 'override' ? 'asma' : x.group === 'decision' ? 'uygulama_karari' : 'bilgi';
    for (let i = 0; i < x.count; i++) add(x.at, olay, x.kind, '', x.text);
  }
  return rows.sort((a, b) => a.at - b.at || a.seq - b.seq).map((x) => x.row);
}

/** Bütün muayenelerdeki ev raporlarından CSV satırları (başlık dahil değil). Çözülemeyen rapor atlanır. */
export function studyRows(d: Pick<AppData, 'clinicExams' | 'clinicPatients'>): Row[] {
  const rows: Row[] = [];
  const exams = [...d.clinicExams].sort((a, b) => a.at - b.at);
  for (const ex of exams) {
    const patient = d.clinicPatients.find((p) => p.id === ex.patientId);
    for (const h of ex.homeReports ?? []) {
      const dec = decodeHomeReport(h.token);
      if (!dec.ok) continue;
      const r = dec.value;
      const base: Base = {
        katilimci_no: r.studyId ?? r.pid ?? patient?.code ?? '',
        hasta_kodu: patient?.code ?? '',
        muayene: csvTime(ex.at),
        rapor: h.id
      };
      for (const e of r.episodes) rows.push(...episodeRows(base, r, e));
    }
  }
  return rows;
}

/** Dışa aktarılacak CSV metni (BOM + başlık + satırlar). */
export function studyCsv(d: Pick<AppData, 'clinicExams' | 'clinicPatients'>): string {
  const lines = [STUDY_CSV_COLUMNS.join(';'), ...studyRows(d).map((r) => STUDY_CSV_COLUMNS.map((c) => csvField(r[c])).join(';'))];
  return `﻿${lines.join('\r\n')}\r\n`;
}
