// @vitest-environment jsdom
/**
 * Kurulum, reçete kartı ve dönem raporunun duman testi (jsdom; kullanıcı turu 4, G2):
 * - kurulumda "yakını olarak kuruyorum" seçilince "başucunda duracağım (ekranı çevir)" da sunulur (k02);
 * - uygunluk adımında işitme notu yakını modunda yardımcıya göre (k02), "Tekrar dinle" bütün maddeleri okur (k01);
 * - "Son 2 hafta içinde" seçilince tarih süre dolmadan da görünür (k03);
 * - reçete kartında ekran da "kristal oynaması (BPPV)" der (k05);
 * - dönem raporu önce son atağın sonucunu yazar ve QR kartını gösterir (k09);
 * - kullanıcı turu 6: dönem satırı adlandırılmış tarih dizisi (k09); testte "kötüyüm" durdurmasından sonra ana ekran notu (k01).
 */
import { afterEach, beforeAll, describe, expect, it, onTestFinished, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { encodePrescription } from '../../../core/prescription';
import { store } from '../../../state/store';
import { emptyData, type Episode } from '../../../state/types';
import { PeriodReport } from './History';
import { PatientHome } from './PatientHome';
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
          createElement(Route, { path: '/hasta', element: createElement(PatientHome) }),
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
    expect(byTestId('ob-contra-title')!.textContent).toBe('Hasta için uygun mu?');
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
    // Kullanıcı turu 6 (k09): "Dönem" satırı adlandırılmış tarih dizisi (QR kartı ve klinisyen ekranıyla aynı biçim).
    const dl = [...host!.querySelectorAll('dt')].find((x) => x.textContent === 'Dönem')!;
    expect(dl.nextElementSibling!.textContent).toMatch(/^Son 14 gün · ataklar \d\d\.\d\d(\.\d{4})?–\d\d\.\d\d(\.\d{4})? · rapor \d\d\.\d\d/);
  });
});

describe('ana ekran (kullanıcı turu 6, k01)', () => {
  it('tekrar testi "kötü hissediyorum" ile durduysa atak kartında not; düğme kalır', () => {
    const now = Date.now();
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: false };
    d.patient = { consentAt: '2026-01-01T00:00:00.000Z', contraindications: [], diagnosedByDoctor: true, canal: 'PC', side: 'R' };
    const manAt = now - 2 * 3600_000;
    d.episodes = [
      {
        id: 'a',
        startedAt: manAt - 600_000,
        side: 'R',
        protocolId: 'epley',
        redFlags: [],
        sideTests: [],
        maneuvers: [{ id: 'm', at: manAt, protocolId: 'epley', side: 'R', completed: true, stopReason: null, records: [], manual: false }],
        retests: [],
        status: 'active',
        testStops: [{ at: now - 60_000, test: 'retest', side: 'R', reason: 'USER_FEELS_UNWELL' }]
      }
    ];
    store.update(() => d);
    mount('/hasta');
    expect(byTestId('home-unwell-stop')!.textContent).toBe(
      'Son test, siz kötü hissettiğiniz için durdu. Kendinizi iyi hissettiğinizde yapın; geçmiyorsa hekiminize başvurun.'
    );
    expect(byTestId('do-retest')).not.toBeNull();
    // Not, düğmeden önce.
    const order = [...host!.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid'));
    expect(order.indexOf('home-unwell-stop')).toBeLessThan(order.indexOf('do-retest'));
  });
});

describe('yeniden tasarım: kilit yok (kurulum tek ekran, ana ekranda her zaman "Başım dönüyor")', () => {
  it('tanısız yeni kullanıcı: tek ekranda onay + Başla → ana ekran; düğme açık, tanı yalnız bilgi satırı', () => {
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: false };
    store.update(() => d);
    mount('/hasta/kurulum');
    // Tanı, kanal, taraf, sağlık durumu ve ses ayarı sorulmaz.
    expect(byTestId('ob-dx')).toBeNull();
    expect(byTestId('ob-contra')).toBeNull();
    expect(byTestId('ob-speech')).toBeNull();
    // Onaysız "Başla" ilerlemez.
    click(byTestId('ob-start'));
    expect(store.get().patient?.consentAt).toBeUndefined();
    click(byTestId('ob-consent'));
    click(byTestId('ob-start'));
    const p = store.get().patient!;
    expect(p.consentAt).toBeTruthy();
    expect(p.diagnosedByDoctor).toBe(false);
    expect(p.canal).toBe('unknown');
    expect(p.contraindications).toEqual([]);
    expect(byTestId('start-episode')!.textContent).toMatch(/Başım dönüyor/);
    expect(byTestId('home-no-dx')).not.toBeNull();
    expect(byTestId('practice')).not.toBeNull();
    expect(byTestId('home-gate-blocked')).toBeNull();
    expect(byTestId('home-112')).not.toBeNull();
  });

  it('kontrendikasyon, hekime yönlendirme ve dolu doz: yalnız bilgi satırları; "Başım dönüyor" yönlendirmeyi aşma olarak kaydeder', () => {
    // Saat gün ortasına sabit: manevralar 1–3 saat önce; gece yarısından sonra koşulunca "bugün" sayımı bozulmasın.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 31, 14, 0, 0) });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const now = Date.now();
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: false };
    d.patient = { consentAt: '2026-01-01T00:00:00.000Z', contraindications: ['neck'], diagnosedByDoctor: true, canal: 'PC', side: 'R' };
    const man = (i: number) => ({ id: 'm' + i, at: now - 3600_000 * (i + 1), protocolId: 'epley' as const, side: 'R' as const, completed: true, stopReason: null, records: [], manual: false });
    d.episodes = [
      {
        id: 'r',
        startedAt: now - 5 * 3600_000,
        endedAt: now - 1800_000,
        endNote: 'Baş dönmesi bir dakikadan uzun sürdü',
        side: 'R',
        protocolId: 'epley',
        redFlags: [],
        sideTests: [],
        maneuvers: [man(0), man(1), man(2)],
        retests: [],
        status: 'referred'
      }
    ];
    store.update(() => d);
    mount('/hasta');
    expect(byTestId('home-gate-items')!.textContent).toMatch(/Boyun sorunu/);
    expect(byTestId('home-referral-line')).not.toBeNull();
    expect(byTestId('home-dose-limit')).not.toBeNull();
    const btn = byTestId('start-episode')!;
    expect(btn.textContent).toMatch(/Başım dönüyor/);
    click(btn);
    const ov = store.get().episodes[0]!.overrides!;
    expect(ov).toHaveLength(1);
    expect(ov[0]!.kind).toBe('REFERRAL');
    expect(ov[0]!.detail).toMatch(/Yönlendirmeden sonra yeni atak başlatıldı/);
  });

  it('"Bilgilerim": hepsi isteğe bağlı; işaretlenen durum uyarı gösterir ama kaydı engellemez', () => {
    const d = emptyData();
    d.settings = { ...d.settings, role: 'patient', speech: false };
    d.patient = { consentAt: '2026-01-01T00:00:00.000Z', contraindications: [], diagnosedByDoctor: false, canal: 'unknown', side: 'unknown' };
    store.update(() => d);
    mount('/hasta/kurulum?adim=uygunluk');
    expect(byTestId('ob-contra-warning')).toBeNull();
    const neck = [...host!.querySelectorAll<HTMLElement>('[role="checkbox"]')].find((b) => /Boyun sorunu/.test(b.textContent ?? ''))!;
    click(neck);
    expect(byTestId('ob-contra-warning')!.textContent).toMatch(/hekiminize danışmanız önerilir/);
    click(byTestId('ob-save'));
    expect(store.get().patient!.contraindications).toEqual(['neck']);
    expect(store.get().patient!.diagnosedByDoctor).toBe(false);
  });
});
