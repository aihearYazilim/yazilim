// Uçtan uca testler: `npm run build` sonrası `npm run e2e`.
// Gerçek Chromium, telefon boyutu, demo (sanal) sensör, ×20 zaman hızlandırma.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out');
mkdirSync(out, { recursive: true });
// E2E_PORT: önizleme sunucusunun kapısı (aynı makinede birden çok çalışma yan yana koşabilsin; varsayılan 4173).
const PORT = String(process.env.E2E_PORT || 4173);
const BASE = `http://localhost:${PORT}/`;

const server = spawn(process.execPath, [join(here, '..', 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', PORT, '--strictPort', ...(process.env.E2E_OUTDIR ? ['--outDir', process.env.E2E_OUTDIR] : [])], {
  cwd: join(here, '..'),
  stdio: 'pipe'
});
const stopServer = () => {
  try {
    server.kill('SIGTERM');
  } catch {
    /* yok say */
  }
};
process.on('exit', stopServer);
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('önizleme sunucusu açılmadı')), 20000);
  server.stdout.on('data', (b) => {
    if (String(b).includes(PORT)) {
      clearTimeout(t);
      res();
    }
  });
});

const browser = await chromium.launch();
const results = [];
let shot = 0;

function seed(extra = {}) {
  return {
    version: 1,
    settings: {
      role: null,
      speech: false,
      speechRate: 1,
      haptics: true,
      guidanceTone: false,
      fontScale: 'normal',
      theme: 'auto',
      simulation: true,
      timeScale: 20,
      ...(extra.settings ?? {})
    },
    episodes: [],
    clinician: {},
    clinicPatients: [],
    clinicExams: [],
    ...extra.data
  };
}

/**
 * Sahte Türkçe ses motoru (tarayıcı bağlamına eklenir): her cümle `ms` sürer, kesilirse onerror gelir. Okuma kilidi gibi
 * sese bağlı davranışlar gerçek ses olmadan, belirli sürelerle sınanır.
 */
function fakeSpeech(ms) {
  let cur = null;
  let timer = null;
  const queue = [];
  const voice = { lang: 'tr-TR', name: 'Sahte', localService: true, default: true, voiceURI: 'tr' };
  const next = () => {
    if (cur || !queue.length) return;
    cur = queue.shift();
    timer = setTimeout(() => {
      const u = cur;
      cur = null;
      u.onend?.({});
      next();
    }, ms);
  };
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => [voice],
    addEventListener() {},
    removeEventListener() {},
    speak(u) {
      if (!u.text || !u.text.trim() || u.volume === 0) {
        setTimeout(() => u.onend?.({}), 10);
        return;
      }
      queue.push(u);
      next();
    },
    cancel() {
      if (cur) {
        clearTimeout(timer);
        const u = cur;
        cur = null;
        u.onerror?.({});
      }
      while (queue.length) queue.shift().onerror?.({});
    },
    pause() {},
    resume() {}
  };
  class Utt {
    constructor(text) {
      Object.assign(this, { text, lang: '', voice: null, rate: 1, volume: 1, pitch: 1, onend: null, onerror: null });
    }
    addEventListener() {}
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utt, configurable: true, writable: true });
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
}

async function newPage(data, opts = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], colorScheme: opts.dark ? 'dark' : 'light' });
  // opts.speechMs: bağlamdaki bütün sayfalarda sahte ses motoru (her cümle bu kadar sürer).
  if (opts.speechMs) await ctx.addInitScript(fakeSpeech, opts.speechMs);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  if (data) {
    await page.addInitScript((d) => {
      if (!localStorage.getItem('dengeyol:v1')) localStorage.setItem('dengeyol:v1', JSON.stringify(d));
    }, data);
  }
  return { ctx, page, errors };
}

async function snap(page, name) {
  shot++;
  await page.screenshot({ path: join(out, `${String(shot).padStart(2, '0')}-${name}.png`), fullPage: false });
}

async function step(name, fn) {
  // E2E_ONLY="metin": yalnız adı bu metni içeren senaryolar (hata ayıklama).
  if (process.env.E2E_ONLY && !name.includes(process.env.E2E_ONLY)) return;
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log('✓', name, `(${Math.round((Date.now() - t0) / 1000)} s)`);
  } catch (e) {
    results.push({ name, ok: false, err: String(e) });
    console.log('✗', name, '\n   ', String(e).split('\n').slice(0, 6).join('\n    '));
  }
}

/** Yeni soru/onay ekranında düğmeler kısa süre kilitli (çift dokunuş koruması): kilit kalkana dek bekle. */
async function unlocked(page) {
  await page.waitForFunction(() => !document.querySelector('[data-locked]'));
}

/** Seçenekli soru ekranında (kilit kalkınca) bir seçeneğe dokunur. */
async function clickChoice(page, name) {
  const radio = page.getByRole('radio', { name });
  await radio.waitFor();
  await unlocked(page);
  await radio.click();
}

async function answerRedFlags(page, stopOn = null) {
  for (let i = 0; i < 20; i++) {
    const q = page.getByTestId('redflag-question');
    if (!(await q.isVisible().catch(() => false))) return;
    const id = await q.getAttribute('data-qid');
    // Yanıt düğmeleri her yeni soruda kısa süre kilitli (çift dokunuş koruması)
    await page.locator('.yesno:not([data-locked])').waitFor();
    if (stopOn && id === stopOn) {
      await page.getByTestId('yn-yes').click();
      await unlocked(page);
      await page.getByTestId('redflag-confirm-yes').click();
      return;
    }
    // Her soruda güvenli yanıt "Hayır, yok"
    await page.getByTestId('yn-no').click();
    await page.waitForFunction((prev) => {
      const el = document.querySelector('[data-testid="redflag-question"]');
      return !el || el.getAttribute('data-qid') !== prev;
    }, id);
  }
}

/** Yeni atakta alt tip soruları (arka kanala uyan yanıtlar). */
async function answerSubtype(page) {
  await clickChoice(page, /Yatarken ya da yataktan kalkarken/);
  await clickChoice(page, /1 dakikadan kısa/);
}

/** İki yönlü taraf testi (soru telefondan önce): sol negatif, sağ pozitif → tek dokunuşla sağ tarafa manevra. */
async function sideTestRightPositive(page) {
  await clickChoice(page, 'Sağ yanıma yatınca');
  await calibrate(page);
  await driveRunner(page);
  await page.locator('[data-testid="rest-continue"]:not([disabled])').click({ timeout: 15000 });
  await driveRunner(page, { markVertigoAtStep: 1, vertigoSec: 0.8 });
  // Karar: sağ → telefon alında, tek dokunuşla manevraya geçiş
  await page.getByTestId('chain-continue').click({ timeout: 15000 });
}

async function calibrate(page) {
  // Kayıtlı kalibrasyon varsa tanıtma ekranı atlanır (telefon her başlatmada yeniden yerleştirilir).
  await page.locator('[data-testid="prep-ready"], [data-testid="cal-start"], [data-testid="runner-ready"], [role="radio"]').first().waitFor({ timeout: 15000 });
  if (await page.getByTestId('prep-ready').isVisible().catch(() => false)) {
    await page.getByTestId('prep-ready').click();
    await page.locator('[data-testid="cal-start"], [data-testid="runner-ready"], [data-testid="runner"]').first().waitFor({ timeout: 15000 });
  }
  if (!(await page.getByTestId('cal-start').isVisible().catch(() => false))) return;
  await page.getByTestId('cal-start').click();
  await page.getByTestId('cal-ok').waitFor({ timeout: 40000 }).catch(async (e) => {
    await snap(page, 'hata-kalibrasyon');
    throw e;
  });
  // Hasta modunda kendiliğinden devam eder (dokunulmaz: gerçek kullanımda telefon alındadır); klinisyende "Devam" gerekir.
  const clinician = await page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')).settings.role === 'clinician');
  if (clinician) await page.getByTestId('cal-continue').click();
}

/** Yürütücüyü sanal başla hedeften hedefe götürerek tamamlar. */
async function driveRunner(page, { markVertigoAtStep = null, vertigoSec = 0.6, timeout = 120000, onStep } = {}) {
  // Zincirdeki (telefon alından inmeden) test/manevra kendiliğinden başlar; Başlat düğmesi yoktur.
  await page.locator('[data-testid="runner-start"], [data-testid="runner"]').first().waitFor({ timeout: 30000 });
  if (await page.getByTestId('runner-start').isVisible().catch(() => false)) await page.getByTestId('runner-start').click();
  await page.getByTestId('runner').waitFor({ timeout: 30000 });
  if (!(await page.getByTestId('sim-panel').isVisible().catch(() => false))) await page.getByTestId('sim-open').click();
  const t0 = Date.now();
  let lastStep = -1;
  let marked = false;
  while (Date.now() - t0 < timeout) {
    const runner = page.getByTestId('runner');
    if (!(await runner.isVisible().catch(() => false))) return;
    const st = Number(await runner.getAttribute('data-step'));
    const phase = await runner.getAttribute('data-phase');
    if (phase === 'done' || phase === 'aborted' || phase === 'safetyStop') {
      await page.waitForTimeout(1600);
      if (await page.getByTestId('sim-panel').isVisible().catch(() => false)) throw new Error('demo paneli yürütücü bitince kapanmadı');
      return phase;
    }
    if (st !== lastStep && phase !== 'between') {
      lastStep = st;
      if (onStep) await onStep(st);
      await page.getByTestId('sim-goto').click();
    }
    if (markVertigoAtStep === st && !marked && phase === 'holding') {
      marked = true;
      await page.getByTestId('vertigo-pad').click();
      await page.waitForTimeout(vertigoSec * 1000);
      await page.getByTestId('vertigo-pad').click();
    }
    await page.waitForTimeout(150);
  }
  throw new Error('yürütücü zaman aşımı');
}

// ------------------------------------------------------------------------------------------------
await step('Hasta: kurulum → kırmızı bayrak → kalibrasyon → Epley → 1 saat tekrar testi → rapor', async () => {
  const { ctx, page, errors } = await newPage(seed());
  await page.goto(BASE);
  await snap(page, 'karsilama');
  await page.getByTestId('role-patient').click();
  await snap(page, 'kurulum-1');
  // Onam: yan etkiler ve seçenekler katlanabilir (kapalı gelir), acil kartı görünür (kullanıcı turu 3, k03).
  if ((await page.locator('[data-testid="ob-risks"] details[open]').count()) !== 0) throw new Error('onamda yan etkiler kutusu açık geliyor');
  await page.getByTestId('ob-risks-side-effects').locator('summary').click();
  if (!(await page.getByTestId('ob-risks-side-effects').innerText()).includes('düşebilirsiniz')) throw new Error('yan etkiler açılınca görünmüyor');
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-next').click();
  await page.getByRole('radio', { name: 'Evet, tanı kondu' }).click();
  await page.getByRole('radio', { name: /Arka \(posterior\) kanal/ }).click();
  await page.getByRole('radio', { name: 'Sağ kulak' }).click();
  // Tanı zamanı zorunlu seçim (tarih boşken tanı sessizce "eski" sayılmasın).
  await page.getByRole('radio', { name: 'Son 2 hafta içinde' }).click();
  await snap(page, 'kurulum-tani');
  await page.getByTestId('ob-next').click();
  // Uygunluk listesinde her maddenin başında sesteki kısa ad kalın (k05).
  if ((await page.locator('button[role="checkbox"] strong', { hasText: 'Boyun sorunu:' }).count()) !== 1) throw new Error('uygunluk listesinde kısa ad kalın değil');
  await page.getByTestId('ob-none').click();
  await page.getByTestId('ob-next').click();
  await page.getByTestId('start-episode').waitFor();
  await snap(page, 'hasta-ana');
  await page.getByTestId('start-episode').click();
  await snap(page, 'kirmizi-bayrak');
  await answerRedFlags(page);
  await snap(page, 'alt-tip-sorusu');
  await answerSubtype(page);
  await snap(page, 'taraf-sorusu');
  await sideTestRightPositive(page);
  await snap(page, 'manevra-hazir');
  let shotDone = false;
  const phase = await driveRunner(page, {
    markVertigoAtStep: 1,
    onStep: async (s) => {
      if (s === 2 && !shotDone) {
        shotDone = true;
        await page.waitForTimeout(400);
        await page.getByTestId('sim-goto').click();
        await page.waitForTimeout(600);
        // Kullanıcının göreceği ekran: demo paneli kapalı
        await page.getByTestId('sim-panel').getByRole('button', { name: 'Kapat' }).click();
        await page.waitForTimeout(200);
        await snap(page, 'manevra-adim');
        await page.getByTestId('sim-open').click();
      }
    }
  });
  if (phase !== 'done') throw new Error('manevra tamamlanmadı: ' + phase);
  await clickChoice(page, 'İyiyim');
  await page.getByTestId('end-maneuver-done').waitFor();
  await snap(page, 'manevra-bitti');
  await page.getByTestId('go-home').click();
  await page.getByTestId('active-episode').waitFor();
  await snap(page, 'aktif-atak');
  // 1 saat geçmiş gibi: manevra zamanını geri al
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('dengeyol:v1'));
    const e = d.episodes[0];
    e.maneuvers.forEach((m) => (m.at -= 61 * 60000));
    e.redFlags.forEach((r) => (r.at -= 61 * 60000));
    localStorage.setItem('dengeyol:v1', JSON.stringify(d));
  });
  await page.reload();
  await page.getByTestId('do-retest').click();
  await answerRedFlags(page);
  await calibrate(page);
  const p2 = await driveRunner(page);
  if (p2 !== 'done') throw new Error('tekrar testi tamamlanmadı');
  await page.getByTestId('end-retest-negative').waitFor();
  await snap(page, 'tekrar-test-negatif');
  await page.getByTestId('go-home').click();
  await page.getByRole('button', { name: 'Rapor' }).click();
  await page.getByTestId('episode-report').waitFor();
  const reportText = await page.getByTestId('episode-report').innerText();
  if (!reportText.includes('Epley')) throw new Error('raporda manevra yok');
  if (!/baş dönmesi|Belirti|–/.test(reportText)) throw new Error('raporda belirti işareti yok');
  if (/\b(VERTIGO_TOO_LONG|ATYPICAL_LONG|BOTH_SIDES|SIDE_CONFLICT)\b/.test(reportText)) throw new Error('raporda ham iç kod var');
  await snap(page, 'rapor');
  // Dönem raporu: dönemdeki bütün ataklar, başta tek satır sonuç (k09).
  await page.goto(BASE + '#/hasta/rapor/donem');
  const periodSummary = await page.getByTestId('period-summary').innerText();
  if (!/^\d+ atak · \d+ manevra/.test(periodSummary)) throw new Error('dönem raporu özeti hatalı: ' + periodSummary);
  if ((await page.getByTestId('period-episode').count()) < 1) throw new Error('dönem raporunda atak yok');
  await snap(page, 'donem-raporu');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Hasta: taraf bilinmiyor → iki yönlü semptom testi → sağ tarafa manevra kararı', async () => {
  const data = seed({
    settings: { role: 'patient' },
    data: { patient: { consentAt: new Date().toISOString(), diagnosedByDoctor: true, canal: 'PC', side: 'unknown', contraindications: [] } }
  });
  const { ctx, page, errors } = await newPage(data);
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await answerRedFlags(page);
  await answerSubtype(page);
  await clickChoice(page, 'Sağ yanıma yatınca');
  await snap(page, 'hazirlik');
  await calibrate(page);
  // Önce sol (şüpheli olmayan) test: baş dönmesi yok (tanıtmadan sonra kendiliğinden başlar)
  await driveRunner(page);
  await page.getByTestId('rest-continue').waitFor();
  await snap(page, 'taraf-ara');
  await page.locator('[data-testid="rest-continue"]:not([disabled])').click({ timeout: 15000 });
  // Sonra sağ (telefon alında, kendiliğinden başlar): baş dönmesi işaretle
  await driveRunner(page, { markVertigoAtStep: 1, vertigoSec: 0.8 });
  // Karar: sağ tarafa manevra → tek dokunuşla geçiş ekranı
  const gate = page.getByTestId('chain-continue');
  await gate.waitFor({ timeout: 15000 });
  const txt = await gate.innerText();
  if (!/sağ/i.test(txt)) throw new Error('sağ taraf beklenirdi: ' + txt);
  await snap(page, 'taraf-karari-gecis');
  await gate.click();
  await page.getByTestId('runner').waitFor({ timeout: 20000 });
  const step = await page.getByTestId('runner').getAttribute('data-step');
  if (step !== '0') throw new Error('Epley ilk adımı bekleniyordu');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Hasta: acil kırmızı bayrak → durdurma ve 112 ekranı', async () => {
  const data = seed({
    settings: { role: 'patient' },
    data: { patient: { consentAt: new Date().toISOString(), diagnosedByDoctor: true, canal: 'PC', side: 'R', contraindications: [] } }
  });
  const { ctx, page, errors } = await newPage(data);
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await answerRedFlags(page, 'neuro');
  await page.getByTestId('stop-emergency').waitFor();
  const tel = await page.locator('a[href="tel:112"]').count();
  if (tel < 1) throw new Error('112 bağlantısı yok');
  await snap(page, 'acil-durdurma');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Hasta: tanısız ilk atak → manevralar kilitli', async () => {
  const { ctx, page } = await newPage(seed({ settings: { role: 'patient' } }));
  await page.goto(BASE + '#/hasta/kurulum');
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-next').click();
  await page.getByRole('radio', { name: 'Hayır / emin değilim' }).click();
  await page.getByTestId('ob-next').click();
  await page.getByTestId('ob-none').click();
  await page.getByTestId('ob-next').click();
  await page.getByTestId('ob-gate-blocked').waitFor();
  // Tanısız kapı ekranında da aciliyet kartı (ana ekrandakiyle aynı).
  await page.getByTestId('urgency-ladder').waitFor();
  await snap(page, 'kilit-tanisiz');
  await ctx.close();
});

const PATIENT_OK = {
  consentAt: '2026-01-01T00:00:00.000Z',
  contraindications: [],
  diagnosedByDoctor: true,
  canal: 'PC',
  side: 'R'
};

await step('Hasta: hekime yönlendirilen ataktan sonra yeni atak onay ister; deneme günlük sınırı', async () => {
  const now = Date.now();
  const referred = {
    id: 'old', startedAt: now - 7200e3, endedAt: now - 3600e3, side: 'R', protocolId: 'epley', redFlags: [], sideTests: [],
    maneuvers: [], retests: [], status: 'referred', endNote: 'ATYPICAL_LONG'
  };
  const { ctx, page, errors } = await newPage(
    seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [referred], practiceLog: [now - 60e3, now - 30e3] } })
  );
  await page.goto(BASE + '#/hasta/atak/start');
  await page.getByTestId('blocked-referral').waitFor();
  await snap(page, 'yonlendirme-kilidi');
  await page.getByTestId('doctor-cleared').click();
  await page.getByTestId('doctor-cleared-yes').click();
  await page.getByTestId('redflag-question').waitFor();
  await page.goto(BASE + '#/hasta');
  await page.goto(BASE + '#/hasta/atak/practice');
  await page.getByTestId('blocked-practice').waitFor();
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Kullanılabilirlik: yanlış dokunuş onayı, yardımcı kartı, ekranı çevir, ekrana dokunarak işaret', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient', timeScale: 5 }, data: { patient: PATIENT_OK } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  // İlk soruya yanlışlıkla "Evet" → onay ekranı → "Yanlış dokundum" → aynı soru
  const q = page.getByTestId('redflag-question');
  const firstId = await q.getAttribute('data-qid');
  await page.locator('.yesno:not([data-locked])').waitFor();
  const tapBox = await page.getByTestId('yn-yes').boundingBox();
  await page.getByTestId('yn-yes').click();
  await page.getByTestId('redflag-confirm').waitFor();
  await snap(page, 'yanlis-dokunus-onayi');
  await unlocked(page);
  // Tur 3 (k05, k06): yanıt kartının başlığında yanıt; "Evet, doğru" dokunulan yerle çakışmaz, "Yanlış dokundum" oradadır.
  if (!/— doğru mu\?$/.test((await page.getByTestId('redflag-confirm-title').innerText()).trim())) throw new Error('onay başlığında yanıt yok');
  const yesBox = await page.getByTestId('redflag-confirm-yes').boundingBox();
  if (tapBox && yesBox && yesBox.y < tapBox.y + tapBox.height && tapBox.y < yesBox.y + yesBox.height) throw new Error('"Evet, doğru" dokunulan yerin üstünde');
  await page.getByTestId('redflag-confirm-back').click();
  if ((await q.getAttribute('data-qid')) !== firstId) throw new Error('yanlış dokunuştan sonra aynı soruya dönülmedi');
  await answerRedFlags(page);
  await answerSubtype(page);
  await clickChoice(page, 'Sağ yanıma yatınca');
  await page.getByTestId('prep').waitFor();
  await page.getByRole('button', { name: 'Bir yakınımla' }).click();
  await page.getByTestId('helper-card').waitFor();
  // Tur 3: yakını modunda hazırlık maddeleri yardımcıya göre; "Titreşimleri tanı" hazırlıkta açılır (k02, k04).
  if (!/Hastayı yatağın üzerine oturtun/.test(await page.getByTestId('prep').innerText())) throw new Error('hazırlık maddeleri yakını diline geçmedi');
  await page.getByTestId('prep-haptic-legend').waitFor();
  await snap(page, 'yardimci-hazirlik');
  await calibrate(page);
  await page.getByTestId('runner').waitFor({ timeout: 30000 });
  // Pozisyon aranırken düzeltme yönü ekranda yazılı (demo başı oturur durumda: "Şimdi yatın" vb.)
  await page.getByTestId('runner-hint').waitFor({ timeout: 20000 });
  await page.getByTestId('runner-flip').click();
  if (!(await page.getByTestId('runner').evaluate((el) => el.classList.contains('flipped')))) throw new Error('ekran çevrilmedi');
  await snap(page, 'yardimci-ekran-cevrik');
  await page.getByTestId('runner-flip').click();
  // Ekranın ortasına (başlık) dokunmak baş dönmesini işaretler
  await page.getByTestId('runner-step-title').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="vertigo-pad"]')?.getAttribute('aria-pressed') === 'true');
  await snap(page, 'ekrana-dokunarak-isaret');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Klinisyen: tanı onaylanmadan reçete kilitli; aynı kod ikinci hasta açmaz', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test' } } }));
  await page.goto(BASE + '#/odyolog');
  await page.getByTestId('clin-new').click();
  await page.getByTestId('clin-code').fill('K-7');
  await page.getByTestId('clin-create').click();
  await page.getByRole('button', { name: 'Reçete' }).click();
  await page.getByTestId('rx-blocked').waitFor();
  await page.goto(BASE + '#/odyolog');
  await page.getByTestId('clin-new').click();
  await page.getByTestId('clin-code').fill('k-7');
  await page.getByTestId('clin-existing').waitFor();
  await page.getByTestId('clin-create').click();
  const n = await page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')).clinicPatients.length);
  if (n !== 1) throw new Error('aynı kodla ikinci hasta kaydı açıldı: ' + n);
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Klinisyen: ≥1 dk bulguda elle "kanalolitiazis" tanısı reçete kilidini açmaz; elle girişte ön seçim yok', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test' } } }));
  await page.goto(BASE + '#/odyolog');
  await page.getByTestId('clin-new').click();
  await page.getByTestId('clin-code').fill('2026-10-30-000123');
  await page.getByTestId('clin-create').click();
  const code = await page.getByTestId('exam-patient-code').innerText();
  if (!code.includes('2026-10-30-000123')) throw new Error('hasta kodu tam görünmüyor: ' + code);
  // Sağ DH elle: hiçbir yanıt önceden seçili değil, Kaydet kapalı
  await page.getByRole('button', { name: 'Elle gir' }).nth(0).click();
  await page.getByTestId('finding-form').waitFor();
  if (await page.getByTestId('finding-save').isEnabled()) throw new Error('elle girişte seçim yapılmadan Kaydet etkin');
  await page.getByRole('radio', { name: 'Yukarı vuran + torsiyonel' }).click();
  await page.locator('#lat').fill('1');
  await page.locator('#dur').fill('75');
  await page.getByTestId('finding-save').click();
  await page.getByRole('button', { name: 'Elle gir' }).nth(1).click();
  await page.getByRole('radio', { name: 'Yok' }).click();
  await page.getByTestId('finding-save').click();
  await page.getByRole('button', { name: 'Tanı', exact: true }).click();
  await page.getByRole('button', { name: 'Tanıyı elle gir' }).click();
  await page.getByRole('radio', { name: 'Arka kanal' }).click();
  await page.getByRole('button', { name: 'Sağ', exact: true }).click();
  await page.getByRole('button', { name: 'Kanalolitiazis', exact: true }).click();
  await page.getByTestId('dx-manual-lock').waitFor();
  await page.getByTestId('dx-manual-save').click();
  await page.getByRole('button', { name: 'Reçete', exact: true }).click();
  await page.getByTestId('rx-blocked').waitFor();
  if (await page.getByTestId('rx-make').count()) throw new Error('≥1 dk bulguda reçete formu açıldı');
  await snap(page, 'odyolog-kupulo-kilidi');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Hasta: "sırtüstü baş çevirince" yanıtı yatay kanal şüphesiyle hekime yönlendirir', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await answerRedFlags(page);
  await clickChoice(page, /Sırtüstü yatarken sağa-sola/);
  await page.getByTestId('subtype-hc-confirm').waitFor();
  await unlocked(page);
  await page.getByTestId('subtype-hc-yes').click();
  await page.getByTestId('end-refer').waitFor();
  await snap(page, 'alt-tip-yatay-kanal');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

let rxUrl = null;
await step('Odyolog: muayene → Dix-Hallpike (sensörlü) → tanı → Epley → QR reçete', async () => {
  const { ctx, page, errors } = await newPage(seed());
  await page.goto(BASE);
  await page.getByTestId('role-clinician').click();
  await page.locator('#cn').fill('Odyolog Test Kullanıcı');
  await page.locator('#cc').fill('Örnek Kliniği');
  // Profildeki gözlem yöntemi bulgu formunda hazır gelir (k08 tur 2).
  await page.getByTestId('clin-method').getByRole('button', { name: 'Frenzel' }).click();
  await page.getByTestId('clin-save-profile').click();
  await snap(page, 'odyolog-ana');
  await page.getByTestId('clin-new').click();
  await page.getByTestId('clin-code').fill('P-001');
  await page.getByTestId('clin-create').click();
  await snap(page, 'muayene-testler');
  await page.getByTestId('test-run-dhR').click();
  await calibrate(page);
  await page.getByTestId('runner-ready').waitFor();
  let numShot = false;
  await driveRunner(page, {
    markVertigoAtStep: 1,
    vertigoSec: 0.5,
    onStep: async (s) => {
      if (s === 1 && !numShot) {
        numShot = true;
        await page.getByTestId('sim-goto').click();
        await page.waitForTimeout(700);
        await snap(page, 'odyolog-dix-hallpike');
      }
    }
  });
  await page.getByTestId('finding-form').waitFor();
  const methodPressed = await page
    .getByRole('group', { name: 'Gözlem yöntemi', exact: true })
    .getByRole('button', { name: 'Frenzel' })
    .getAttribute('aria-pressed');
  if (methodPressed !== 'true') throw new Error('profildeki gözlem yöntemi bulgu formunda hazır gelmedi');
  await page.getByRole('radio', { name: 'Yukarı vuran + torsiyonel' }).click();
  await page.locator('#dur').fill('20');
  await snap(page, 'bulgu-formu');
  await page.getByTestId('finding-save').click();
  // Sol DH elle: negatif
  await page.getByRole('button', { name: 'Elle gir' }).nth(1).click();
  await page.getByRole('radio', { name: 'Yok' }).click();
  await page.getByTestId('finding-save').click();
  await page.getByRole('button', { name: 'Tanı' }).click();
  await page.getByTestId('dx-suggestion').first().waitFor();
  const dxText = await page.getByTestId('dx-suggestion').first().innerText();
  if (!/Sağ arka kanal/.test(dxText)) throw new Error('tanı önerisi beklenmedik: ' + dxText);
  await snap(page, 'tani-onerisi');
  await page.getByTestId('dx-confirm').first().click();
  await page.getByRole('button', { name: 'Tedaviye geç' }).click();
  await page.getByTestId('treat-run-epley').click();
  await driveRunner(page);
  await page.getByText('Yapılan manevralar').waitFor();
  await page.getByRole('button', { name: 'Reçete' }).click();
  await page.getByTestId('rx-make').click();
  await page.getByTestId('rx-output').waitFor();
  rxUrl = await page.getByTestId('rx-url').inputValue();
  await snap(page, 'recete-qr');
  await page.getByRole('button', { name: 'Rapor' }).click();
  await page.getByTestId('exam-report').waitFor();
  await snap(page, 'muayene-raporu');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Hasta: odyolog reçetesini QR bağlantısıyla içe aktarır', async () => {
  if (!rxUrl) throw new Error('reçete bağlantısı yok');
  const { ctx, page, errors } = await newPage(seed());
  await page.goto(rxUrl);
  await page.getByTestId('rx-card').waitFor();
  const t = await page.getByTestId('rx-card').innerText();
  if (!t.includes('SAĞ') || !t.includes('Epley') || !t.includes('Odyolog Test Kullanıcı')) throw new Error('reçete içeriği hatalı: ' + t);
  await page.getByTestId('rx-unsigned').waitFor();
  // Geçerlilik tek anlamlı: son geçerli gün "(dahil)".
  if (!(await page.getByTestId('rx-valid-until').innerText()).includes('(dahil)')) throw new Error('reçete geçerliliği "(dahil)" yazmıyor');
  await snap(page, 'recete-ice-aktar');
  await page.getByTestId('rx-accept').click();
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-next').click();
  // Reçete varken tanı adımı atlanır
  await page.getByTestId('ob-none').click();
  await page.getByTestId('ob-next').click();
  await page.getByTestId('start-episode').waitFor();
  const home = await page.locator('main').innerText();
  if (!home.includes('Reçete')) throw new Error('ana ekranda reçete yok');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Bozuk reçete bağlantısı reddedilir', async () => {
  const { ctx, page } = await newPage(seed());
  const bad = rxUrl.replace(/\.([0-9a-f]{8})$/, '.00000000');
  await page.goto(bad);
  await page.getByTestId('rx-error').waitFor();
  await ctx.close();
});

/** core/reportShare.ts v1 biçiminde ev dönemi raporu bağlantısı (gövde base64url JSON; sağlama toplamı FNV-1a("E" + gövde)). */
function homeReportToken(wire) {
  const body = Buffer.from(JSON.stringify(wire), 'utf8').toString('base64url');
  let h = 0x811c9dc5;
  for (const b of Buffer.from('E' + body, 'utf8')) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${body}.${h.toString(16).padStart(8, '0')}`;
}

await step('Klinisyen: hastanın ev dönemi raporu QR bağlantısıyla aynı hasta koduna "ev dönemi" olarak eklenir', async () => {
  const now = Date.now();
  const m = (t) => Math.floor(t / 60000);
  const start = now - 2 * 24 * 3600 * 1000;
  const wire = {
    v: 1,
    g: m(now),
    p: 'NO-2611',
    c: '83635d6f',
    r: ['2026-10-31', 'R', 'e', 3, 5],
    a: m(start),
    b: m(now),
    e: [
      {
        s: m(start),
        z: 60 * 23,
        u: 'r',
        d: 'R',
        t: [[5, [1, 3, 20], [0, null, null], 'TR']],
        m: [[10, 's', 'R', 'chn', 1, 4, [[5, 0], [60, 6, 41, 2, 15], [60, 8], [30, 32]]]],
        q: [[60 * 22, 'm', 'R', 0, null, null]]
      }
    ]
  };
  const token = homeReportToken(wire);
  const data = seed({
    settings: { role: 'clinician' },
    data: {
      clinician: { name: 'Dr. Test' },
      clinicPatients: [{ id: 'p1', code: 'NO-2611', sex: '-', createdAt: start - 86400000 }],
      clinicExams: [{ id: 'x1', patientId: 'p1', at: start - 86400000, findings: {}, maneuvers: [], retestFindings: {} }]
    }
  });
  const { ctx, page, errors } = await newPage(data);
  await page.goto(BASE + '#/odyolog/ev-raporu/' + token);
  await page.getByTestId('hr-report').waitFor();
  const head = await page.getByTestId('hr-report-headline').innerText();
  if (!head.includes('1 atak') || !head.includes('1 manevra (1 tamamlandı)')) throw new Error('rapor özeti hatalı: ' + head);
  const steps = await page.getByTestId('hr-report-steps').innerText();
  if (!steps.includes('komuttan önce hareket') || !steps.includes('oturuştan geçilmedi') || !steps.includes('hedef sınırında')) {
    throw new Error('adım işaretleri yok: ' + steps);
  }
  if ((await page.getByTestId('hr-patient').inputValue()) !== 'p1') throw new Error('aynı kodlu hasta seçili gelmedi');
  await snap(page, 'ev-raporu-ice-aktar');
  await page.getByTestId('hr-attach').click();
  await page.getByTestId('report-home').waitFor();
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')));
  const added = st.clinicExams.filter((e) => e.homeReports?.length);
  if (st.clinicPatients.length !== 1 || st.clinicExams.length !== 2 || added.length !== 1 || added[0].patientId !== 'p1') {
    throw new Error('ev dönemi yeni kontrol muayenesine eklenmedi');
  }
  await snap(page, 'ev-raporu-muayenede');
  // Aynı rapor ikinci kez eklenmez.
  await page.goto(BASE + '#/odyolog/ev-raporu/' + token);
  await page.getByTestId('hr-already').waitFor();
  // Bozuk bağlantı reddedilir.
  await page.goto(BASE + '#/odyolog/ev-raporu/' + token.replace(/\.([0-9a-f]{8})$/, '.00000000'));
  await page.getByTestId('hr-error').waitFor();
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Klinisyen: kayıtsız tarayıcıda rapor bağlantısı kopyalama yönergesi; reçete bağlantısı yapıştırılınca açık mesaj; ses kipi profilde', async () => {
  const now = Date.now();
  const m = (t) => Math.floor(t / 60000);
  const token = homeReportToken({ v: 1, g: m(now), p: 'NO-77', a: m(now - 3600e3), b: m(now), e: [{ s: m(now - 3600e3), u: 'a', t: [], m: [], q: [] }] });
  // 1) Klinisyen kaydı olmayan tarayıcı (iPhone'da QR Safari'de açılır): önce "kopyalayıp uygulamaya yapıştırın" yolu (k08).
  const a = await newPage(seed());
  await a.page.goto(BASE + '#/odyolog/ev-raporu/' + token);
  await a.page.getByTestId('hr-report').waitFor();
  const hint = await a.page.getByTestId('hr-copy-hint').innerText();
  if (!hint.includes('ana ekrandan') || !hint.includes('Hastanın ev raporu')) throw new Error('kopyalama yönergesi yok: ' + hint);
  await a.page.getByTestId('hr-copy-link').waitFor();
  await a.page.getByTestId('hr-become-clinician').waitFor();
  await snap(a.page, 'ev-raporu-kayitsiz-tarayici');
  if (a.errors.length) throw new Error('konsol hataları: ' + a.errors.join(' | '));
  await a.ctx.close();
  // 2) Klinisyen ana ekranı: reçete bağlantısı rapor alanına yapıştırılınca "ev reçetesi bağlantısı" denir (k09).
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test' } } }));
  await page.goto(BASE + '#/odyolog');
  await page.getByTestId('clin-home-report').locator('summary').click();
  await page.getByTestId('hr-paste').fill('https://ornek.app/#/recete/AbC_d-1.0123abcd');
  await page.getByTestId('hr-paste-open').click();
  const rxErr = page.getByTestId('hr-paste-error');
  if ((await rxErr.getAttribute('data-kind')) !== 'rx' || !(await rxErr.innerText()).includes('ev reçetesi bağlantısı')) {
    throw new Error('reçete bağlantısı tanınmadı: ' + (await rxErr.innerText()));
  }
  await page.getByTestId('hr-paste').fill('merhaba');
  await page.getByTestId('hr-paste-open').click();
  if ((await page.getByTestId('hr-paste-error').getAttribute('data-kind')) !== 'other') throw new Error('serbest metin reçete sanıldı');
  // 3) Ses kipi klinisyen profilinde: yürütücüdeki ayarın aynısı (k08).
  await page.getByTestId('clin-edit-profile').click();
  await page.getByTestId('clin-voice').getByRole('button', { name: 'Kapalı' }).click();
  await page.getByTestId('clin-save-profile').click();
  const voice = await page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')).settings.clinicianVoice);
  if (voice !== 'off') throw new Error('ses kipi kaydedilmedi: ' + voice);
  if (!(await page.locator('main').innerText()).includes('ses: kapalı')) throw new Error('profil özetinde ses kipi yok');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

// ------------------------------------------------------------------------------------------------
// 2. ve 3. turda düzelen davranışlar (kullanıcı turu 4, k06): gerilemeye karşı uçtan uca kilit. Hızlı ve belirlenimci:
// tohumlanmış atak (güvenlik soruları ve taraf testi yapılmış) doğrudan manevraya götürür; demo sensör, ×20 zaman.

const MIN = 60000;

/** `minutesAgo` dakika önce tamamlanmış sağ Epley kaydı (birkaç dakika: gece yarısına yakın koşuda gün değişmesin). */
function maneuverAgo(id, minutesAgo, extra = {}) {
  return {
    id,
    at: Date.now() - minutesAgo * MIN,
    protocolId: 'epley',
    side: 'R',
    completed: true,
    stopReason: null,
    records: [],
    manual: false,
    afterSymptoms: 'none',
    ...extra
  };
}

/** Taraf testi bitmiş (sağ), güvenlik soruları az önce yanıtlanmış, manevrası yapılmamış aktif atak. */
function readyEpisode(id = 'act') {
  const t = Date.now() - 10 * MIN;
  return { id, startedAt: t, side: 'R', protocolId: 'epley', redFlags: [{ at: t, answers: {}, stopped: false }], sideTests: [], maneuvers: [], retests: [], status: 'active' };
}

/** Ana ekran → "Ataka devam et" → hazırlık → tanıtma; ardından sağ Epley kendiliğinden başlar. */
async function toManeuver(page) {
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('continue-episode').click();
  await page.getByTestId('prep').waitFor();
  await calibrate(page);
}

const storeOf = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')));

/** Yürütücü belirtilen faza gelene (ya da ekrandan kalkana: gone) dek bekler. */
async function waitPhase(page, phases, timeout = 15000) {
  await page.waitForFunction(
    (ps) => {
      const r = document.querySelector('[data-testid="runner"]');
      return r ? ps.includes(r.getAttribute('data-phase')) : ps.includes('gone');
    },
    phases,
    { timeout }
  );
}

await step('Tur 2–3 kilidi: "Şu an nasılsınız?" ekranında aynı yere kör dokunuşlar acil kaydı açmaz', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await toManeuver(page);
  const phase = await driveRunner(page);
  if (phase !== 'done') throw new Error('manevra tamamlanmadı: ' + phase);
  // "Yeni belirti var" seçeneğinin ekrandaki yeri: telefonu alından alan kişi hep aynı yere dokunuyor.
  const neuro = page.getByRole('radio', { name: /Yeni belirti var/ });
  await neuro.waitFor();
  const b = await neuro.boundingBox();
  const p = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  let sawConfirm = false;
  // Çift dokunuşlar (120 ms) ve aralı dokunuşlar: açılış kilidi, onay ekranının kilidi ve "Yanlış dokundum"un yeri.
  for (const wait of [0, 120, 1100, 120, 1000, 120, 1100, 120]) {
    if (wait) await page.waitForTimeout(wait);
    await page.mouse.click(p.x, p.y);
    if (await page.getByTestId('after-confirm').isVisible().catch(() => false)) {
      sawConfirm = true;
      // Başlıkta yanıt; "Evet, doğru" dokunulan yerde değil, "Yanlış dokundum" orada.
      const title = await page.getByTestId('after-confirm-title').innerText();
      if (!/Yeni belirti var — doğru mu\?/.test(title)) throw new Error('onay başlığında yanıt yok: ' + title);
      const yes = await page.getByTestId('after-confirm-yes').boundingBox();
      if (yes && p.y >= yes.y && p.y <= yes.y + yes.height) throw new Error('"Evet, doğru" kör dokunuşun yerinde');
      const back = await page.getByTestId('after-confirm-back').boundingBox();
      if (!back || p.y < back.y || p.y > back.y + back.height) throw new Error('"Yanlış dokundum" kör dokunuşun yerinde değil');
    }
    const ep = (await storeOf(page)).episodes.find((e) => e.id === 'act');
    if (ep.status !== 'active' || ep.maneuvers.some((m) => m.afterSymptoms === 'neuro')) throw new Error('kör dokunuş acil kaydı açtı: ' + ep.status);
    if (await page.locator('a[href="tel:112"]').count()) throw new Error('kör dokunuş 112 ekranını açtı');
  }
  if (!sawConfirm) throw new Error('dokunuş "Yeni belirti var"a hiç denk gelmedi (sınama geçersiz)');
  await snap(page, 'kor-dokunus-sonrasi');
  // Bilinçli yanıt yine çalışır: onaydaysa geri dön, "İyiyim".
  if (await page.getByTestId('after-confirm').isVisible().catch(() => false)) {
    await unlocked(page);
    await page.getByTestId('after-confirm-back').click();
  }
  await clickChoice(page, 'İyiyim');
  await page.getByTestId('end-maneuver-done').waitFor();
  const ep = (await storeOf(page)).episodes.find((e) => e.id === 'act');
  if (ep.status !== 'active' || ep.maneuvers.at(-1)?.afterSymptoms !== 'none') throw new Error('"İyiyim" kaydedilmedi');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Tur 2–3 kilidi: aynı gün manevrayla kapatılan atak yeniden açılır; 1 saatlik tekrar testi korunur, adresle manevra açılmaz', async () => {
  const now = Date.now();
  const closed = {
    ...readyEpisode('today'),
    startedAt: now - 8 * MIN,
    maneuvers: [maneuverAgo('m1', 4)],
    status: 'closed',
    endedAt: now - MIN,
    endNote: 'Kullanıcı kapattı'
  };
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [closed] } }));
  await page.goto(BASE + '#/hasta');
  const start = page.getByTestId('start-episode');
  if (!(await start.innerText()).includes('Bugünkü atağınıza devam edilir')) throw new Error('ana ekran yeniden açmayı söylemiyor');
  await start.click();
  const plan = page.getByTestId('end-plan');
  await plan.waitFor();
  const t = await plan.innerText();
  if (!t.includes('yeni atak açılmaz') || !/tekrar testi/.test(t)) throw new Error('plan ekranı beklenmedik: ' + t);
  if (await page.getByTestId('redflag-question').count()) throw new Error('yeniden açmada güvenlik soruları soruldu');
  let st = await storeOf(page);
  if (st.episodes.length !== 1 || st.episodes[0].status !== 'active' || st.episodes[0].endedAt) throw new Error('aynı atak yeniden açılmadı');
  // Ana ekran: aynı atak, tekrar testi saati (henüz hazır değil).
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('active-episode').waitFor();
  if (await page.getByTestId('do-retest').count()) throw new Error('1 saat dolmadan tekrar testi açıldı');
  if (!(await page.getByTestId('active-episode').innerText()).includes('Test saati')) throw new Error('tekrar testi saati yok');
  // Adresle "treat"/"start": manevra ya da test açılmaz, sıradaki adım söylenir.
  for (const mode of ['treat', 'start']) {
    await page.goto(BASE + '#/hasta/atak/' + mode);
    await page.getByTestId('end-plan').waitFor();
    if ((await page.getByTestId('prep').count()) || (await page.getByTestId('runner').count())) throw new Error(`#/hasta/atak/${mode} manevra açtı`);
  }
  st = await storeOf(page);
  if (st.episodes.length !== 1 || st.episodes[0].maneuvers.length !== 1) throw new Error('yeni atak ya da manevra kaydı açıldı');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Tur 2–3 kilidi: günlük sınır doluyken ana ekranda sınır kartı; aktif atakta "Manevrayı tekrarla" yok', async () => {
  const now = Date.now();
  // a) Bugün 3 manevrayla kapatılmış atak: büyük düğme yerine sınır kartı ve sonraki izinli zaman.
  const closed = {
    ...readyEpisode('today'),
    startedAt: now - 12 * MIN,
    maneuvers: [maneuverAgo('m1', 7), maneuverAgo('m2', 5), maneuverAgo('m3', 3)],
    status: 'closed',
    endedAt: now - MIN,
    endNote: 'Kullanıcı kapattı'
  };
  const a = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [closed] } }));
  await a.page.goto(BASE + '#/hasta');
  const card = await a.page.getByTestId('home-dose-limit').innerText();
  if (!card.includes('Bugünlük manevra sınırı doldu') || !card.includes('Bir sonraki manevra en erken')) throw new Error('sınır kartı eksik: ' + card);
  if (await a.page.getByTestId('start-episode').count()) throw new Error('sınır doluyken "Baş dönmem başladı" görünüyor');
  await snap(a.page, 'sinir-karti');
  // Adresle de güvenlik soruları sordurulmaz, manevra açılmaz.
  await a.page.goto(BASE + '#/hasta/atak/start');
  await a.page.locator('[data-testid="end-plan"], [data-testid="end-dose"]').first().waitFor();
  if ((await a.page.getByTestId('redflag-question').count()) || (await a.page.getByTestId('prep').count())) throw new Error('sınır doluyken akış açıldı');
  if (a.errors.length) throw new Error('konsol hataları: ' + a.errors.join(' | '));
  await a.ctx.close();
  // b) Aktif atak: bugün 3 manevra, tekrar testi pozitif → yeniden manevra düğmesi yerine sınır metni.
  const active = {
    ...readyEpisode('act'),
    maneuvers: [maneuverAgo('m1', 7), maneuverAgo('m2', 5), maneuverAgo('m3', 3)],
    retests: [{ at: now - MIN, kind: 'early', side: 'R', vertigo: true, latencySec: 2, durationSec: 15 }]
  };
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [active] } }));
  await page.goto(BASE + '#/hasta');
  const home = await page.getByTestId('active-episode').innerText();
  if (await page.getByTestId('do-treat').count()) throw new Error('sınır doluyken "Manevrayı tekrarla" görünüyor');
  if (!home.includes('Bugün için önerilen en fazla manevra')) throw new Error('aktif atakta sınır metni yok');
  await page.goto(BASE + '#/hasta/atak/treat');
  const end = page.getByTestId('end-dose');
  await end.waitFor();
  if (!(await end.innerText()).includes('Bugün için önerilen en fazla manevra')) throw new Error('adresle sınır metni yok');
  if ((await page.getByTestId('prep').count()) || (await page.getByTestId('redflag-question').count())) throw new Error('#/hasta/atak/treat sınırda akış açtı');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Tur 2–3 kilidi: okuma kilidi soru başına hatırlanır (ikinci atakta yanıtlanmış soruda yalnız çift dokunuş kilidi)', async () => {
  // Sahte ses: her cümle 4 s. İlk okunuş kilidi en çok 2,5 s; çift dokunuş kilidi ~0,6 s.
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient', speech: true }, data: { patient: PATIENT_OK } }), { speechMs: 4000 });
  /** Soru göründükten sonra düğmelerin kilitli kaldığı süre (ms). */
  const lockOf = async (pg) => {
    await pg.getByTestId('redflag-question').waitFor();
    const t0 = Date.now();
    await pg.locator('.yesno:not([data-locked])').waitFor({ timeout: 10000 });
    return Date.now() - t0;
  };
  const answerNo = async (pg) => {
    const id = await pg.getByTestId('redflag-question').getAttribute('data-qid');
    await pg.getByTestId('yn-no').click();
    await pg.waitForFunction((prev) => document.querySelector('[data-testid="redflag-question"]')?.getAttribute('data-qid') !== prev, id);
  };
  // 1. atak: ilk iki soru bu cihazda ilk kez soruluyor → okuma kilidi.
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  const first = [];
  for (let i = 0; i < 2; i++) {
    first.push(await lockOf(page));
    await answerNo(page);
  }
  if (first.some((ms) => ms < 1800)) throw new Error('ilk karşılaşmada okuma kilidi yok: ' + first.join(', '));
  const answered = Object.keys((await storeOf(page)).settings.answeredQuestions ?? {});
  if (answered.length !== 2) throw new Error('yanıtlanan sorular hatırlanmadı: ' + answered.join(', '));
  await page.close();
  // 2. atak (aynı cihaz, yeni sayfa): yanıtlanmış iki soruda yalnız kısa kilit; 3. soru hâlâ ilk kez → okuma kilidi.
  const page2 = await ctx.newPage();
  page2.on('pageerror', (e) => errors.push(String(e)));
  await page2.goto(BASE + '#/hasta/atak/start');
  const second = [];
  for (let i = 0; i < 3; i++) {
    second.push(await lockOf(page2));
    await answerNo(page2);
  }
  if (second[0] > 1500 || second[1] > 1500) throw new Error('yanıtlanmış soruda okuma kilidi sürüyor: ' + second.join(', '));
  if (second[0] < 300 || second[1] < 300) throw new Error('çift dokunuş kilidi kalkmış: ' + second.join(', '));
  if (second[2] < 1800) throw new Error('ilk kez sorulan 3. soruda okuma kilidi yok: ' + second.join(', '));
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Tur 2–3 kilidi: duraklatma sayfasında kalıcı seçimler onay ister; kör ikinci dokunuş onaylamaz', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await toManeuver(page);
  await page.locator('[data-testid="runner-start"], [data-testid="runner"]').first().waitFor({ timeout: 30000 });
  if (await page.getByTestId('runner-start').isVisible().catch(() => false)) await page.getByTestId('runner-start').click();
  await page.getByTestId('runner').waitFor();
  // Duraklat (basılı tutulan düğme; klavyeyle hemen).
  await page.getByTestId('runner-pause').press('Enter');
  await waitPhase(page, ['paused']);
  // a) "Kendimi kötü hissediyorum": ilk dokunuş yalnız kurar; aynı yere ikinci dokunuş bir şey yapmaz; "Devam et" sürdürür.
  await page.getByTestId('runner-unwell').click();
  await page.getByTestId('runner-armed-unwell').waitFor();
  if ((await page.getByTestId('runner-confirm').getAttribute('data-choice')) !== 'unwell') throw new Error('onay düğmesi kurulmadı');
  await page.getByTestId('runner-armed-unwell').click();
  await page.waitForTimeout(200);
  if ((await page.getByTestId('runner').getAttribute('data-phase')) !== 'paused') throw new Error('tek dokunuş manevrayı durdurdu');
  await snap(page, 'duraklatma-onay');
  await page.getByTestId('runner-resume').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="runner"]')?.getAttribute('data-phase') !== 'paused');
  if ((await storeOf(page)).episodes[0].maneuvers.length) throw new Error('kurulan ama onaylanmayan seçim kaydedildi');
  // b) "Şimdilik bırak": kur ve hemen onayla (onay penceresinin uzunluğuna bağlı değil) → manevra durur.
  await page.getByTestId('runner-pause').press('Enter');
  await waitPhase(page, ['paused']);
  if (await page.getByTestId('runner-confirm').count()) throw new Error('yeni duraklatmada eski onay duruyor');
  await page.getByTestId('runner-abort').click();
  await page.getByTestId('runner-armed-abort').waitFor();
  await page.getByTestId('runner-confirm').click();
  await waitPhase(page, ['aborted', 'gone']);
  await page.waitForFunction(() => {
    const d = JSON.parse(localStorage.getItem('dengeyol:v1'));
    return d.episodes[0].maneuvers.some((m) => m.stopReason === 'USER_ABORT');
  });
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Tur 2–3 kilidi: Epley 4. adımda karşı yana dönülünce "yanlış taraf" uyarısı; sırtüstünden doğru yana geçilince sürer', async () => {
  // ×10: yanlış yanda kalma sınırı (60 s) gerçek 6 s; uyarıyı görüp düzeltmeye yeter.
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient', timeScale: 10 }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await toManeuver(page);
  let seen = null;
  const phase = await driveRunner(page, {
    onStep: async (s) => {
      if (s !== 3 || seen) return;
      // Sağ Epley 4. adım: hedef sol yan (θ −135°). Sanal baş hastanın SAĞ yanına (θ +100°).
      const theta = page.getByTestId('sim-panel').locator('input[type="range"]').first();
      await theta.fill('100');
      const banner = page.locator('[data-testid="runner-hint"][data-hint="WRONG_SIDE_LEFT"]');
      await banner.waitFor({ timeout: 5000 });
      seen = await banner.innerText();
      await snap(page, 'yanlis-taraf');
      // Önce sırtüstü (uyarı kalkar), sonra driveRunner hedefe (sol yan) götürür.
      await theta.fill('0');
      await page.waitForFunction(() => !/^WRONG_SIDE/.test(document.querySelector('[data-testid="runner-hint"]')?.getAttribute('data-hint') ?? ''), null, { timeout: 5000 });
    }
  });
  if (!seen) throw new Error('4. adıma gelinmedi');
  if (!seen.includes('yanlış taraf') || !seen.includes('SOL')) throw new Error('uyarı metni beklenmedik: ' + seen);
  if (phase !== 'done') throw new Error('yanlış taraftan sonra manevra tamamlanmadı: ' + phase);
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Koyu tema ve büyük yazı ekran görüntüleri', async () => {
  const data = seed({
    settings: { role: 'patient', theme: 'dark', fontScale: 'large' },
    data: { patient: { consentAt: new Date().toISOString(), diagnosedByDoctor: true, canal: 'PC', side: 'L', contraindications: [] } }
  });
  const { ctx, page } = await newPage(data, { dark: true });
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').waitFor();
  await snap(page, 'koyu-hasta-ana');
  await page.goto(BASE + '#/ayarlar');
  await snap(page, 'koyu-ayarlar');
  await ctx.close();
});

await browser.close();
stopServer();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} senaryo geçti. Ekran görüntüleri: ${out}`);
process.exit(failed.length ? 1 : 0);
