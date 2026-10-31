// @vitest-environment jsdom
/**
 * Hasta akışının duman testi (jsdom): güvenlik sorusu → "Doğru mu?" onayı → hazırlık ekranı. Kullanıcı turu 3 (F2):
 * onay kartı başlığında yanıt, "Evet, doğru" kartın hemen altında; ilk okunuş kilidi yalnız ilk kez sorulan soruda;
 * hazırlık maddeleri yakını modunda yardımcıya göre ve "Titreşimleri tanı" hazırlıkta açılır.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { RED_FLAGS } from '../../../core/safety';
import { firstReadLockNeeded } from '../../../state/episodes';
import { store } from '../../../state/store';
import { emptyData } from '../../../state/types';
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

function seed(assist: 'self' | 'helper' = 'self') {
  const d = emptyData();
  d.settings = { ...d.settings, role: 'patient', speech: false, assist };
  d.patient = { consentAt: '2026-01-01T00:00:00.000Z', contraindications: [], diagnosedByDoctor: true, canal: 'PC', side: 'R' };
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

describe('hasta akışı duman testi (kullanıcı turu 3, F2)', () => {
  it('onay ekranı: başlıkta yanıt, "Evet, doğru" kartın hemen altında; geri dönüş aynı soruya', async () => {
    seed();
    mount();
    const first = byTestId('redflag-question')!.getAttribute('data-qid')!;
    await click('yn-yes');
    const title = byTestId('redflag-confirm-title')!;
    expect(title.textContent).toBe(`Sürekli baş dönmesi ya da dengesizlik var — doğru mu?`);
    // jsdom'da her kutu (0, 0): dokunulan yer en üstte sayılır. Kart en üstte kalır; "Evet"e dokunulan yerin üstünde yer
    // olmadığı için "Evet" en alta, "Yanlış dokundum"un da altına iner (çift kör dokunuş onay vermez).
    const order = [...host!.querySelectorAll('[data-testid^="redflag-confirm"]')].map((e) => e.getAttribute('data-testid'));
    expect(order.indexOf('redflag-confirm')).toBe(0);
    expect(order.indexOf('redflag-confirm-back')).toBeLessThan(order.indexOf('redflag-confirm-yes'));
    await click('redflag-confirm-back');
    expect(byTestId('redflag-question')!.getAttribute('data-qid')).toBe(first);
    // Yanıtlanan soru bu cihazda hatırlanır: bir dahaki sefere uzun okuma kilidi yok.
    expect(firstReadLockNeeded(store.get().settings, RED_FLAGS[0]!)).toBe(false);
    expect(firstReadLockNeeded(store.get().settings, RED_FLAGS[1]!)).toBe(true);
  });

  it('bütün sorular "Hayır" → alt tip → taraf → hazırlık; yakını modunda maddeler yardımcıya göre, titreşim tanıtımı hazırlıkta', async () => {
    seed('helper');
    mount();
    for (let i = 0; i < 20 && byTestId('redflag-question'); i++) await click('yn-no');
    const radio = (re: RegExp) => [...host!.querySelectorAll<HTMLElement>('[role="radio"]')].find((b) => re.test(b.textContent ?? ''))!;
    await waitUnlocked();
    act(() => radio(/Yatarken ya da yataktan kalkarken/).click());
    await waitUnlocked();
    act(() => radio(/1 dakikadan kısa/).click());
    await waitUnlocked();
    act(() => radio(/Sağ yanıma yatınca/).click());
    const prep = byTestId('prep')!;
    expect(prep.textContent).toMatch(/Hastayı yatağın üzerine oturtun/);
    expect(prep.textContent).not.toMatch(/alnınıza/);
    expect(byTestId('prep-haptic-legend')!.querySelector('[data-testid="haptic-legend"]')).not.toBeNull();
    expect(byTestId('helper-card')).not.toBeNull();
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
