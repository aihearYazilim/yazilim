// @vitest-environment jsdom
/**
 * Hasta akışının duman testi (jsdom). Yeniden tasarım (BRIEF): güvenlik soruları tek ekranda; hiçbir uyarı kilitlemez
 * ("Yine de devam et" kayda geçer); tanısız kullanıcı alt tip sorusundan hazırlığa geçer; hazırlık maddeleri yakını
 * modunda yardımcıya göre ve "Titreşimleri tanı" hazırlıkta açılır.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
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
  // Kırmızı bayrak uyarısında "Yine de devam et" en az 5 s bekler (L2-2): 10 s'ye dek ilerletilir.
  for (let i = 0; i < 100 && host!.querySelector('[data-locked]'); i++) {
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
    // Acil belirti: uyarıdan önce tek "doğru mu?" onayı (y02; kilit değil, yanlış dokunuş koruması).
    expect(byTestId('redflags-confirm-title')!.textContent).toMatch(/Çift görme.*doğru mu\?/);
    await click('redflags-confirm-yes');
    expect(byTestId('stop-emergency')).not.toBeNull();
    // "Yine de devam et" görünür ama 112 cümlesi bitene ve en az 5 s geçene dek basılamaz (geri sayımlı, çerçeveli ikincil).
    const ov = byTestId('redflag-override') as HTMLButtonElement;
    expect(ov.disabled).toBe(true);
    expect(ov.className).toMatch(/\boverride\b/);
    expect(ov.textContent).toMatch(/Yine de devam et \(5\)/);
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect((byTestId('redflag-override') as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect((byTestId('redflag-override') as HTMLButtonElement).disabled).toBe(false);
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
    await click('redflags-confirm-yes');
    const id = ep()!.id;
    await click('redflag-stop');
    const e = store.get().episodes.find((x) => x.id === id)!;
    expect(e.status).toBe('emergency');
    expect(byTestId('report-probe')!.textContent).toBe(id);
  });

  it('acil belirti onayında "Yanlış dokundum": listeye döner, işaret korunur; hekim belirtisinde onay sorulmaz', async () => {
    seed();
    mount();
    act(() => byTestId('rf-neuro')!.click());
    await click('redflags-continue');
    await click('redflags-confirm-back');
    expect(byTestId('redflags')).not.toBeNull();
    expect(byTestId('rf-neuro')!.getAttribute('aria-checked')).toBe('true');
    expect(ep()).toBeNull();
    // İşaret kaldırılıp hekim belirtisi (kulak) işaretlenince onay yok, doğrudan uyarı; "Durdur" dolu birincil.
    act(() => byTestId('rf-neuro')!.click());
    act(() => byTestId('rf-ear')!.click());
    await click('redflags-continue');
    expect(byTestId('redflags-confirm')).toBeNull();
    expect(byTestId('stop-doctor')).not.toBeNull();
    expect(byTestId('redflag-stop')!.className).toMatch(/\bprimary\b/);
  });

  it('112 dışı madde (boyun) uyarısında "Yanlış dokundum, listeye dön": yanıt kaydı geri alınır, "düzeltildi" bilgi kaydı (M1-4; y02)', async () => {
    seed();
    mount();
    act(() => byTestId('rf-neck')!.click());
    await click('redflags-continue');
    expect(byTestId('stop-doctor')).not.toBeNull();
    expect(ep()!.redFlags).toHaveLength(1);
    // Acil uyarıda yok (orada "doğru mu?" onayı var); hekim uyarısında ikincil düğme.
    expect(byTestId('redflag-wrong-tap')!.className).not.toMatch(/\bprimary\b/);
    await click('redflag-wrong-tap');
    expect(byTestId('redflags')).not.toBeNull();
    expect(byTestId('rf-neck')!.getAttribute('aria-checked')).toBe('false');
    expect(ep()!.redFlags).toHaveLength(0);
    expect(ep()!.status).toBe('active');
    expect(kinds()).toContain('RED_FLAG_UNDO');
    expect(kinds()).not.toContain('RED_FLAG');
    await click('redflags-none');
    expect(ep()!.redFlags).toHaveLength(1);
    expect(ep()!.redFlags[0]!.stopped).toBe(false);
  });

  it('acil uyarısında "Yanlış dokundum, listeye dön" yok (onay zaten soruldu)', async () => {
    seed();
    mount();
    act(() => byTestId('rf-neuro')!.click());
    await click('redflags-continue');
    await click('redflags-confirm-yes');
    expect(byTestId('stop-emergency')).not.toBeNull();
    expect(byTestId('redflag-wrong-tap')).toBeNull();
  });

  it('seçeneklerin başında sıra numarası (seste "Birinci, İkinci…"; M1-10)', async () => {
    seed('self', { diagnosedByDoctor: false, canal: 'unknown', side: 'unknown' });
    mount();
    await click('redflags-none');
    const nums = [...host!.querySelectorAll('[role="radio"] .choice-num')].map((x) => x.textContent);
    expect(nums).toEqual(['1', '2', '3']);
    expect(byTestId('subtype-liedown')!.querySelector('.choice-num')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('araştırma ayarı açıkken atak başında belirti şiddeti (0–10) sorulur ve kaydedilir; kapalıyken hiç görünmez (M1-11)', async () => {
    seed('self', { diagnosedByDoctor: false, canal: 'unknown', side: 'unknown' });
    mount();
    await click('redflags-none');
    expect(byTestId('vas-before')).toBeNull();
    expect(byTestId('subtype-liedown')).not.toBeNull();
    act(() => root?.unmount());
    host?.remove();
    store.update((d) => ({ ...d, episodes: [], settings: { ...d.settings, askVas: true } }));
    mount();
    await click('redflags-none');
    expect(byTestId('vas-before')).not.toBeNull();
    expect(host!.querySelectorAll('[data-testid^="vas-before-"]').length).toBe(12);
    await click('vas-before-4');
    expect(ep()!.vas).toEqual({ before: 4 });
    expect(byTestId('subtype-liedown')).not.toBeNull();
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
    // Saat gün ortasına sabit: manevralar birkaç dakika önce; gece yarısından hemen sonra koşulunca "bugün" sayımı bozulmasın.
    // (beforeEach'teki sahte zamanlayıcılar Date ile birlikte yeniden kurulur; afterEach gerçek saate döner.)
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'], now: new Date(2026, 9, 31, 14, 0, 0) });
    seed();
    const now = Date.now();
    const man = (i: number) => ({ id: 'm' + i, at: now - (10 - i) * 60_000, protocolId: 'epley' as const, side: 'R' as const, completed: true, stopReason: null, records: [], manual: false });
    store.update((d) => ({
      ...d,
      episodes: [{ id: 'a', startedAt: now - 3600_000, side: 'R', protocolId: 'epley', redFlags: [], sideTests: [], maneuvers: [man(1), man(2), man(3)], retests: [], status: 'active' }]
    }));
    mount();
    expect(byTestId('plan-warn')).not.toBeNull();
    // Önerilen yol (ana ekran) büyük dolu düğme; "Yine de manevra yap" çerçeveli ikincil (y06).
    expect(byTestId('go-home')!.className).toMatch(/\bprimary\b/);
    expect(byTestId('plan-override')!.className).toMatch(/\boverride\b/);
    await click('plan-override');
    expect(byTestId('go-home')!.className).toMatch(/\bprimary\b/);
    expect(byTestId('dose-override')!.className).not.toMatch(/\bprimary\b/);
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

  it('hazırlık: "Hazırım" altta sabit; işitme cihazı, titreşimler ve "Kim yapıyor" katlanır "Ayrıntılar"da (kendim modunda kapalı)', async () => {
    seed();
    mount();
    await click('redflags-none');
    expect(byTestId('prep-ready')!.closest('.sticky-actions')).not.toBeNull();
    const details = byTestId('prep-details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.contains(byTestId('prep-hearing'))).toBe(true);
    expect(details.textContent).toMatch(/Kim yapıyor/);
  });

  it('manevra sonrası yeni belirti bildirildiyse (24 saat): ana ekranda ve akışta kırmızı 112 şeridi; tekrar testi/hatırlatıcı yok; "112\'yi aradım" kapatır', async () => {
    seed();
    const now = Date.now();
    store.update((d) => ({
      ...d,
      episodes: [
        {
          id: 'n',
          startedAt: now - 20 * 60_000,
          side: 'R',
          protocolId: 'epley',
          redFlags: [{ at: now - 20 * 60_000, answers: {}, stopped: false }],
          sideTests: [],
          maneuvers: [{ id: 'm', at: now - 5 * 60_000, protocolId: 'epley', side: 'R', completed: true, stopReason: null, records: [], manual: false, afterSymptoms: 'neuro' }],
          retests: [],
          status: 'active',
          overrides: [{ at: now - 4 * 60_000, kind: 'RED_FLAG', detail: 'Manevra sonrası yeni belirti' }]
        }
      ]
    }));
    mount('/hasta');
    expect(byTestId('home-neuro')).not.toBeNull();
    expect(byTestId('home-neuro-call')!.getAttribute('href')).toBe('tel:112');
    expect(byTestId('add-reminder')).toBeNull();
    expect(byTestId('home-neuro-retest')).not.toBeNull();
    // Kilit yok: "Başım dönüyor" akışı açar; akışta da şerit görünür. Yeni kullanıcı turu 2 (M1-5; y05): sıradaki adım
    // ("Tekrar testi …") yerine "Yeni belirti bildirdiniz: manevra önerilmiyor"; önerilen yol ana ekran, manevra ikincil.
    act(() => byTestId('start-episode')!.click());
    expect(byTestId('neuro-warn')!.textContent).toMatch(/Yeni belirti bildirdiniz: manevra önerilmiyor.*112/);
    expect(byTestId('plan-warn')).toBeNull();
    expect(host!.textContent).not.toMatch(/Tekrar testi/);
    expect(byTestId('go-home')!.className).toMatch(/\bprimary\b/);
    expect(byTestId('neuro-override')!.className).toMatch(/\boverride\b/);
    expect(byTestId('neuro-strip')).not.toBeNull();
    await click('neuro-override');
    expect(kinds()).toContain('NEURO_ALERT');
    // Aşınca sıradaki adım uyarısı ayrıca sorulmaz; giriş denetimleri sürer.
    expect(byTestId('plan-warn')).toBeNull();
    expect(byTestId('neuro-warn')).toBeNull();
    act(() => byTestId('neuro-strip-called')!.click());
    expect(byTestId('neuro-strip')).toBeNull();
    expect(store.get().episodes[0]!.neuroAlertAck?.by).toBe('called112');
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

describe('yeni kullanıcı turu 1, L5: kötü an sonrası akış', () => {
  // Önceki (beforeEach) sahte saat kaldırılmadan yeniden kurulursa Date sahte olmuyor: önce gerçek saate dön.
  const fixedNoon = () =>
    vi.useRealTimers().useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'], now: new Date(2026, 9, 31, 14, 0, 0) });
  const activeEp = (over: Partial<NonNullable<AppData['episodes']>[number]> = {}) => {
    const now = Date.now();
    return {
      id: 'a',
      startedAt: now - 40 * 60_000,
      side: 'R' as const,
      protocolId: 'epley' as const,
      redFlags: [{ at: now - 40 * 60_000, answers: {}, stopped: false }],
      sideTests: [],
      maneuvers: [],
      retests: [],
      status: 'active' as const,
      ...over
    };
  };
  const manAt = (at: number, extra: Record<string, unknown> = {}) => ({
    id: 'm' + at,
    at,
    protocolId: 'epley' as const,
    side: 'R' as const,
    completed: true,
    stopReason: null,
    records: [],
    manual: false,
    ...extra
  });

  it('kusmadan sonra "Başım dönüyor": gerekçesi kusma olan tek uyarı (sabah saatiyle); aşma VOMITING, DOSE yok (L5-1)', async () => {
    fixedNoon();
    seed();
    const now = Date.now();
    store.update((d) => ({ ...d, episodes: [activeEp({ maneuvers: [manAt(now - 30 * 60_000, { afterSymptoms: 'severe' })] })] }));
    mount();
    const w = byTestId('vomit-warn')!;
    expect(w.textContent).toMatch(/Bugün kusma bildirdiniz/);
    expect(w.textContent).toMatch(/1 Kasım 06:00/);
    expect(byTestId('plan-warn')).toBeNull();
    expect(byTestId('dose-warn')).toBeNull();
    expect(byTestId('go-home')!.className).toMatch(/\bprimary\b/);
    expect(byTestId('vomit-override')!.className).toMatch(/\boverride\b/);
    await click('vomit-override');
    expect(kinds()).toEqual(['VOMITING']);
    expect(ep()!.overrides![0]!.detail).toMatch(/1 Kasım 06:00/);
    // Ardından ne sabah testi ne doz uyarısı: doğrudan hazırlık.
    expect(byTestId('plan-warn')).toBeNull();
    expect(byTestId('dose-warn')).toBeNull();
    expect(byTestId('prep-ready')).not.toBeNull();
  });

  it('"Kendimi kötü hissediyorum" ile duran manevradan sonra yeniden başlarken "Geçti mi?"; "Hâlâ kötüyüm" dinlenme ekranı, "Yine de devam et" kayda geçer (L5-2)', async () => {
    seed();
    const now = Date.now();
    store.update((d) => ({ ...d, episodes: [activeEp({ maneuvers: [manAt(now - 60_000, { completed: false, stopReason: 'USER_FEELS_UNWELL' })] })] }));
    mount();
    expect(byTestId('feel-check')!.textContent).toMatch(/Kusma ya da kötü hissetme geçti mi\?/);
    expect(byTestId('feel-ok')!.className).toMatch(/\bprimary\b/);
    expect(byTestId('prep')).toBeNull();
    await click('feel-not');
    expect(byTestId('end-still-unwell')).not.toBeNull();
    expect(byTestId('go-home')!.className).toMatch(/\bprimary\b/);
    await click('still-unwell-override');
    expect(kinds()).toContain('STILL_UNWELL');
    expect(byTestId('prep-ready')).not.toBeNull();
  });

  it('uzun baş dönmesiyle "Durdur"dan sonra "Geçti" yanıtı kaydedilir ve akış sürer (L5-2)', async () => {
    seed();
    const now = Date.now();
    store.update((d) => ({ ...d, episodes: [activeEp({ maneuvers: [manAt(now - 60_000, { completed: false, stopReason: 'VERTIGO_TOO_LONG' })] })] }));
    mount();
    expect(byTestId('feel-check')!.getAttribute('data-kind')).toBe('vertigoLong');
    await click('feel-ok');
    expect(ep()!.feelBetterAt).toBeGreaterThan(now - 1000);
    expect(byTestId('prep-ready')).not.toBeNull();
  });

  it('kaldığınız yerden: yapılmış birinci taraf testi kaybolmaz; hazırlık yeniden gösterilmez (L5-3)', async () => {
    seed('self', { diagnosedByDoctor: false, canal: 'unknown', side: 'unknown' });
    const now = Date.now();
    const res = { side: 'R' as const, vertigo: true, latencySec: 2, durationSec: 15, safetyStopped: false };
    store.update((d) => ({ ...d, episodes: [activeEp({ side: null, sideProgress: { at: now - 3 * 60_000, order: ['R', 'L'], results: [res] } })] }));
    mount();
    // Kayıtlı tanıtma yok: yalnız tanıtma ekranı (hazırlık yok).
    expect(byTestId('prep')).toBeNull();
    expect(byTestId('calibrate')).not.toBeNull();
  });

  it('kaldığınız yerden: kayıtlı tanıtmayla yarıda kalan manevra "Başlat" ekranında, notuyla (L5-3)', async () => {
    seed('self', { calibration: { sign: 1, facing: 'outward', matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1], mountTiltDeg: 0, createdAt: '2026-01-01T00:00:00.000Z' } });
    const now = Date.now();
    // Manevra sürerken uygulama kapandı: açılışta L3 ara kaydından "yarıda kaldı" kaydı kuruldu (recovered, INTERRUPTED).
    store.update((d) => ({
      ...d,
      episodes: [activeEp({ maneuvers: [manAt(now - 2 * 60_000, { completed: false, stopReason: 'INTERRUPTED', recovered: true, records: [] })] })]
    }));
    mount();
    expect(byTestId('prep')).toBeNull();
    // Yeni kullanıcı turu 2 (M1-7; y01): önce sorulur; "Baştan yapalım" büyük, "Bugünlük bitir" ikincil.
    expect(byTestId('resume-ask')!.textContent).toMatch(/Manevra 1\. adımda yarıda kaldı/);
    expect(byTestId('resume-restart')!.className).toMatch(/\bprimary\b/);
    await click('resume-restart');
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(byTestId('prep')).toBeNull();
    expect(byTestId('run-note')!.textContent).toMatch(/Kaldığınız yerden: yarıda kalan sağ taraf manevrasını baştan/);
    expect(byTestId('runner-start')).not.toBeNull();
  });

  it('yarıda kalan manevra: "Bugünlük bitir" manevra başlatmaz, yeni kayıt yazmaz (M1-7)', async () => {
    seed();
    const now = Date.now();
    const records = [{ stepId: 'a' }, { stepId: 'b' }, { stepId: 'c' }];
    store.update((d) => ({
      ...d,
      episodes: [activeEp({ maneuvers: [manAt(now - 2 * 60_000, { completed: false, stopReason: 'INTERRUPTED', recovered: true, records })] })]
    }));
    mount();
    expect(byTestId('resume-ask')!.textContent).toMatch(/Manevra 3\. adımda yarıda kaldı/);
    await click('resume-stop');
    expect(byTestId('end-resume-stop')).not.toBeNull();
    expect(byTestId('runner-start')).toBeNull();
    expect(ep()!.maneuvers).toHaveLength(1);
  });

  it('bilinen hekim tanısı (tarihsiz, sağ): hazırlıkta tek test süresi; tanısızda iki test (L5-7)', async () => {
    seed('self', { canal: 'unknown' });
    mount();
    await click('redflags-none');
    await click('subtype-liedown');
    expect(host!.textContent).toMatch(/9–11 dakika \(kısa test ve manevra\)/);
  });

  it('telefon alındayken (sensör dik ve sabit) hazırlıkta ekranın her yeri "Hazırım"; elde okurken boş yere dokunuş geçmez (L5-4)', async () => {
    // Sensör örneklerinin zamanı (performance.now) sahte saatle ilerlesin.
    vi.useRealTimers().useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    const perf = vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
    onTestFinished(() => perf.mockRestore());
    seed();
    store.update((d) => ({ ...d, settings: { ...d.settings, simulation: true } }));
    mount();
    await click('redflags-none');
    expect(byTestId('prep')).not.toBeNull();
    // Elde okuma duruşu: dokunuş hazırlığı geçmez.
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(byTestId('prep-forehead')).toBeNull();
    act(() => byTestId('prep')!.click());
    expect(byTestId('prep')).not.toBeNull();
    // Telefon alında: kısa süre sonra şerit; boş yere dokunuş "Hazırım".
    const w = window as unknown as { __dengeyolSim: { upright: () => void; reading: () => void } };
    act(() => w.__dengeyolSim.upright());
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(byTestId('prep-forehead')).not.toBeNull();
    // Şerit açılır açılmaz gelen dokunuş sayılmaz (parmak zaten ekrandaydı).
    act(() => byTestId('prep')!.click());
    expect(byTestId('prep')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => byTestId('prep')!.click());
    expect(byTestId('prep')).toBeNull();
    expect(byTestId('calibrate')).not.toBeNull();
    act(() => w.__dengeyolSim.reading());
  });
});
