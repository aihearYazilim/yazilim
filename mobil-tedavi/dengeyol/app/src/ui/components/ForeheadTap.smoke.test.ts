// @vitest-environment jsdom
/**
 * Yeni kullanıcı turu 2 (M2-5; y07: "telefon alındayken ekranın her yeri" çalışmadı). İki neden düzeltildi ve burada kilitli:
 *  - Demo yolu: sanal telefonu alına koyacak panel yalnız yürütücüde açılıyordu; artık ekranın her yerini bekleyen ekranda da
 *    "Sanal baş" → "Telefonu alına koy" var.
 *  - Gerçek yol: dokunuş `click` yerine işaretçi olaylarıyla yakalanır (iPhone Safari düz metne dokunuşta belgeye click
 *    göndermez; uzun basış click üretmez). Ardından gelen click altındaki düğmeyi çalıştırmaz.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionProvider } from '../../platform/MotionContext';
import { store } from '../../state/store';
import { emptyData } from '../../state/types';
import { ForeheadTap } from './ForeheadTap';
import { SimPanel } from './SimPanel';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
});
afterEach(() => {
  act(() => root?.unmount());
  vi.useRealTimers();
  vi.restoreAllMocks();
  host?.remove();
  root = null;
});

const byTestId = (id: string) => host!.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });
/** İşaretçi olayı (jsdom'da PointerEvent yok: aynı adla MouseEvent; isPrimary tanımsız = birincil sayılır). */
const pointer = (el: Element, type: 'pointerdown' | 'pointerup') => act(() => void el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true })));

function mount(onTap: () => void, onOther: () => void) {
  const d = emptyData();
  // Önce demo kapalı: sanal sensörün (modül düzeyinde) önceki sınamadan kalan saati durur; demo açılınca bu sahte saatle başlar.
  d.settings = { ...d.settings, role: 'patient', simulation: false, speech: false };
  store.update(() => d);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      createElement(
        MotionProvider,
        null,
        createElement('main', null, createElement('p', { 'data-testid': 'text' }, 'Hazırlık maddeleri'), createElement('button', { 'data-testid': 'other', onClick: onOther }, 'Başka düğme')),
        createElement(ForeheadTap, { enabled: true, onTap, testid: 'forehead' }),
        createElement(SimPanel)
      )
    );
  });
  act(() => store.update((x) => ({ ...x, settings: { ...x.settings, simulation: true } })));
}

describe('telefon alındayken ekranın her yeri (M2-5)', () => {
  it('demo modunda panelden sanal telefon alına konur; düz metne işaretçi dokunuşu (click olmadan) tetikler, altındaki düğme çalışmaz', () => {
    const onTap = vi.fn();
    const onOther = vi.fn();
    mount(onTap, onOther);
    advance(2500);
    // Elde okuma duruşu: şerit yok; panel açılabilir (yürütücü dışında da).
    expect(byTestId('forehead')).toBeNull();
    act(() => byTestId('sim-open')!.click());
    act(() => byTestId('sim-forehead')!.click());
    advance(2500);
    expect(byTestId('forehead')).not.toBeNull();
    // Demo paneline dokunuş "ekranın her yeri" sayılmaz.
    advance(700);
    pointer(byTestId('sim-forehead')!, 'pointerdown');
    pointer(byTestId('sim-forehead')!, 'pointerup');
    act(() => byTestId('sim-forehead')!.click());
    expect(onTap).not.toHaveBeenCalled();
    // iPhone yolu: düz metne dokunuş yalnız işaretçi olayı üretir.
    pointer(byTestId('text')!, 'pointerdown');
    pointer(byTestId('text')!, 'pointerup');
    expect(onTap).toHaveBeenCalledTimes(1);
    // Düğmeye dokunuş: işaretçi olayı tetikler, ardından gelen click düğmeyi çalıştırmaz (ikinci kez de tetiklemez).
    pointer(byTestId('other')!, 'pointerdown');
    pointer(byTestId('other')!, 'pointerup');
    act(() => byTestId('other')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })));
    expect(onTap).toHaveBeenCalledTimes(2);
    expect(onOther).not.toHaveBeenCalled();
  });

  it('şerit açılmadan önce başlamış dokunuş (parmak zaten ekrandaydı) sayılmaz; telefon indirilince düğmeler olağan çalışır', () => {
    const onTap = vi.fn();
    const onOther = vi.fn();
    mount(onTap, onOther);
    act(() => byTestId('sim-open')!.click());
    // Parmak ekranda iken telefon alına konur.
    pointer(byTestId('text')!, 'pointerdown');
    act(() => byTestId('sim-forehead')!.click());
    advance(3000);
    expect(byTestId('forehead')).not.toBeNull();
    pointer(byTestId('text')!, 'pointerup');
    expect(onTap).not.toHaveBeenCalled();
    // Telefon elde (okuma): şerit kalkar, düğme kendi işini yapar.
    const reading = host!.querySelector<HTMLInputElement>('[data-testid="sim-panel"] input[type="checkbox"]')!;
    act(() => reading.click());
    advance(200);
    expect(byTestId('forehead')).toBeNull();
    act(() => byTestId('other')!.click());
    expect(onOther).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();
  });
});
