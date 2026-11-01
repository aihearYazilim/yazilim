// @vitest-environment jsdom
/**
 * Ev dönemi raporu içe aktarma ekranının duman testi (jsdom; kullanıcı turu 6, k09/k02/k10):
 * - biçim v2 bağlantısında "yüzüstünden gelme reddedildi" adım işareti ve testte durdurma satırı görünür;
 * - eski (v1) bağlantı okunmaya devam eder;
 * - bu sürümün tanımadığı (daha yeni) sürüm "uygulamayı güncelleyin" der.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fnv1a } from '../../../core/prescription';
import { REPORT_DECODE_ERROR_TEXT, REPORT_SHARE_VERSION } from '../../../core/reportShare';
import { store } from '../../../state/store';
import { emptyData } from '../../../state/types';
import { ReportImport } from './ReportImport';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeAll(() => {
  window.scrollTo = () => {};
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
});

const b64u = (json: string) => {
  let bin = '';
  for (const b of new TextEncoder().encode(json)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
/** Elle rapor bağlantısı (sağlama toplamı "E" önekli). */
const tokenOf = (obj: unknown) => {
  const body = b64u(JSON.stringify(obj));
  return `${body}.${fnv1a(`E${body}`)}`;
};

function mount(token: string) {
  store.update(() => ({ ...emptyData(), settings: { ...emptyData().settings, role: 'clinician' } }));
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      createElement(
        MemoryRouter,
        { initialEntries: [`/odyolog/ev-raporu/${token}`], future: { v7_startTransition: true, v7_relativeSplatPath: true } },
        createElement(Routes, null, createElement(Route, { path: '/odyolog/ev-raporu/:token', element: createElement(ReportImport) }))
      )
    );
  });
}

const byTestId = (id: string) => host!.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const m = Math.floor(new Date(2026, 9, 31, 9, 0).getTime() / 60000);
/** Açık atak: sağ taraf testi kötü hissedince durduruldu; Epley 4. adımda yüzüstünden gelindi, kabul edilmedi. */
const episode = { s: m, u: 'a', d: 'R', m: [[10, 'e', 'R', 'P', 0, 4, [[5, 0], [30, 0], [30, 0], [0, 16 | 256]]]], y: [[3, 's', 'R', 'U']] };

describe('ev raporu içe aktarma: biçim v2 (kullanıcı turu 6)', () => {
  it('v2: yüzüstünden gelme ve testte durdurma ekranda', () => {
    mount(tokenOf({ v: 2, g: m + 60, p: 'NO-2611', a: m, b: m + 60, e: [episode] }));
    const text = byTestId('hr-report')!.textContent!;
    expect(text).toContain('yüzüstünden gelme reddedildi');
    expect(text).not.toContain('önce yanlış taraf');
    const stop = byTestId('hr-report-test-stop')!.textContent!;
    expect(stop).toMatch(/^Testte durdurma .*: sağ taraf testi durduruldu — hasta kendini iyi hissetmedi$/);
  });

  it('v1 bağlantısı okunmaya devam eder (yanlış taraf işareti, durdurma satırı yok)', () => {
    const v1 = { ...episode, m: [[10, 'e', 'R', 'P', 0, 4, [[5, 0], [30, 0], [30, 0], [0, 16]]]] };
    delete (v1 as { y?: unknown }).y;
    mount(tokenOf({ v: 1, g: m + 60, a: m, b: m + 60, e: [v1] }));
    expect(byTestId('hr-report')!.textContent).toContain('önce yanlış taraf');
    expect(byTestId('hr-report-test-stop')).toBeNull();
    expect(byTestId('hr-error')).toBeNull();
  });

  it('daha yeni sürüm: "uygulamayı güncelleyin"', () => {
    mount(tokenOf({ v: REPORT_SHARE_VERSION + 1, g: m, a: m, b: m, e: [] }));
    expect(byTestId('hr-error')!.textContent).toBe(REPORT_DECODE_ERROR_TEXT.VERSION);
    expect(byTestId('hr-error')!.textContent).toMatch(/Uygulamayı güncelleyin/);
  });
});

describe('ev raporu içe aktarma: biçim v3 araştırma kaydı (yeni kullanıcı turu 1)', () => {
  /** P4: kırmızı bayrak işaretlenip devam edildi, sırtüstü baş çevirme testi, BBQ roll; demo; katılımcı no; kontrendikasyon. */
  const p4 = {
    s: m,
    u: 'a',
    d: 'R',
    S: 1,
    t: [[5, [1, 2, 30], [1, 2, 10], 'TR', 'H']],
    m: [[15, 'bbq-roll', 'R', 'co', 0, 7]],
    f: [[1, 'neuro', 1]],
    o: [[2, 'R', 'neuro'], [3, 'T', 'Yatakta dönünce başlıyor'], [6, 'D', 'sağ taraf, BBQ roll (yatay kanal, geotropik varsayım).'], [7, 'N']]
  };

  it('araştırma bölümü, test türü, katılımcı no, tek cümle öneri; varsayılan yeni kontrol muayenesi', () => {
    const token = tokenOf({ v: 3, g: m + 60, a: m, b: m + 60, i: 'DY-014', k: 'neck', w: ['0.1.0', 'k1'], e: [p4] });
    mount(token);
    expect(byTestId('hr-error')).toBeNull();
    const text = byTestId('hr-report')!.textContent!;
    expect(text).toContain('Sırtüstü baş çevirme testi (supine roll) — Başı sağa çevirince');
    expect(text).toContain('BBQ roll (yatakta dönme manevrası) sağ: tamamlandı');
    expect(text).not.toContain('Dix-Hallpike');
    expect(byTestId('hr-report-study-id')!.textContent).toBe('DY-014');
    expect(byTestId('hr-report-advice')!.textContent).toMatch(/^Öneri: Bu rapor demo modunda/);
    expect(byTestId('hr-report-version')!.textContent).toBe('Kayıt: DengeYol 0.1.0 · karar kuralları k1');
    expect(byTestId('hr-report-demo')!.textContent).toMatch(/DEMO MODU/);
    expect(byTestId('hr-report-redflag')!.textContent).toMatch(/uyarı gösterildi, devam edildi$/);
    expect(byTestId('hr-report-override-count')!.textContent).toBe('Uyarıya rağmen devam (kullanıcının aştığı uyarılar): 1');
    expect(byTestId('hr-report-research-decision')!.textContent).toMatch(/Uygulamanın kararı: sağ taraf, BBQ roll/);
    expect(byTestId('hr-report-research-info')!.textContent).toMatch(/hekim tanısı girilmeden kullanıldı/);
    expect(byTestId('hr-report-research')!.textContent).not.toMatch(/RED_FLAG|APP_DECISION|NO_DIAGNOSIS|\bneuro\b/);
    // Katılımcı no yeni hasta kodu olarak önerilir; muayene seçimi yok (yeni hasta → yeni kontrol muayenesi).
    expect((byTestId('hr-code') as HTMLInputElement).value).toBe('DY-014');
  });

  it('eski (sürümsüz) rapor: araştırma kaydının bilinmediği yazılır', () => {
    mount(tokenOf({ v: 1, g: m + 60, a: m, b: m + 60, e: [{ s: m, u: 'a' }] }));
    expect(byTestId('hr-report-research-none')!.textContent).toMatch(/eski bir uygulama sürümüyle/);
  });

  it('kayıtlı hastanın eski muayenesi varken varsayılan "Yeni kontrol muayenesi aç" (y08 #3)', () => {
    const token = tokenOf({ v: 3, g: m + 60, a: m, b: m + 60, i: 'DY-014', w: ['0.1.0', 'k1'], e: [p4] });
    store.update(() => ({
      ...emptyData(),
      settings: { ...emptyData().settings, role: 'clinician' },
      clinicPatients: [{ id: 'p1', code: 'DY-014', sex: '-', createdAt: Date.now() - 86400000 }],
      // Bugün yapılmış ama dolu (bulgulu) ilk muayene: varsayılan olmamalı.
      clinicExams: [{ id: 'x1', patientId: 'p1', at: Date.now() - 60000, findings: { dhR: { nystagmus: 'none' } as never }, maneuvers: [], retestFindings: {} }]
    }));
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(
        createElement(
          MemoryRouter,
          { initialEntries: [`/odyolog/ev-raporu/${token}`], future: { v7_startTransition: true, v7_relativeSplatPath: true } },
          createElement(Routes, null, createElement(Route, { path: '/odyolog/ev-raporu/:token', element: createElement(ReportImport) }))
        )
      );
    });
    expect((byTestId('hr-patient') as HTMLSelectElement).value).toBe('p1');
    expect((byTestId('hr-exam') as HTMLSelectElement).value).toBe('new');
  });
});
