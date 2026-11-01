import { describe, expect, it } from 'vitest';
import { encodeHomeReport, type HomeReport } from '../../../core/reportShare';
import type { ClinicExam, ClinicPatient } from '../../../state/types';
import { csvField, csvTime, STUDY_CSV_COLUMNS, studyCsv, studyRows } from './studyCsv';

const MIN = 60_000;
const S = new Date(2026, 9, 31, 9, 0).getTime();

const report: HomeReport = {
  v: 3,
  generatedAt: S + 120 * MIN,
  period: { from: S, to: S + 120 * MIN },
  studyId: 'DY-014',
  appVersion: '0.1.0',
  rulesVersion: 'k1',
  stepsDropped: false,
  episodesOmitted: 0,
  maneuversOmitted: 0,
  episodes: [
    {
      startedAt: S,
      status: 'active',
      side: 'R',
      simulation: true,
      vas: { before: 7, after: 3 },
      redFlags: [{ at: S + MIN, ids: ['neuro'], continued: true }],
      sideTests: [
        {
          at: S + 5 * MIN,
          R: { vertigo: true, latencySec: 2, durationSec: 30, safetyStopped: false },
          L: { vertigo: false, latencySec: null, durationSec: null, safetyStopped: false },
          decision: { kind: 'TREAT', side: 'R', note: null },
          canal: 'HC'
        }
      ],
      maneuvers: [
        { at: S + 15 * MIN, protocolId: 'bbq-roll', side: 'R', completed: true, stopReason: null, pauses: 0, manual: false, stepCount: 7, steps: [] },
        {
          at: S + 40 * MIN,
          protocolId: 'epley',
          side: 'R',
          completed: false,
          stopReason: 'VERTIGO_TOO_LONG',
          pauses: 0,
          manual: false,
          afterSymptoms: 'mild',
          stepCount: 2,
          steps: [
            { index: 0, title: 'a', holdSec: 20, flags: [], transitionSec: null, vertigo: null },
            { index: 1, title: 'b', holdSec: 160, flags: [], transitionSec: null, vertigo: { latencySec: 4, durationSec: 153, marks: 1 } }
          ]
        }
      ],
      retests: [{ at: S + 80 * MIN, kind: 'early', side: 'R', vertigo: false, latencySec: null, durationSec: null }],
      overrides: [
        { at: S + 2 * MIN, kind: 'RED_FLAG', detail: 'neuro' },
        {
          at: S + 6 * MIN,
          kind: 'APP_DECISION',
          detail:
            'sağ taraf, BBQ roll; "geotropik" varsayım. Sağ tarafta baş dönmesi daha uzun sürdü. Yatay kanalda daha şiddetli taraf etkilenen taraf kabul edilir (en sık biçim).'
        },
        { at: S + 7 * MIN, kind: 'NO_DIAGNOSIS' }
      ]
    }
  ]
};

describe('çalışma verisi CSV (yeni kullanıcı turu 1, y04 #8)', () => {
  const token = encodeHomeReport(report).token;
  const patients: ClinicPatient[] = [{ id: 'p1', code: 'DY-014', sex: '-', createdAt: S }];
  const exams: ClinicExam[] = [
    { id: 'x1', patientId: 'p1', at: S + 3 * 24 * 60 * MIN, findings: {}, maneuvers: [], retestFindings: {}, homeReports: [{ id: 'abcd1234', token, importedAt: S }] },
    // Bozuk rapor atlanır.
    { id: 'x2', patientId: 'p1', at: S + 4 * 24 * 60 * MIN, findings: {}, maneuvers: [], retestFindings: {}, homeReports: [{ id: 'bad', token: 'x.00000000', importedAt: S }] }
  ];

  it('katılımcı başına satır satır: atak, güvenlik sorusu, test, manevra, tekrar testi, aşma, karar, bilgi', () => {
    const rows = studyRows({ clinicExams: exams, clinicPatients: patients });
    expect(rows.map((r) => r.olay)).toEqual(['atak', 'guvenlik_sorusu', 'asma', 'test', 'test', 'uygulama_karari', 'bilgi', 'manevra', 'manevra', 'tekrar_testi']);
    for (const r of rows) {
      expect(r.katilimci_no).toBe('DY-014');
      expect(r.demo).toBe('evet');
      expect(r.surum).toBe('0.1.0/k1');
      expect(r.rapor).toBe('abcd1234');
    }
    expect(rows.find((r) => r.olay === 'test')!.kod).toBe('supine-roll');
    expect(rows.find((r) => r.olay === 'manevra')!.kod).toBe('bbq-roll');
    expect(rows.find((r) => r.olay === 'asma')!.kod).toBe('RED_FLAG');
    expect(rows.find((r) => r.olay === 'guvenlik_sorusu')!.kod).toBe('isaretlendi_devam');
    expect(rows[0]!.zaman).toBe(csvTime(S));
  });

  it('metin: BOM, ";" ayırıcı, başlık; tırnak ve ayırıcı içeren alan tırnaklanır, formül sanılacak başlangıç kaçırılır', () => {
    const csv = studyCsv({ clinicExams: exams, clinicPatients: patients });
    expect(csv.startsWith('﻿' + STUDY_CSV_COLUMNS.join(';') + '\r\n')).toBe(true);
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(11);
    // Karar gerekçesi kısaltılmadan (yeni kullanıcı turu 2, y04 #4).
    expect(csv).toContain(
      '"Uygulamanın kararı: sağ taraf, BBQ roll; ""geotropik"" varsayım. Sağ tarafta baş dönmesi daha uzun sürdü. Yatay kanalda daha şiddetli taraf etkilenen taraf kabul edilir (en sık biçim)."'
    );
    expect(csvField('=1+1')).toBe("'=1+1");
    expect(csvField('a;b')).toBe('"a;b"');
    expect(studyCsv({ clinicExams: [], clinicPatients: [] })).toBe('﻿' + STUDY_CSV_COLUMNS.join(';') + '\r\n');
  });

  it('analize hazır sütunlar (yeni kullanıcı turu 2, y04 #1): taraf başına test satırı, adım/tamamlanma/durma/en uzun baş dönmesi, VAS, ISO zaman', () => {
    const rows = studyRows({ clinicExams: exams, clinicPatients: patients });
    const atak = rows.find((r) => r.olay === 'atak')!;
    expect([atak.vas_once, atak.vas_sonra]).toEqual(['7', '3']);
    const [tr, tl] = rows.filter((r) => r.olay === 'test');
    expect([tr!.taraf, tr!.bas_donmesi, tr!.gecikme_s, tr!.sure_s, tr!.karar]).toEqual(['sağ', 'evet', '2', '30', 'TREAT_R']);
    expect([tl!.taraf, tl!.bas_donmesi, tl!.gecikme_s, tl!.sure_s, tl!.karar]).toEqual(['sol', 'hayır', '', '', 'TREAT_R']);
    const [bbq, ep] = rows.filter((r) => r.olay === 'manevra');
    expect([bbq!.adim, bbq!.adim_toplam, bbq!.tamamlandi, bbq!.durma_nedeni, bbq!.en_uzun_bas_donmesi_s]).toEqual(['7', '7', 'evet', '', '']);
    expect([ep!.adim, ep!.tamamlandi, ep!.durma_nedeni, ep!.sonrasi, ep!.en_uzun_bas_donmesi_s]).toEqual(['2', 'hayır', 'VERTIGO_TOO_LONG', 'mild', '153']);
    const rt = rows.find((r) => r.olay === 'tekrar_testi')!;
    expect([rt.bas_donmesi, rt.gecikme_s]).toEqual(['hayır', '']);
    for (const r of rows) {
      expect(r.zaman).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
      expect(r.atak_baslangic).toBe(csvTime(S));
      expect(r.muayene).toMatch(/T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    }
    // ISO zaman aynı anı gösterir (saat dilimi farkıyla).
    expect(new Date(csvTime(S)).getTime()).toBe(S);
  });
});
