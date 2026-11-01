/**
 * Kalıcı kırmızı 112 şeridi (yeni kullanıcı turu 1, L2-1; y05): manevradan sonra "Yeni belirti" bildirildiyse atak
 * akışının ekranlarında ve ana ekranda görünür; kişi "112'yi aradım" ya da "Belirtiler geçti, iyiyim" diyene dek ya da
 * 24 saat (state/neuroAlert.ts). Kilit değildir.
 */
import { ackNeuroAlert, type NeuroAlert } from '../../../state/neuroAlert';
import { store } from '../../../state/store';
import { Icon } from '../../components/Icon';
import { NEURO_STRIP_TEXT } from './flowText';

export function NeuroAlertStrip({ alert, testid = 'neuro-strip', standalone }: { alert: NeuroAlert; testid?: string; standalone?: boolean }) {
  const ack = (by: 'ok' | 'called112') => store.update((x) => ackNeuroAlert(x, alert.episodeId, by));
  return (
    <div className={`neuro-strip${standalone ? ' standalone' : ''}`} role="alert" data-testid={testid}>
      <div className="row">
        <Icon name="alert" />
        <strong className="grow">{NEURO_STRIP_TEXT}</strong>
      </div>
      <a className="btn danger block" href="tel:112" data-testid={`${testid}-call`}>
        <Icon name="phone" /> 112'yi ara
      </a>
      <div className="row wrap">
        <button type="button" className="btn ghost grow" onClick={() => ack('called112')} data-testid={`${testid}-called`}>
          112'yi aradım
        </button>
        <button type="button" className="btn ghost grow" onClick={() => ack('ok')} data-testid={`${testid}-ok`}>
          Belirtiler geçti, iyiyim
        </button>
      </div>
    </div>
  );
}
