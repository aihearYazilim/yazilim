/**
 * Çalışma verisinin dışa aktarımı (CSV; yeni kullanıcı turu 1, y04 #8): muayenelere eklenmiş ev raporlarından katılımcı
 * başına satır satır olaylar (atak, güvenlik sorusu, test, manevra, tekrar testi, testte durdurma, aşma, uygulama kararı,
 * bilgi kaydı). Ayırıcı ";" (Türkçe Excel), başta UTF-8 BOM. Saf işlev; arayüz ClinicianHome'da.
 */
import { PROTOCOLS, sideName } from '../../../core/protocols';
import { decodeHomeReport, type HomeEpisode, type HomeReport } from '../../../core/reportShare';
import { RED_FLAGS } from '../../../core/safety';
import type { AppData } from '../../../state/types';
import { researchEntries } from '../patient/reportText';
import { homeManeuverText, homeRetestText, homeSideTestText, homeTestStopText } from './examReport';

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
  'ayrinti',
  'demo',
  'surum'
] as const;

type Row = Record<(typeof STUDY_CSV_COLUMNS)[number], string>;

/** Yerel saatle "2026-10-31 14:05". */
export function csvTime(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
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

function episodeRows(base: Omit<Row, 'atak_baslangic' | 'zaman' | 'olay' | 'kod' | 'taraf' | 'ayrinti' | 'demo'>, r: HomeReport, e: HomeEpisode): Row[] {
  const rows: Row[] = [];
  const start = csvTime(e.startedAt);
  const demo = e.simulation ? 'evet' : r.appVersion || r.v >= 3 ? 'hayır' : '';
  const ver = [e.appVersion ?? r.appVersion, e.rulesVersion ?? r.rulesVersion].filter(Boolean).join('/');
  const add = (at: number, olay: string, kod: string, taraf: string, ayrinti: string) =>
    rows.push({ ...base, atak_baslangic: start, zaman: csvTime(at), olay, kod, taraf, ayrinti, demo, surum: ver });
  add(e.startedAt, 'atak', STATUS_CODE[e.status], e.side ? sideName(e.side) : '', e.endNote ?? '');
  for (const f of e.redFlags ?? []) {
    add(f.at, 'guvenlik_sorusu', f.continued ? 'isaretlendi_devam' : 'isaretlendi_durdu', '', f.ids.map((id) => RED_FLAGS.find((q) => q.id === id)?.label ?? id).join(', '));
  }
  for (const t of e.sideTests) add(t.at, 'test', t.canal === 'HC' ? 'supine-roll' : 'dix-hallpike', t.decision.kind === 'TREAT' ? sideName(t.decision.side) : '', homeSideTestText(t));
  for (const m of e.maneuvers) {
    add(m.at, 'manevra', PROTOCOLS[m.protocolId] ? m.protocolId : 'bilinmiyor', m.side ? sideName(m.side) : '', homeManeuverText(m));
  }
  for (const x of e.retests) add(x.at, 'tekrar_testi', x.kind, sideName(x.side), homeRetestText(x));
  for (const x of e.testStops ?? []) add(x.at, 'testte_durdurma', x.reason, sideName(x.side), homeTestStopText(x));
  for (const x of researchEntries(e)) {
    const olay = x.group === 'override' ? 'asma' : x.group === 'decision' ? 'uygulama_karari' : 'bilgi';
    for (let i = 0; i < x.count; i++) add(x.at, olay, x.kind, '', x.text);
  }
  return rows.sort((a, b) => (a.zaman < b.zaman ? -1 : a.zaman > b.zaman ? 1 : 0));
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
      const base = {
        katilimci_no: r.studyId ?? r.pid ?? patient?.code ?? '',
        hasta_kodu: patient?.code ?? '',
        muayene: csvTime(ex.at),
        rapor: h.id,
        surum: ''
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
