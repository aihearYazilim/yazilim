import { describe, expect, it } from 'vitest';
import { slowerRate } from './Controls';

describe('"Daha yavaş" düğmesi (yeni kullanıcı turu 1, L2-6)', () => {
  it('konuşma hızını Ayarlar\'daki basamaklarla bir basamak düşürür; en yavaşta durur', () => {
    expect(slowerRate(1.15)).toBe(1);
    expect(slowerRate(1)).toBe(0.8);
    expect(slowerRate(0.8)).toBe(0.65);
    expect(slowerRate(0.65)).toBeNull();
  });
});
