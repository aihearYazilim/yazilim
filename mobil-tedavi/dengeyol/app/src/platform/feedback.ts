/** Yürütücü ipuçlarını cihaz çıktılarına yönlendirir. */
import type { Cue } from '../core/runner';
import { haptics } from './haptics';
import { speech } from './speech';
import { tones } from './tones';

export function applySettings(s: { speech: boolean; speechRate: number; haptics: boolean; guidanceTone: boolean }) {
  speech.enabled = s.speech;
  speech.rate = s.speechRate;
  haptics.enabled = s.haptics;
  tones.guidance = s.guidanceTone;
}

export function playCues(cues: Cue[]) {
  for (const c of cues) {
    if (c.kind === 'speak') speech.speak(c.text, c.priority);
    else if (c.kind === 'haptic') haptics.play(c.pattern);
    else tones.play(c.pattern);
  }
}

/** Kullanıcı dokunuşu içinde: ses ve ton motorlarının kilidini aç (iOS). */
export function unlockAudio() {
  // iOS 16.4+: "playback" oturumu, sessiz anahtar açıkken de tonların ve konuşmanın duyulmasını sağlar.
  try {
    const as = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (as) as.type = 'playback';
  } catch {
    /* desteklenmiyor */
  }
  speech.unlock();
  tones.unlock();
}
