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
