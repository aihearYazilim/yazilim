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
const BASE = 'http://localhost:4173/';

const server = spawn(process.execPath, [join(here, '..', 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', '4173', '--strictPort', ...(process.env.E2E_OUTDIR ? ['--outDir', process.env.E2E_OUTDIR] : [])], {
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
    if (String(b).includes('4173')) {
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

async function newPage(data, opts = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], colorScheme: opts.dark ? 'dark' : 'light' });
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

async function answerRedFlags(page, stopOn = null) {
  for (let i = 0; i < 20; i++) {
    const q = page.getByTestId('redflag-question');
    if (!(await q.isVisible().catch(() => false))) return;
    const id = await q.getAttribute('data-qid');
    // Yanıt düğmeleri her yeni soruda kısa süre kilitli (çift dokunuş koruması)
    await page.locator('.yesno:not([data-locked])').waitFor();
    if (stopOn && id === stopOn) {
      await page.getByTestId('yn-yes').click();
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
  await page.getByRole('radio', { name: /Yatarken ya da yataktan kalkarken/ }).click();
  await page.getByRole('radio', { name: /1 dakikadan kısa/ }).click();
}

/** İki yönlü taraf testi (soru telefondan önce): sol negatif, sağ pozitif → tek dokunuşla sağ tarafa manevra. */
async function sideTestRightPositive(page) {
  await page.getByRole('radio', { name: 'Sağa dönünce' }).click();
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
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-next').click();
  await page.getByRole('radio', { name: 'Evet, tanı kondu' }).click();
  await page.getByRole('radio', { name: /Arka \(posterior\) kanal/ }).click();
  await page.getByRole('radio', { name: 'Sağ kulak' }).click();
  await snap(page, 'kurulum-tani');
  await page.getByTestId('ob-next').click();
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
  await page.getByRole('radio', { name: 'İyiyim' }).click();
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
  await page.getByRole('radio', { name: 'Sağa dönünce' }).click();
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
  await page.getByTestId('yn-yes').click();
  await page.getByTestId('redflag-confirm').waitFor();
  await snap(page, 'yanlis-dokunus-onayi');
  await page.getByTestId('redflag-confirm-back').click();
  if ((await q.getAttribute('data-qid')) !== firstId) throw new Error('yanlış dokunuştan sonra aynı soruya dönülmedi');
  await answerRedFlags(page);
  await answerSubtype(page);
  await page.getByRole('radio', { name: 'Sağa dönünce' }).click();
  await page.getByTestId('prep').waitFor();
  await page.getByRole('button', { name: 'Bir yakınımla' }).click();
  await page.getByTestId('helper-card').waitFor();
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

await step('Hasta: "sırtüstü baş çevirince" yanıtı yatay kanal şüphesiyle hekime yönlendirir', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await answerRedFlags(page);
  await page.getByRole('radio', { name: /Yatakta sağa-sola dönerken/ }).click();
  await page.getByTestId('subtype-hc-confirm').waitFor();
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
