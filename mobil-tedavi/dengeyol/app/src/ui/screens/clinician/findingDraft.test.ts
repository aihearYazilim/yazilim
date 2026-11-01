// @vitest-environment jsdom
/**
 * Muayene taslakları (yeni kullanıcı turu 3, y08 #1): bulgu formu taslağı uygulama kapanıp açılınca da korunur (localStorage,
 * sekme ömrüne bağlı sessionStorage değil); kaydedilince silinir, 24 saat sonra geçersiz sayılır.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { DRAFT_TTL_MS, findingDraftKey, pruneDrafts, readDraft, readFindingDraft, removeFindingDraft, writeDraft } from './FindingForm';

const T = 1_800_000_000_000;
const draft = { nys: 'upbeat-torsional', lat: '4', dur: '17', intensity: null, vertigo: true, torsion: 'unset', fatigue: 'unset', reversal: 'unset', method: null, note: '' };

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('muayene taslağı', () => {
  it('localStorage\'da muayeneye bağlı saklanır (sekme kapanınca kaybolmaz); kaydedince silinir', () => {
    const key = findingDraftKey('ex1', 'findings', 'dhR');
    writeDraft(key, draft);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.getItem(key)).not.toBeNull();
    expect(readFindingDraft(key)).toMatchObject({ lat: '4', dur: '17', vertigo: true });
    // Başka muayenenin taslağı karışmaz.
    expect(readFindingDraft(findingDraftKey('ex2', 'findings', 'dhR'))).toBeNull();
    removeFindingDraft(key);
    expect(readFindingDraft(key)).toBeNull();
  });

  it('24 saatten eski taslak geçersiz ve silinir; pruneDrafts eski taslakları temizler, yenilere dokunmaz', () => {
    writeDraft('dengeyol:findingDraft:old:findings:dhR', draft, T - DRAFT_TTL_MS - 1);
    writeDraft('dengeyol:examQueue:old', [1], T - DRAFT_TTL_MS - 1);
    writeDraft('dengeyol:examQueue:new', [1], T - 1000);
    window.localStorage.setItem('dengeyol:v1', '{}');
    pruneDrafts(T);
    expect(window.localStorage.getItem('dengeyol:findingDraft:old:findings:dhR')).toBeNull();
    expect(window.localStorage.getItem('dengeyol:examQueue:old')).toBeNull();
    expect(readDraft('dengeyol:examQueue:new', T)).toEqual([1]);
    expect(window.localStorage.getItem('dengeyol:v1')).toBe('{}');
  });

  it('bozuk ya da zarfsız kayıt yok sayılır', () => {
    window.localStorage.setItem('dengeyol:examQueue:x', '[1,2]');
    expect(readDraft('dengeyol:examQueue:x')).toBeNull();
    window.localStorage.setItem('dengeyol:examQueue:y', '{bozuk');
    expect(readDraft('dengeyol:examQueue:y')).toBeNull();
  });
});
