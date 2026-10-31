// @vitest-environment jsdom
/** Ekran değişince konuşma susar: düğme/bağlantı tıklaması ve sayfa değişimi (kullanıcı geri bildirimi, yeniden tasarım). */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { speech } from '../../platform/speech';
import { shouldHushOnClick, SpeechHush } from './SpeechHush';

function dom(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('shouldHushOnClick', () => {
  it('düğme, bağlantı ve seçenekler susturur; düz metin susturmaz', () => {
    const d = dom('<button id="b"><span id="s">İleri</span></button><a id="a" href="#/x">Git</a><div role="radio" id="r">Seç</div><p id="p">metin</p>');
    expect(shouldHushOnClick(d.querySelector('#s'))).toBe(true);
    expect(shouldHushOnClick(d.querySelector('#a'))).toBe(true);
    expect(shouldHushOnClick(d.querySelector('#r'))).toBe(true);
    expect(shouldHushOnClick(d.querySelector('#p'))).toBe(false);
  });
  it('yürütücü, data-keep-speech ve devre dışı düğmeler muaf', () => {
    const d = dom('<div class="runner"><button id="rb">Duraklat</button></div><button id="k" data-keep-speech>Dinle</button><button id="dis" disabled>Bekle</button><div role="button" aria-disabled="true" id="ad">x</div>');
    expect(shouldHushOnClick(d.querySelector('#rb'))).toBe(false);
    expect(shouldHushOnClick(d.querySelector('#k'))).toBe(false);
    expect(shouldHushOnClick(d.querySelector('#dis'))).toBe(false);
    expect(shouldHushOnClick(d.querySelector('#ad'))).toBe(false);
  });
});

describe('SpeechHush', () => {
  it('ileri düğmesine basınca ve sayfa değişince konuşmayı keser', () => {
    const cancel = vi.spyOn(speech, 'cancel').mockImplementation(() => {});
    const host = dom('<button id="next">İleri</button>');
    const root = createRoot(document.createElement('div'));
    act(() => root.render(createElement(SpeechHush)));
    (host.querySelector('#next') as HTMLButtonElement).click();
    expect(cancel).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(cancel).toHaveBeenCalledTimes(2);
    act(() => root.unmount());
  });
});
