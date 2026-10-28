// Protokol tablosunu doğrudan koddan üretir → ../docs/PROTOKOL-TABLOSU.md
// Çalıştırma: npm run docs:protocols
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROTOCOLS, resolveProtocol, type ProtocolId } from '../src/core/protocols';

const here = dirname(fileURLToPath(import.meta.url));
const lines: string[] = [];
lines.push('# Protokol tablosu (koddan otomatik üretildi)');
lines.push('');
lines.push('> Bu dosya `npm run docs:protocols` ile `src/core/protocols.ts` dosyasından üretilir; elle düzenlemeyin.');
lines.push('> Açı tanımları: yatar θ (0 = yüz tavana, +90 = sağ kulak altta, −90 = sol kulak altta, ±180 = yüz yere),');
lines.push('> φ (+ = baş geriye sarkık, − = çene göğse); oturur ψ (+ = çene göğse, − = tavana bakış).');
lines.push('> Tüm protokoller SAĞ taraf için gösterilir; sol tarafta θ işareti ters çevrilir.');
lines.push('');
const audience = { yes: 'hasta + klinisyen', prescription: 'klinisyen; hastada yalnız reçeteyle', no: 'yalnız klinisyen' } as const;
for (const id of Object.keys(PROTOCOLS) as ProtocolId[]) {
  const def = PROTOCOLS[id];
  const p = resolveProtocol(id, def.sided ? 'R' : null);
  lines.push(`## ${def.name}`);
  lines.push('');
  lines.push(`- Kanal: ${def.canal} · Tür: ${def.kind === 'test' ? 'test' : 'manevra'} · Kullanım: ${audience[def.patient]}`);
  lines.push(`- Özet: ${def.summary}`);
  lines.push(`- Kanıt notu: ${def.evidenceNote}`);
  lines.push('');
  lines.push('| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |');
  lines.push('|---|---|---|---|---|---|---|');
  p.steps.forEach((s, i) => {
    const t = s.target;
    const target =
      t.kind === 'sitting'
        ? `Oturur, ψ ${t.psiMin}…${t.psiMax}°`
        : `Yatar, θ ${t.theta}° ±${t.thetaTol}°, φ ${t.phiMin}…${t.phiMax}°`;
    const notes = [s.fastTransitionSec ? `hızlı geçiş hedefi ≤${s.fastTransitionSec} s` : '', s.unverifiable ? 'oturur baş dönüşü sensörle doğrulanamaz' : '', s.finding ? `bulgu: ${s.finding}` : '']
      .filter(Boolean)
      .join('; ');
    lines.push(
      `| ${i + 1} | ${s.title} | ${target} | ${s.minHoldSec} s | ${s.afterVertigoSec} s | ${s.maxVertigoSec ?? '—'} ${s.maxVertigoSec ? 's' : ''} | ${notes} |`
    );
  });
  lines.push('');
  lines.push('Kaynaklar:');
  def.sources.forEach((src) => lines.push(`- ${src}`));
  if (def.cautions.length) {
    lines.push('');
    lines.push('Uyarılar:');
    def.cautions.forEach((c) => lines.push(`- ${c}`));
  }
  lines.push('');
}
writeFileSync(join(here, '..', '..', 'docs', 'PROTOKOL-TABLOSU.md'), lines.join('\n'));
console.log('docs/PROTOKOL-TABLOSU.md yazıldı');
