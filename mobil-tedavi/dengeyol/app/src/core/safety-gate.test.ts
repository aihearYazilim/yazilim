import { describe, expect, it } from 'vitest';
import {
  CONTRA_GENERAL_QUESTIONS,
  CONTRA_NOT_BLOCKING_TEXT,
  CONTRAINDICATIONS,
  contraDoctorQuestions,
  contraindicationsFor,
  diagnosisGate,
  GATE_TEXT
} from './safety';

describe('kontrendikasyon kapısı metinleri', () => {
  it('her maddenin kimliği tekil; kısa adı ve hekime sorusu var', () => {
    const ids = CONTRAINDICATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CONTRAINDICATIONS) {
      expect(c.label.length).toBeGreaterThan(3);
      expect(c.ask.endsWith('?')).toBe(true);
    }
  });
  it('işaretlenen maddeler adıyla bulunur (liste sırası; bilinmeyen kimlik atlanır)', () => {
    expect(contraindicationsFor(['spine', 'yok', 'neck']).map((c) => c.id)).toEqual(['neck', 'spine']);
  });
  it('hekime 2–3 soru: önce maddeye özgü, sonra genel', () => {
    const one = contraDoctorQuestions(['neck']);
    expect(one).toHaveLength(3);
    expect(one[0]).toMatch(/Boynumla/);
    expect(one.slice(1)).toEqual(CONTRA_GENERAL_QUESTIONS);
    const many = contraDoctorQuestions(['neck', 'spine', 'eye']);
    expect(many).toHaveLength(3);
    expect(many[2]).toBe(CONTRA_GENERAL_QUESTIONS[0]);
    expect(contraDoctorQuestions([])).toHaveLength(2);
  });
  it('kontrendikasyon uyarıdır (reçeteyle de): hekime danışma önerisi ve dikkat cümlesi; kilit yok', () => {
    expect(GATE_TEXT.CONTRAINDICATION).toMatch(/hekiminize danışmanız önerilir/);
    expect(GATE_TEXT.CONTRAINDICATION).toMatch(/Yine de devam ederseniz/);
    const g = diagnosisGate({ diagnosedByDoctor: true, canal: 'PC', side: 'R', hasPrescription: true, contraindications: ['neck'] });
    expect(g).toEqual({ ok: true, requireSideTest: false, warnings: ['CONTRAINDICATION'] });
  });
  it('kan sulandırıcı, tansiyon ilacı ve protez notu', () => {
    expect(CONTRA_NOT_BLOCKING_TEXT).toMatch(/Kan sulandırıcı/);
    expect(CONTRA_NOT_BLOCKING_TEXT).toMatch(/tansiyon/);
    expect(CONTRA_NOT_BLOCKING_TEXT).toMatch(/protez/);
  });
});
