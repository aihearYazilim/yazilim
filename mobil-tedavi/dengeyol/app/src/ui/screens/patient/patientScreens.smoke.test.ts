// @vitest-environment jsdom
/**
 * Kurulum, reçete kartı ve dönem raporunun duman testi (jsdom; kullanıcı turu 4, G2):
 * - kurulumda "yakını olarak kuruyorum" seçilince "başucunda duracağım (ekranı çevir)" da sunulur (k02);
 * - uygunluk adımında işitme notu yakını modunda yardımcıya göre (k02), "Tekrar dinle" bütün maddeleri okur (k01);
 * - "Son 2 hafta içinde" seçilince tarih süre dolmadan da görünür (k03);
 * - reçete kartında ekran da "kristal oynaması (BPPV)" der (k05);
 * - dönem raporu önce son atağın sonucunu yazar ve QR kartını gösterir (k09).
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { encodePrescription } from '../../../core/prescription';
import { store } from '../../../state/store';
import { emptyData, type Episode } from '../../../state/types';
import { PeriodReport } from './History';
import { Onboarding } from './Onboarding';
import { PrescriptionImport } from './PrescriptionImport';

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

function mount(path: string) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      createElement(
        MemoryRouter,
        { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } },
        createElement(
          Routes,
          null,
          createElement(Route, { path: '/hasta/kurulum', element: createElement(Onboarding) }),
          createElement(Route, { path: '/hasta/rapor/donem', element: createElement(PeriodReport) }),
          createElement(Route, { path: '/recete/:token', element: createElement(PrescriptionImport) }),
          createElement(Route, { path: '*', element: null })
        )
      )
    );
  });
}

const byTestId = (id: string) => host!.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const click = (el: HTMLElement | null | undefined) => act(() => el!.click());

describe('kurulum (kullanıcı turu 4)', () => {
  it('yakını seçilince "başucunda duracağım (ekranı çevir)" sunulur; seçim kaldırılınca çevirme de kalkar (k02)', () => {
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: false };
    store.update(() => d);
    mount('/hasta/kurulum');
    expect(byTestId('ob-flip')).toBeNull();
    click(byTestId('ob-helper'));
    expect(store.get().settings.assist).toBe('helper');
    const flip = byTestId('ob-flip')!;
    expect(flip.textContent).toMatch(/Hastanın başucunda duracağım \(ekranı bana göre çevir\)/);
    expect(flip.getAttribute('aria-checked')).toBe('false');
    click(flip);
    expect(store.get().settings.screenFlip).toBe(true);
    expect(byTestId('ob-flip')!.getAttribute('aria-checked')).toBe('true');
    click(byTestId('ob-helper'));
    expect(byTestId('ob-flip')).toBeNull();
    expect(store.get().settings.screenFlip).toBe(false);
    expect(store.get().settings.assist).toBe('self');
  });

  it('uygunluk adımı yakını modunda: işitme notu yardımcıya göre, "Tekrar dinle" bütün maddeler (k01, k02)', () => {
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: true, assist: 'helper' };
    d.patient = { consentAt: '2026-01-01T00:00:00.000Z', consentBy: 'helper', contraindications: [], diagnosedByDoctor: true, canal: 'PC', side: 'R' };
    store.update(() => d);
    mount('/hasta/kurulum?adim=uygunluk');
    expect(host!.querySelector('h1')!.textContent).toBe('Hasta için uygun mu?');
    expect(byTestId('ob-contra-hearing')!.textContent).toMatch(/^Hastanın işitme kaybı varsa/);
    expect(byTestId('ob-contra-hearing')!.textContent).not.toMatch(/yakınınızla/);
    expect(byTestId('ob-not-blocking')!.textContent).toMatch(/Hasta tansiyon ilacı kullanıyorsa/);
  });

  it('"Son 2 hafta içinde" seçilince seçim tarihi süre dolmadan da görünür (k03)', () => {
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: false };
    const at = Date.now() - 3 * 24 * 3600_000;
    d.patient = {
      consentAt: '2026-01-01T00:00:00.000Z',
      contraindications: [],
      diagnosedByDoctor: true,
      canal: 'PC',
      side: 'R',
      dxWhen: 'recent',
      dxWhenAt: at
    };
    store.update(() => d);
    mount('/hasta/kurulum?adim=tani');
    const note = byTestId('ob-dx-recent-at')!;
    expect(note.textContent).toMatch(/tarihinde seçildi; .* tarihine kadar "son 2 hafta" sayılır/);
    // "Daha önce" seçilince tarih kalkar; yeniden "Son 2 hafta içinde" seçilince önceki (süresi dolmamış) tarih geri gelir.
    const radio = (re: RegExp) => [...host!.querySelectorAll<HTMLElement>('[role="radio"]')].find((b) => re.test(b.textContent ?? ''))!;
    click(radio(/^Daha önce/));
    expect(byTestId('ob-dx-recent-at')).toBeNull();
    click(radio(/^Son 2 hafta içinde/));
    expect(byTestId('ob-dx-recent-at')!.textContent).toBe(note.textContent);
  });
});

describe('reçete kartı (kullanıcı turu 4, k05)', () => {
  it('ekranda da "kristal oynaması (BPPV)"; taraf büyük harfle', () => {
    const d = emptyData();
    d.settings = { ...d.settings, speech: false };
    store.update(() => d);
    const token = encodePrescription({ v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', perDay: 3, days: 7 });
    mount(`/recete/${token}`);
    expect(byTestId('rx-dx')!.textContent).toBe('SAĞ kulak — arka kanal kristal oynaması (BPPV)');
  });
});

describe('dönem raporu (kullanıcı turu 4, k09)', () => {
  it('önce son atağın sonucu, sonra sayılar; QR kartı dönemin ataklarıyla', async () => {
    const now = Date.now();
    const day = 24 * 3600_000;
    const ep = (id: string, at: number, o: Partial<Episode> = {}): Episode => ({
      id,
      startedAt: at,
      endedAt: at + 3600_000,
      side: 'R',
      protocolId: 'epley',
      redFlags: [],
      sideTests: [],
      maneuvers: [{ id: 'm' + id, at, protocolId: 'epley', side: 'R', completed: true, stopReason: null, records: [], manual: false }],
      retests: [{ at: at + 20 * 3600_000, kind: 'morning', side: 'R', vertigo: false, latencySec: null, durationSec: null }],
      status: 'resolved',
      ...o
    });
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: false };
    d.patient = { consentAt: '2026-01-01T00:00:00.000Z', contraindications: [], diagnosedByDoctor: true, canal: 'PC', side: 'R' };
    d.episodes = [ep('a', now - 6 * day), ep('b', now - 2 * day, { status: 'referred', endNote: 'ATYPICAL_LONG', maneuvers: [], retests: [] })];
    store.update(() => d);
    mount('/hasta/rapor/donem');
    // QR çizimi (qrcode) eşzamansız: bitmesi beklenir.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(byTestId('report-qr-code')).not.toBeNull();
    expect(byTestId('period-last')!.textContent).toMatch(/^Son atak \(.+\): hekime yönlendirildi — baş dönmesi bir dakikadan uzun sürdü/);
    // e2e (run-e2e.mjs) özet satırının sayılarla başladığına bakar.
    expect(byTestId('period-summary')!.textContent).toMatch(/^2 atak · 1 manevra · son sabah testi negatif · 1 hekime yönlendirme$/);
    const qr = byTestId('report-qr')!;
    expect(qr).not.toBeNull();
    expect(byTestId('report-qr-summary')!.textContent).toMatch(/2 atak, 1 manevra/);
    // Kart, sonuç satırlarından sonra ve ataklardan önce.
    const order = [...host!.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid'));
    expect(order.indexOf('period-summary')).toBeLessThan(order.indexOf('report-qr'));
    expect(order.indexOf('report-qr')).toBeLessThan(order.indexOf('period-episode'));
  });
});
