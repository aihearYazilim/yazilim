// @vitest-environment jsdom
/**
 * Yeni kullanıcı turu 1 (L5-5, L5-6; y02): karşılamada "Klinisyenim"e yanlış dokunuş klinisyen modunu açmaz (önce "Hekim
 * misiniz?"), klinisyen ana ekranının en üstünde "Hasta moduna dön"; telefon alna konana dek ekranlar kısaca konuşur
 * (karşılama, kurulum, telefonu tanıtma girişi).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MotionProvider } from '../../platform/MotionContext';
import { speech } from '../../platform/speech';
import { store } from '../../state/store';
import { emptyData } from '../../state/types';
import { Calibrate, CAL_INTRO_SPOKEN } from './Calibrate';
import { ClinicianHome } from './clinician/ClinicianHome';
import { Onboarding } from './patient/Onboarding';
import { CLINICIAN_CONFIRM_SPOKEN, consentSpoken, WELCOME_SPOKEN } from './patient/onboardingText';
import { Welcome } from './Welcome';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeAll(() => {
  window.scrollTo = () => {};
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
});
afterEach(() => {
  act(() => root?.unmount());
  vi.useRealTimers();
  vi.restoreAllMocks();
  host?.remove();
  root = null;
});

function Probe({ id }: { id: string }) {
  return createElement('p', { 'data-testid': id });
}

function mount(path: string, extra?: React.ReactElement) {
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
            createElement(Route, { path: '/', element: createElement(Welcome) }),
            createElement(Route, { path: '/hasta', element: createElement(Probe, { id: 'patient-home' }) }),
            createElement(Route, { path: '/hasta/kurulum', element: createElement(Onboarding) }),
            createElement(Route, { path: '/odyolog', element: createElement(ClinicianHome) }),
            createElement(Route, { path: '/kalibrasyon', element: extra ?? null })
          )
        )
      )
    );
  });
}

const byTestId = (id: string) => host!.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const unlock = () =>
  act(() => {
    vi.advanceTimersByTime(1000);
  });

function seed(role: 'patient' | 'clinician' | null) {
  const d = emptyData();
  d.settings = { ...d.settings, role };
  store.update(() => d);
}

describe('karşılama: "Klinisyenim" onayı (L5-5)', () => {
  it('yanlış dokunuş klinisyen modunu açmaz; "Hayır, hastayım" hasta moduna, açılış sesi büyük düğmeyi söyler', () => {
    seed(null);
    const spoken = vi.spyOn(speech, 'speak');
    mount('/');
    expect(spoken).toHaveBeenCalledWith(WELCOME_SPOKEN, 'normal');
    act(() => byTestId('role-clinician')!.click());
    expect(store.get().settings.role).toBeNull();
    expect(byTestId('role-clinician-confirm')!.textContent).toMatch(/Hekim ya da odyolog musunuz\?/);
    expect(spoken).toHaveBeenCalledWith(CLINICIAN_CONFIRM_SPOKEN, 'high');
    // Önerilen yol büyük dolu "Hayır, hastayım"; açılışta kör ikinci dokunuş sayılmaz.
    expect(byTestId('role-clinician-no')!.className).toMatch(/\bprimary\b/);
    expect(byTestId('role-clinician-yes')!.className).not.toMatch(/\bprimary\b/);
    act(() => byTestId('role-clinician-yes')!.click());
    expect(store.get().settings.role).toBeNull();
    unlock();
    act(() => byTestId('role-clinician-no')!.click());
    expect(store.get().settings.role).toBe('patient');
    expect(byTestId('patient-home')).not.toBeNull();
  });

  it('"Evet, hekimim" klinisyen moduna; klinisyen ana ekranının en üstünde "Hasta moduna dön"', () => {
    seed(null);
    mount('/');
    act(() => byTestId('role-clinician')!.click());
    unlock();
    act(() => byTestId('role-clinician-yes')!.click());
    expect(store.get().settings.role).toBe('clinician');
    const back = byTestId('clin-to-patient')!;
    expect(back.className).toMatch(/\bprimary\b.*\bxl\b|\bxl\b.*\bprimary\b/);
    // Ekrandaki ilk düğme.
    expect(host!.querySelector('main button')).toBe(back);
    act(() => back.click());
    expect(store.get().settings.role).toBe('patient');
    expect(byTestId('patient-home')).not.toBeNull();
  });
});

describe('telefon alna konana dek kısa ses (L5-6)', () => {
  it('kurulum (onam) ekranı açılınca kısa özet okunur', () => {
    seed('patient');
    const spoken = vi.spyOn(speech, 'speak');
    mount('/hasta/kurulum');
    expect(spoken).toHaveBeenCalledWith(consentSpoken(false), 'normal');
  });

  it('telefonu tanıtma girişi (hasta) açılınca kısa ses; klinisyen kalibrasyonunda okunmaz', () => {
    seed('patient');
    const spoken = vi.spyOn(speech, 'speak');
    mount('/kalibrasyon', createElement(Calibrate, { audience: 'patient', onDone: () => {}, onCancel: () => {} }));
    expect(spoken).toHaveBeenCalledWith(CAL_INTRO_SPOKEN, 'normal');
    act(() => root!.unmount());
    root = null;
    host!.remove();
    spoken.mockClear();
    mount('/kalibrasyon', createElement(Calibrate, { audience: 'clinician', onDone: () => {}, onCancel: () => {} }));
    expect(spoken).not.toHaveBeenCalledWith(CAL_INTRO_SPOKEN, 'normal');
  });
});
