// @vitest-environment jsdom
/**
 * Hasta akışının duman testi (jsdom). Yeniden tasarım (BRIEF): güvenlik soruları tek ekranda; hiçbir uyarı kilitlemez
 * ("Yine de devam et" kayda geçer); tanısız kullanıcı alt tip sorusundan hazırlığa geçer; hazırlık maddeleri yakını
 * modunda yardımcıya göre ve "Titreşimleri tanı" hazırlıkta açılır.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { RED_FLAGS } from '../../../core/safety';
import { firstReadLockNeeded } from '../../../state/episodes';
import { store } from '../../../state/store';
import { emptyData, type AppData } from '../../../state/types';
import { MotionProvider } from '../../../platform/MotionContext';
import { EpisodeFlow } from './EpisodeFlow';
import { PatientHome } from './PatientHome';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeAll(() => {
  window.scrollTo = () => {};
});

// Dokunuş kilitleri (0,6–1 s) sahte saatle geçilir.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
});

afterEach(() => {
  act(() => root?.unmount());
  vi.useRealTimers();
  host?.remove();
  root = null;
});

function seed(assist: 'self' | 'helper' = 'self', patient: Partial<NonNullable<AppData['patient']>> = {}) {
  const d = emptyData();
  d.settings = { ...d.settings, role: 'patient', speech: false, assist };
  d.patient = { consentAt: '2026-01-01T00:00:00.000Z', contraindications: [], diagnosedByDoctor: true, canal: 'PC', side: 'R', ...patient };
  store.update(() => d);
}

/** Rapor adresine gelindiğini gösterir (görünümün kendisi History.tsx'te, F3). */
function ReportProbe() {
  return createElement('p', { 'data-testid': 'report-probe' }, useParams().id);
}

function mount(path = '/hasta/atak/start') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      createElement(
        MotionProvider,
        null,
        createElement(
        MemoryRouter,
        { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } },
        createElement(
          Routes,
          null,
          createElement(Route, { path: '/hasta', element: createElement(PatientHome) }),
          createElement(Route, { path: '/hasta/atak/:mode', element: createElement(EpisodeFlow) }),
          createElement(Route, { path: '/hasta/rapor/:id', element: createElement(ReportProbe) }),
          createElement(Route, { path: '*', element: null })
        )
      )
      )
    );
  });
}

const byTestId = (id: string) => host!.querySelector<HTMLElement>(`[data-testid="${id}"]`);

async function waitUnlocked() {
  for (let i = 0; i < 50 && host!.querySelector('[data-locked]'); i++) {
    act(() => {
      vi.advanceTimersByTime(100);
    });
  }
  expect(host!.querySelector('[data-locked]')).toBeNull();
}

async function click(id: string) {
  await waitUnlocked();
  act(() => byTestId(id)!.click());
}

const ep = () => store.get().episodes.find((e) => e.status === 'active') ?? null;
const kinds = () => (ep()?.overrides ?? []).map((o) => o.kind);

describe('hasta akışı duman testi (yeniden tasarım: kilit yok, tek ekran güvenlik listesi)', () => {
  it('tanısız yeni kullanıcı: güvenlik listesi → "Hiçbiri yok" → alt tip (tek ekran) → hazırlık; NO_DIAGNOSIS kaydı', async () => {
    seed('self', { diagnosedByDoctor: false, canal: 'unknown', side: 'unknown' });
    mount();
    expect(byTestId('redflags')).not.toBeNull();
    // Tanısı olmayan kişiye "hekiminizin dediğinden farklı mı" sorulmaz.
    expect(byTestId('rf-same')).toBeNull();
    expect(byTestId('rf-neuro')).not.toBeNull();
    await click('redflags-none');
    const e = ep()!;
    expect(e.redFlags).toHaveLength(1);
    expect(e.redFlags[0]!.stopped).toBe(false);
    expect(Object.values(e.redFlags[0]!.answers).every((v) => v === 'no')).toBe(true);
    expect(kinds()).toContain('NO_DIAGNOSIS');
    // Yanıtlanan metinler bu cihazda hatırlanır.
    expect(firstReadLockNeeded(store.get().settings, RED_FLAGS[0]!)).toBe(false);
    expect(byTestId('subtype-liedown')).not.toBeNull();
    await click('subtype-liedown');
    expect(ep()!.subtype?.trigger).toBe('liedown');
    expect(byTestId('prep-ready')).not.toBeNull();
    expect(byTestId('prep-hc')).toBeNull();
  });

  it('alt tip "yatakta dönünce" → yatay kanal yolu (hazırlıkta yatay kanal notu); SUBTYPE kaydı', async () => {
    seed('self', { diagnosedByDoctor: false, canal: 'unknown', side: 'unknown' });
    mount();
    await click('redflags-none');
    await click('subtype-turn');
    expect(byTestId('prep-hc')).not.toBeNull();
    expect(byTestId('prep')!.textContent).toMatch(/yastık, yatınca başınızın altına gelsin/);
    expect(kinds()).toContain('SUBTYPE');
    expect(ep()!.subtype?.trigger).toBe('turn');
  });

  it('kırmızı bayrak işaretlenince uyarı (112) + "Yine de devam et" → kayıt RED_FLAG, atak açık; hekim tanısı (arka kanal) varken alt tip atlanır', async () => {
    seed();
    mount();
    expect(byTestId('rf-same')).not.toBeNull();
    act(() => byTestId('rf-neuro')!.click());
    expect(byTestId('redflags-none')).toBeNull();
    await click('redflags-continue');
    expect(byTestId('stop-emergency')).not.toBeNull();
    expect(byTestId('call-112')!.getAttribute('href')).toBe('tel:112');
    expect(ep()!.redFlags[0]!.answers.neuro).toBe('yes');
    expect(ep()!.redFlags[0]!.stopped).toBe(true);
    await click('redflag-override');
    expect(kinds()).toContain('RED_FLAG');
    expect(ep()!.overrides!.find((o) => o.kind === 'RED_FLAG')!.detail).toBe('neuro');
    expect(ep()!.status).toBe('active');
    expect(byTestId('prep-ready')).not.toBeNull();
  });

  it('kırmızı bayrak uyarısında "Durdur": atak acil olarak kapanır ve rapor açılır', async () => {
    seed();
    mount();
    act(() => byTestId('rf-headache')!.click());
    await click('redflags-continue');
    const id = ep()!.id;
    await click('redflag-stop');
    const e = store.get().episodes.find((x) => x.id === id)!;
    expect(e.status).toBe('emergency');
    expect(byTestId('report-probe')!.textContent).toBe(id);
  });

  it('kontrendikasyon: uyarı + "Yine de devam et" → kayıt (atak açılınca yazılır)', async () => {
    seed('self', { contraindications: ['neck'] });
    mount();
    expect(byTestId('contra-warn')!.textContent).toMatch(/Boyun sorunu/);
    await click('contra-override');
    await click('redflags-none');
    expect(kinds()).toContain('CONTRAINDICATION');
  });

  it('önceki atak hekime yönlendirmeyle bitti: kilit yok, yeni atakta REFERRAL bilgi kaydı', async () => {
    seed();
    const t = Date.now() - 3 * 24 * 3600_000;
    store.update((d) => ({
      ...d,
      episodes: [
        { id: 'old', startedAt: t, endedAt: t + 1000, side: 'R', protocolId: 'epley', redFlags: [], sideTests: [], maneuvers: [], retests: [], status: 'referred', endNote: 'ear' }
      ]
    }));
    mount();
    expect(byTestId('blocked-referral')).toBeNull();
    await click('redflags-none');
    expect(kinds()).toContain('REFERRAL');
  });

  it('manevra az önce yapıldı ve günlük sınır doldu: "Yine de manevra yap" ve doz uyarısı aşılır (EARLY_REPEAT, DOSE)', async () => {
    seed();
    const now = Date.now();
    const man = (i: number) => ({ id: 'm' + i, at: now - (10 - i) * 60_000, protocolId: 'epley' as const, side: 'R' as const, completed: true, stopReason: null, records: [], manual: false });
    store.update((d) => ({
      ...d,
      episodes: [{ id: 'a', startedAt: now - 3600_000, side: 'R', protocolId: 'epley', redFlags: [], sideTests: [], maneuvers: [man(1), man(2), man(3)], retests: [], status: 'active' }]
    }));
    mount();
    expect(byTestId('plan-warn')).not.toBeNull();
    await click('plan-override');
    expect(byTestId('dose-warn')).not.toBeNull();
    await click('dose-override');
    expect(kinds()).toEqual(['EARLY_REPEAT', 'DOSE']);
    await click('redflags-none');
    // Taraf biliniyor: doğrudan hazırlık (ardından manevra).
    expect(byTestId('prep-ready')).not.toBeNull();
  });

  it('yakını modunda hazırlık maddeleri yardımcıya göre, titreşim tanıtımı hazırlıkta', async () => {
    seed('helper');
    mount();
    await click('redflags-none');
    const prep = byTestId('prep')!;
    expect(prep.textContent).toMatch(/Hastayı yatağın üzerine oturtun/);
    expect(prep.textContent).not.toMatch(/alnınıza/);
    expect(byTestId('prep-haptic-legend')!.querySelector('[data-testid="haptic-legend"]')).not.toBeNull();
    expect(byTestId('helper-card')).not.toBeNull();
    expect(byTestId('prep-hearing')!.textContent).toMatch(/Hastanın işitme cihazı varsa/);
    expect(byTestId('prep-hearing')!.textContent).not.toMatch(/bir yakınınızla/);
    expect(byTestId('prep-ready')).not.toBeNull();
  });

  it('reçete bitimi kartı dönem raporunu açar ve tek satır sonucu gösterir (k09)', () => {
    seed();
    const day = 24 * 3600_000;
    const now = Date.now();
    const issued = new Date(now - 30 * day);
    const ymd = `${issued.getFullYear()}-${String(issued.getMonth() + 1).padStart(2, '0')}-${String(issued.getDate()).padStart(2, '0')}`;
    const ep = (id: string, at: number) => ({
      id,
      startedAt: at,
      endedAt: at + 3600_000,
      side: 'R' as const,
      protocolId: 'epley' as const,
      redFlags: [],
      sideTests: [],
      maneuvers: [{ id: 'm' + id, at, protocolId: 'epley' as const, side: 'R' as const, completed: true, stopReason: null, records: [], manual: false }],
      retests: [],
      status: 'resolved' as const
    });
    store.update((d) => ({
      ...d,
      patient: { ...d.patient!, prescription: { v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: ymd, perDay: 3, days: 7, by: 'Dr. Deneme' } },
      episodes: [ep('a', now - 29 * day), ep('b', now - 25 * day)]
    }));
    try {
      localStorage.clear();
    } catch {
      /* yok say */
    }
    mount('/hasta');
    expect(byTestId('home-rx-report-summary')!.textContent).toMatch(/2 atak · 2 manevra · tekrar testi yapılmadı/);
    act(() => byTestId('home-rx-report-open')!.click());
    expect(byTestId('report-probe')!.textContent).toBe('donem');
  });
});
