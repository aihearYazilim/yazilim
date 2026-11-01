// Uçtan uca testler: `npm run build` sonrası `npm run e2e`.
// Gerçek Chromium, telefon boyutu, demo (sanal) sensör, ×20 zaman hızlandırma.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
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
    resume() {},
    /** Test için: okunan ya da sırada bekleyen cümle var mı? */
    __busy: () => !!cur || queue.length > 0
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
  // E2E_ONLY="metin": yalnız adı bu metni içeren senaryolar (hata ayıklama); "a|b": adı a ya da b'yi içerenler.
  if (process.env.E2E_ONLY && !process.env.E2E_ONLY.split('|').some((t) => name.includes(t))) return;
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

const storeOf = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')));
const kindsOf = (ep) => (ep?.overrides ?? []).map((o) => o.kind);

/**
 * Güvenlik listesi (yeniden tasarım: tek ekran işaret listesi). `check`: işaretlenecek maddeler (rf-<id>); boşsa "Hiçbiri yok,
 * devam". Yanıtı taze olduğu için liste gelmezse (ör. tekrar testi) bir şey yapmaz.
 */
async function answerRedFlags(page, check = []) {
  await page
    .locator(
      '[data-testid="redflags"], [data-testid="prep"], [data-testid="prep-ready"], [data-testid="cal-start"], [data-testid="runner"], [role="radiogroup"], [data-testid="plan-warn"], [data-testid="dose-warn"], [data-testid="contra-warn"]'
    )
    .first()
    .waitFor({ timeout: 15000 });
  if (!(await page.getByTestId('redflags').isVisible().catch(() => false))) return;
  for (const id of check) await page.getByTestId('rf-' + id).click();
  // Büyük düğme açılışta kısa süre kilitli (ana ekrandaki dokunuşun ikincisi "Hiçbiri yok" sayılmasın).
  await unlocked(page);
  await page.getByTestId(check.length ? 'redflags-continue' : 'redflags-none').click();
  await page.getByTestId('redflags').waitFor({ state: 'detached' });
}

/** Alt tip (tek soru): yalnız sorulursa (tanıda kanal biliniyorsa ya da yanıt tazeyse sorulmaz). */
async function answerSubtype(page, value = 'liedown') {
  await page.locator('[data-testid="subtype-liedown"], [data-testid="prep"]').first().waitFor({ timeout: 15000 });
  if (!(await page.getByTestId('subtype-' + value).isVisible().catch(() => false))) return;
  await unlocked(page);
  await page.getByTestId('subtype-' + value).click();
}

/**
 * İki taraflı test (taraf sorusu yok; sıra kendiliğinden: bilinen taraf varsa önce öbürü, yoksa önce sağ). Hazırlık ekranından
 * başlar. positiveAt: baş dönmesi işaretlenecek test (1 ya da 2). Temiz kararda telefon alında "chain-continue" gelir.
 */
async function sideTest(page, positiveAt) {
  await calibrate(page);
  await driveRunner(page, positiveAt === 1 ? { markVertigoAtStep: 1, vertigoSec: 0.8 } : {});
  await page.locator('[data-testid="rest-continue"][data-enabled]').click({ timeout: 15000 });
  await driveRunner(page, positiveAt === 2 ? { markVertigoAtStep: 1, vertigoSec: 0.8 } : {});
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
  let lastGoto = 0;
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
    // Güvenlik uyarısı (uzun baş dönmesi / pozisyona gelinemedi) bu yardımcıda beklenmez: senaryo kendisi yönetir.
    if (phase === 'safetyHold') throw new Error('beklenmeyen güvenlik uyarısı: ' + (await page.getByTestId('runner-safety-hold').getAttribute('data-reason')));
    if (st !== lastStep && phase !== 'between') {
      lastStep = st;
      if (onStep) await onStep(st);
      await page.getByTestId('sim-goto').click();
      lastGoto = Date.now();
    } else if (phase === 'seeking' && Date.now() - lastGoto > 1500) {
      // Hedef geç yayımlandıysa (ör. giriş cümlesi sırasında) sanal baş eski hedefte kalmasın: yeniden götür.
      await page.getByTestId('sim-goto').click();
      lastGoto = Date.now();
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

const PATIENT_OK = {
  consentAt: '2026-01-01T00:00:00.000Z',
  contraindications: [],
  diagnosedByDoctor: true,
  canal: 'PC',
  side: 'R'
};

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

/** Ana ekran → "Başım dönüyor" (atağa devam) → hazırlık → tanıtma; ardından sağ Epley kendiliğinden başlar. */
async function toManeuver(page) {
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('prep').waitFor();
  await calibrate(page);
}

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

/** Tohumlanmış atakta manevra yürütücüsünü başlatır ve hareket fazına gelene dek bekler. */
async function startManeuver(page) {
  await toManeuver(page);
  await page.locator('[data-testid="runner-start"], [data-testid="runner"]').first().waitFor({ timeout: 30000 });
  if (await page.getByTestId('runner-start').isVisible().catch(() => false)) await page.getByTestId('runner-start').click();
  await page.getByTestId('runner').waitFor();
  await waitPhase(page, ['intro', 'seeking', 'settling', 'holding', 'drifting', 'between']);
}

/** Konsol hatası varsa senaryo düşer. */
function noErrors(errors) {
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
}

// ------------------------------------------------------------------------------------------------
await step('Hasta: tek ekran kurulum → isteğe bağlı tanı → güvenlik listesi → kalibrasyon → iki taraf testi → Epley → 1 saat tekrar testi → rapor', async () => {
  const { ctx, page, errors } = await newPage(seed());
  await page.goto(BASE);
  await snap(page, 'karsilama');
  await page.getByTestId('role-patient').click();
  await snap(page, 'kurulum-tek-ekran');
  // Onam: yan etkiler ve seçenekler katlanabilir (kapalı gelir), acil kartı görünür (kullanıcı turu 3, k03).
  if ((await page.locator('[data-testid="ob-risks"] details[open]').count()) !== 0) throw new Error('onamda yan etkiler kutusu açık geliyor');
  await page.getByTestId('ob-risks-side-effects').locator('summary').click();
  if (!(await page.getByTestId('ob-risks-side-effects').innerText()).includes('düşebilirsiniz')) throw new Error('yan etkiler açılınca görünmüyor');
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-start').click();
  // Kurulum tek ekran: onaydan sonra doğrudan ana ekran; tanı girilmedi bilgisi tek satır, büyük düğme kilitsiz.
  await page.getByTestId('start-episode').waitFor();
  await page.getByTestId('home-no-dx').waitFor();
  await snap(page, 'hasta-ana-tanisiz');
  // Tanı bilgisi isteğe bağlı (Ayarlar → Bilgilerim).
  await page.goto(BASE + '#/hasta/kurulum?adim=tani');
  await clickChoice(page, 'Evet, tanı kondu');
  await clickChoice(page, /Arka \(posterior\) kanal/);
  await clickChoice(page, 'Sağ kulak');
  await clickChoice(page, 'Son 2 hafta içinde');
  await snap(page, 'bilgilerim-tani');
  // Uygunluk listesinde her maddenin başında sesteki kısa ad kalın (k05).
  if ((await page.locator('button[role="checkbox"] strong', { hasText: 'Boyun sorunu:' }).count()) !== 1) throw new Error('uygunluk listesinde kısa ad kalın değil');
  await page.getByTestId('ob-save').click();
  await page.getByTestId('start-episode').waitFor();
  if (await page.getByTestId('home-no-dx').count()) throw new Error('tanı girildikten sonra "tanı yok" satırı kaldı');
  await snap(page, 'hasta-ana');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  await snap(page, 'guvenlik-listesi');
  await answerRedFlags(page);
  // Hekim tanısı arka kanal: alt tip sorulmaz. Taraf sorusu yok: önce sol (şüpheli olmayan), sonra sağ test.
  await page.getByTestId('prep').waitFor();
  await snap(page, 'hazirlik');
  await sideTest(page, 2);
  const gate = page.getByTestId('chain-continue');
  await gate.waitFor({ timeout: 15000 });
  if (!/sağ/i.test(await gate.innerText())) throw new Error('sağ taraf kararı beklenirdi: ' + (await gate.innerText()));
  await snap(page, 'karar-gecis');
  await gate.click();
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
  if (/\b(VERTIGO_TOO_LONG|ATYPICAL_LONG|BOTH_SIDES|SIDE_CONFLICT|APP_DECISION)\b/.test(reportText)) throw new Error('raporda ham iç kod var');
  // Uygulamanın kararı araştırma kaydında (tek cümle gerekçe).
  if (!(await page.getByTestId('report-overrides').innerText()).includes('Uygulamanın kararı: sağ taraf')) throw new Error('raporda uygulamanın kararı yok');
  await snap(page, 'rapor');
  // Dönem raporu: dönemdeki bütün ataklar, başta tek satır sonuç (k09).
  await page.goto(BASE + '#/hasta/rapor/donem');
  const periodSummary = await page.getByTestId('period-summary').innerText();
  if (!/^\d+ atak · \d+ manevra/.test(periodSummary)) throw new Error('dönem raporu özeti hatalı: ' + periodSummary);
  if ((await page.getByTestId('period-episode').count()) < 1) throw new Error('dönem raporunda atak yok');
  await snap(page, 'donem-raporu');
  noErrors(errors);
  await ctx.close();
});

await step('Hasta: taraf bilinmiyor → iki taraf testi kendiliğinden (önce sağ) → sağ tarafa manevra kararı', async () => {
  const data = seed({ settings: { role: 'patient' }, data: { patient: { ...PATIENT_OK, consentAt: new Date().toISOString(), side: 'unknown' } } });
  const { ctx, page, errors } = await newPage(data);
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await answerRedFlags(page);
  await answerSubtype(page);
  // Taraf sorusu yok: doğrudan hazırlık.
  await page.getByTestId('prep').waitFor();
  if (await page.getByRole('radiogroup', { name: 'Şüpheli taraf' }).count()) throw new Error('taraf sorusu hâlâ soruluyor');
  await calibrate(page);
  // Önce sağ (bilinen taraf yok): baş dönmesi işaretle (tanıtmadan sonra kendiliğinden başlar)
  await driveRunner(page, { markVertigoAtStep: 1, vertigoSec: 0.8 });
  await page.getByTestId('rest-continue').waitFor();
  if (!/sol tarafı test edeceğiz/i.test(await page.getByTestId('rest-continue').innerText())) throw new Error('ikinci test sol olmalıydı');
  await snap(page, 'taraf-ara');
  await page.locator('[data-testid="rest-continue"][data-enabled]').click({ timeout: 15000 });
  // Sonra sol (telefon alında, kendiliğinden başlar): baş dönmesi yok
  await driveRunner(page);
  // Karar: sağ tarafa manevra → tek dokunuşla geçiş ekranı
  const gate = page.getByTestId('chain-continue');
  await gate.waitFor({ timeout: 15000 });
  const txt = await gate.innerText();
  if (!/sağ/i.test(txt)) throw new Error('sağ taraf beklenirdi: ' + txt);
  await snap(page, 'taraf-karari-gecis');
  const ep = (await storeOf(page)).episodes[0];
  const dec = ep.sideTests.at(-1)?.decision;
  if (dec?.kind !== 'TREAT' || dec.side !== 'R') throw new Error('taraf testi kararı kaydedilmedi: ' + JSON.stringify(dec));
  if (!kindsOf(ep).includes('APP_DECISION')) throw new Error('uygulamanın kararı kayda yazılmadı');
  await gate.click();
  await page.getByTestId('runner').waitFor({ timeout: 20000 });
  const step = await page.getByTestId('runner').getAttribute('data-step');
  if (step !== '0') throw new Error('Epley ilk adımı bekleniyordu');
  noErrors(errors);
  await ctx.close();
});

await step('Hasta: acil kırmızı bayrak → 112 uyarısı; "Durdur" atağı acil olarak kapatır, "Yine de devam et" RED_FLAG kaydıyla sürer', async () => {
  const data = seed({ settings: { role: 'patient' }, data: { patient: { ...PATIENT_OK, consentAt: new Date().toISOString() } } });
  // a) Durdur: atak "acil" olarak kapanır, rapora gidilir; aşma kaydı yok.
  {
    const { ctx, page, errors } = await newPage(data);
    await page.goto(BASE + '#/hasta');
    await page.getByTestId('start-episode').click();
    await answerRedFlags(page, ['neuro']);
    await page.getByTestId('stop-emergency').waitFor();
    if ((await page.locator('a[href="tel:112"]').count()) < 1) throw new Error('112 bağlantısı yok');
    await page.getByTestId('call-112').waitFor();
    // Kilit yok: altında "Yine de devam et" de var.
    await page.getByTestId('redflag-override').waitFor();
    await snap(page, 'acil-uyari');
    await page.getByTestId('redflag-stop').click();
    await page.getByTestId('episode-report').waitFor();
    const ep = (await storeOf(page)).episodes[0];
    if (ep.status !== 'emergency' || !ep.redFlags.at(-1)?.stopped) throw new Error('durdurulan atak acil olarak kapanmadı: ' + ep.status);
    if (kindsOf(ep).includes('RED_FLAG')) throw new Error('durdurulunca aşma kaydı yazıldı');
    noErrors(errors);
    await ctx.close();
  }
  // b) Yine de devam et: akış sürer (hazırlık), RED_FLAG kaydı işaretlenen maddeyle; raporda araştırma kaydı.
  {
    const { ctx, page, errors } = await newPage(data);
    await page.goto(BASE + '#/hasta');
    await page.getByTestId('start-episode').click();
    await answerRedFlags(page, ['neuro']);
    await page.getByTestId('stop-emergency').waitFor();
    await unlocked(page);
    await page.getByTestId('redflag-override').click();
    await page.getByTestId('prep').waitFor();
    const ep = (await storeOf(page)).episodes[0];
    if (ep.status !== 'active') throw new Error('devam edilen atak kapandı: ' + ep.status);
    const ov = ep.overrides?.find((o) => o.kind === 'RED_FLAG');
    if (!ov || !ov.detail?.includes('neuro')) throw new Error('RED_FLAG kaydı yok: ' + JSON.stringify(ep.overrides));
    await page.goto(BASE + '#/hasta/rapor/' + ep.id);
    const rep = await page.getByTestId('report-overrides').innerText();
    if (/\bRED_FLAG\b/.test(rep)) throw new Error('araştırma kaydında ham kod: ' + rep);
    // Yeni kullanıcı turu 1 (y04 #3–4, y05 #7): devam edilen bayrak "DURDURULDU" değil; kimlik Türkçe.
    if (/\bneuro\b/.test(rep)) throw new Error('araştırma kaydında ham kimlik: ' + rep);
    const flagLine = await page.getByTestId('report-redflag').first().innerText();
    if (!flagLine.includes('işaretlendi, uyarı gösterildi, devam edildi') || /DURDURULDU/.test(flagLine)) throw new Error('güvenlik sorusu satırı: ' + flagLine);
    await snap(page, 'rapor-arastirma-kaydi');
    noErrors(errors);
    await ctx.close();
  }
});

await step('Hasta: tanısız ilk atak → kilitlenmeden teste ve manevraya ulaşır, NO_DIAGNOSIS kaydı', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' } }));
  await page.goto(BASE + '#/hasta/kurulum');
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-start').click();
  await page.getByTestId('home-no-dx').waitFor();
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  // Tanısız kişiye "aynı baş dönmesi mi" sorulmaz (karşılaştıracağı tanı yok).
  if (await page.getByTestId('rf-same').count()) throw new Error('tanısız kişiye "aynı baş dönmesi mi" soruldu');
  await answerRedFlags(page);
  await page.getByTestId('subtype-liedown').waitFor();
  await snap(page, 'tanisiz-alt-tip');
  await answerSubtype(page);
  await page.getByTestId('prep').waitFor();
  // Bilinen taraf yok: önce sağ (pozitif), sonra sol.
  await sideTest(page, 1);
  const gate = page.getByTestId('chain-continue');
  await gate.waitFor({ timeout: 15000 });
  if (!/sağ/i.test(await gate.innerText())) throw new Error('sağ taraf kararı beklenirdi');
  await gate.click();
  await page.getByTestId('runner').waitFor({ timeout: 20000 });
  if ((await page.getByTestId('runner').getAttribute('data-step')) !== '0') throw new Error('manevranın ilk adımı bekleniyordu');
  await snap(page, 'tanisiz-manevra');
  const ep = (await storeOf(page)).episodes.at(-1);
  const kinds = kindsOf(ep);
  if (!kinds.includes('NO_DIAGNOSIS') || !kinds.includes('APP_DECISION')) throw new Error('NO_DIAGNOSIS/APP_DECISION kaydı yok: ' + kinds.join(', '));
  if (ep.side !== 'R') throw new Error('atak tarafı yazılmadı: ' + ep.side);
  noErrors(errors);
  await ctx.close();
});

await step('Hasta: hekime yönlendirilen ataktan sonra kilit yok (bilgi satırı + başlat, REFERRAL kaydı); deneme günlük sınırında "Yine de dene"', async () => {
  const now = Date.now();
  const referred = {
    id: 'old', startedAt: now - 7200e3, endedAt: now - 3600e3, side: 'R', protocolId: 'epley', redFlags: [], sideTests: [],
    maneuvers: [], retests: [], status: 'referred', endNote: 'ATYPICAL_LONG'
  };
  const { ctx, page, errors } = await newPage(
    seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [referred], practiceLog: [now - 60e3, now - 30e3] } })
  );
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('home-referral-line').waitFor();
  await snap(page, 'yonlendirme-bilgi-satiri');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  let st = await storeOf(page);
  if (!kindsOf(st.episodes.find((e) => e.id === 'old')).includes('REFERRAL')) throw new Error('yönlendirilen atağa REFERRAL kaydı yazılmadı');
  await answerRedFlags(page);
  st = await storeOf(page);
  // Kayıt yönlendirilen atağa bir kez yazılır; yeni atakta tekrarlanmaz, ana ekran bilgi satırı da kalkar.
  if (kindsOf(st.episodes.find((e) => e.id === 'old')).filter((k) => k === 'REFERRAL').length !== 1) throw new Error('REFERRAL kaydı bir kez değil');
  if (!st.episodes.some((e) => e.id !== 'old' && e.status === 'active')) throw new Error('yeni atak açılmadı');
  // Deneme manevrası: günlük sınır doluyken uyarı + "Yine de dene".
  await page.goto(BASE + '#/hasta');
  await page.goto(BASE + '#/hasta/atak/practice');
  await page.getByTestId('blocked-practice').waitFor();
  await unlocked(page);
  await page.getByTestId('practice-override').click();
  await page.getByTestId('redflags').waitFor();
  noErrors(errors);
  await ctx.close();
});

await step('Hasta: kontrendikasyon uyarısı madde adıyla; "Yine de devam et" CONTRAINDICATION kaydı, aynı atakta yeniden sorulmaz', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: { ...PATIENT_OK, contraindications: ['neck'] } } }));
  await page.goto(BASE + '#/hasta');
  if (!(await page.getByTestId('home-gate-items').innerText()).includes('Boyun sorunu')) throw new Error('ana ekranda kontrendikasyon satırı yok');
  await page.getByTestId('start-episode').click();
  const w = page.getByTestId('contra-warn');
  await w.waitFor();
  if (!(await w.innerText()).includes('Boyun sorunu')) throw new Error('uyarıda madde adı yok: ' + (await w.innerText()));
  await snap(page, 'kontrendikasyon-uyarisi');
  await unlocked(page);
  await page.getByTestId('contra-override').click();
  await answerRedFlags(page);
  await page.getByTestId('prep').waitFor();
  const ep = (await storeOf(page)).episodes[0];
  const ov = ep.overrides?.find((o) => o.kind === 'CONTRAINDICATION');
  if (!ov?.detail?.includes('Boyun sorunu')) throw new Error('CONTRAINDICATION kaydı yok: ' + JSON.stringify(ep.overrides));
  // Aynı atağa devamda yeniden sorulmaz.
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await page.locator('[data-testid="contra-warn"], [data-testid="prep"], [data-testid="redflags"]').first().waitFor();
  if (await page.getByTestId('contra-warn').count()) throw new Error('aşılan kontrendikasyon uyarısı aynı atakta yeniden geldi');
  noErrors(errors);
  await ctx.close();
});

await step('Kullanılabilirlik: güvenlik listesinde yanlış işaret dokunarak kalkar, yardımcı kartı, ekranı çevir, ekrana dokunarak işaret', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient', timeScale: 5 }, data: { patient: PATIENT_OK } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  // Yanlışlıkla işaretlenen madde yeniden dokununca kalkar; büyük düğme "Hiçbiri yok"a döner (ayrı onay ekranı yok).
  await page.getByTestId('rf-neuro').click();
  const cont = page.getByTestId('redflags-continue');
  await cont.waitFor();
  if (!(await cont.innerText()).includes('(1)')) throw new Error('işaret sayısı düğmede yok: ' + (await cont.innerText()));
  await snap(page, 'yanlis-isaret');
  await page.getByTestId('rf-neuro').click();
  await page.getByTestId('redflags-none').waitFor();
  if ((await page.getByTestId('rf-neuro').getAttribute('aria-checked')) === 'true') throw new Error('işaret kalkmadı');
  await answerRedFlags(page);
  await page.getByTestId('prep').waitFor();
  if ((await storeOf(page)).episodes[0].redFlags.at(-1)?.stopped) throw new Error('kaldırılan işaret durdurma olarak kaydedildi');
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
  noErrors(errors);
  await ctx.close();
});

/** Klinisyen: yeni hasta ve muayene açar. */
async function newExam(page, code) {
  await page.goto(BASE + '#/odyolog');
  await page.getByTestId('clin-new').click();
  await page.getByTestId('clin-code').fill(code);
  await page.getByTestId('clin-create').click();
}

/** Klinisyen raporundaki HBYS notunu panodan okur. */
async function hbysNote(page) {
  await page.getByRole('button', { name: 'Rapor', exact: true }).click();
  await page.getByTestId('exam-report').waitFor();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('exam-copy-note').click();
  return page.evaluate(() => navigator.clipboard.readText());
}

await step('Klinisyen: tanı onaylanmadan reçete uyarısı → "Yine de reçete yaz" (taraf + gerekçe) → QR; HBYS notunda "Uyarıya rağmen reçete"; aynı kod ikinci hasta açmaz', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test' } } }));
  await newExam(page, 'K-7');
  await page.getByRole('button', { name: 'Reçete', exact: true }).click();
  const warn = page.getByTestId('rx-warning');
  await warn.waitFor();
  if ((await warn.getAttribute('data-kind')) !== 'RX_NO_DIAGNOSIS') throw new Error('uyarı türü: ' + (await warn.getAttribute('data-kind')));
  if (await page.getByTestId('rx-blocked').count()) throw new Error('tanısızlık hâlâ kilit');
  if (await page.getByTestId('rx-make').count()) throw new Error('uyarı aşılmadan reçete formu açıldı');
  await snap(page, 'odyolog-recete-uyarisi');
  await page.getByTestId('rx-override').click();
  const make = page.getByTestId('rx-make');
  await make.waitFor();
  if (await make.isEnabled()) throw new Error('taraf ve gerekçe olmadan reçete düğmesi etkin');
  // Onaylı tanıda taraf yok: taraf klinisyence seçilir.
  await page.getByTestId('rx-side-pick').getByRole('button', { name: 'Sol', exact: true }).click();
  if (await make.isEnabled()) throw new Error('gerekçesiz reçete düğmesi etkin');
  await page.getByTestId('rx-override-reason').fill('Klinik tablo tipik; tanı kontrolde girilecek');
  await make.click();
  await page.getByTestId('rx-output').waitFor();
  if (!(await page.getByTestId('rx-summary').innerText()).includes('SOL')) throw new Error('reçete tarafı yanlış: ' + (await page.getByTestId('rx-summary').innerText()));
  const ovNote = await page.getByTestId('rx-override-note').innerText();
  if (ovNote !== 'Uyarıya rağmen reçete: Klinik tablo tipik; tanı kontrolde girilecek (uyarı: onaylı tanı yok).') throw new Error('aşma notu: ' + ovNote);
  await snap(page, 'odyolog-uyariya-ragmen-recete');
  const ex = (await storeOf(page)).clinicExams[0];
  if (ex.rxOverride?.kind !== 'RX_NO_DIAGNOSIS' || ex.rxOverride.reason !== 'Klinik tablo tipik; tanı kontrolde girilecek') throw new Error('muayeneye aşma kaydı yazılmadı: ' + JSON.stringify(ex.rxOverride));
  const note = await hbysNote(page);
  if (!/^Ev reçetesi: sol Epley/m.test(note)) throw new Error('HBYS notunda reçete yok: ' + note);
  if (!note.includes('Uyarıya rağmen reçete: Klinik tablo tipik; tanı kontrolde girilecek (uyarı: onaylı tanı yok).')) throw new Error('HBYS notunda gerekçe yok: ' + note);
  await page.getByTestId('report-rx-override').waitFor();
  // Aynı kod ikinci hasta açmaz.
  await page.goto(BASE + '#/odyolog');
  await page.getByTestId('clin-new').click();
  await page.getByTestId('clin-code').fill('k-7');
  await page.getByTestId('clin-existing').waitFor();
  await page.getByTestId('clin-create').click();
  const n = await page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')).clinicPatients.length);
  if (n !== 1) throw new Error('aynı kodla ikinci hasta kaydı açıldı: ' + n);
  noErrors(errors);
  await ctx.close();
});

await step('Klinisyen: ≥1 dk bulguda elle "kanalolitiazis" reçete uyarısını kaldırmaz; "Yine de reçete yaz" gerekçeyle QR verir; elle girişte ön seçim yok', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test' } } }));
  await newExam(page, '2026-10-30-000123');
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
  const dxWarn = await page.getByTestId('dx-manual-warn').innerText();
  if (!dxWarn.includes('uyarısı sürer')) throw new Error('elle tanı uyarısı beklenmedik: ' + dxWarn);
  await page.getByTestId('dx-manual-save').click();
  await page.getByRole('button', { name: 'Reçete', exact: true }).click();
  const warn = page.getByTestId('rx-warning');
  await warn.waitFor();
  if ((await warn.getAttribute('data-kind')) !== 'RX_LONG_RESPONSE') throw new Error('uyarı türü: ' + (await warn.getAttribute('data-kind')));
  if (await page.getByTestId('rx-make').count()) throw new Error('uyarı aşılmadan reçete formu açıldı');
  await snap(page, 'odyolog-kupulo-uyarisi');
  await page.getByTestId('rx-override').click();
  // Taraf onaylı tanıdan gelir (seçilmez).
  if (!(await page.getByTestId('rx-side').innerText()).includes('Sağ')) throw new Error('reçete tarafı tanıdan gelmedi');
  if (await page.getByTestId('rx-side-pick').count()) throw new Error('tanıda taraf varken taraf seçimi açıldı');
  if (await page.getByTestId('rx-make').isEnabled()) throw new Error('gerekçesiz reçete düğmesi etkin');
  await page.getByTestId('rx-override-reason').fill('Hasta kliniğe gelemiyor, telefonla izlenecek.');
  if (await page.getByTestId('rx-ack').count()) await page.getByTestId('rx-ack').check();
  await page.getByTestId('rx-make').click();
  await page.getByTestId('rx-output').waitFor();
  const ovNote = await page.getByTestId('rx-override-note').innerText();
  if (ovNote !== 'Uyarıya rağmen reçete: Hasta kliniğe gelemiyor, telefonla izlenecek (uyarı: ≥1 dk nistagmus).') throw new Error('aşma notu: ' + ovNote);
  const note = await hbysNote(page);
  if (!note.includes('Ev reçetesi uyarısı: Sağ Dix-Hallpike: nistagmus 75 s')) throw new Error('HBYS notunda bulgu uyarısı yok: ' + note);
  if (note.includes('yine de reçete verebilirsiniz')) throw new Error('HBYS notunda ekran yönergesi kaldı');
  if (!note.includes('Uyarıya rağmen reçete: Hasta kliniğe gelemiyor, telefonla izlenecek (uyarı: ≥1 dk nistagmus).')) throw new Error('HBYS notunda gerekçe yok: ' + note);
  await page.getByTestId('report-rx-warn').waitFor();
  await page.getByTestId('report-rx-override').waitFor();
  noErrors(errors);
  await ctx.close();
});

await step('Hasta: "yatakta sağa-sola dönünce" yanıtı → sırtüstü baş çevirme testi → daha şiddetli taraf → BBQ roll', async () => {
  // Hekim tanısında kanal bilinmiyor: alt tip sorusu gelir.
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: { ...PATIENT_OK, canal: 'unknown', side: 'unknown' } } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await answerRedFlags(page);
  await page.getByTestId('subtype-turn').waitFor();
  await answerSubtype(page, 'turn');
  // Eskiden hekime yönlendirirdi; artık evde yatay kanal testi ve BBQ roll.
  await page.getByTestId('prep-hc').waitFor();
  if (await page.getByTestId('end-refer').count()) throw new Error('yatay kanal yanıtı hâlâ hekime yönlendiriyor');
  await snap(page, 'yatay-kanal-hazirlik');
  await calibrate(page);
  // Sırtüstü baş çevirme: 2. adım (baş sağa) baş dönmesi; sola çevirince yok.
  const p1 = await driveRunner(page, { markVertigoAtStep: 1, vertigoSec: 0.8 });
  if (p1 !== 'done') throw new Error('sırtüstü baş çevirme testi tamamlanmadı: ' + p1);
  const gate = page.getByTestId('chain-continue');
  await gate.waitFor({ timeout: 15000 });
  if (!/sağ/i.test(await gate.innerText())) throw new Error('sağ taraf kararı beklenirdi: ' + (await gate.innerText()));
  await snap(page, 'yatay-kanal-karar');
  let ep = (await storeOf(page)).episodes.at(-1);
  const test = ep.sideTests.at(-1);
  if (test?.canal !== 'HC' || test.decision?.kind !== 'TREAT' || test.decision.side !== 'R') throw new Error('yatay kanal testi kaydı: ' + JSON.stringify(test));
  if (!ep.overrides?.find((o) => o.kind === 'APP_DECISION')?.detail?.includes('BBQ roll')) throw new Error('kararda BBQ roll yok: ' + JSON.stringify(ep.overrides));
  if (!kindsOf(ep).includes('SUBTYPE')) throw new Error('SUBTYPE kaydı yok');
  await gate.click();
  const p2 = await driveRunner(page, { timeout: 180000 });
  if (p2 !== 'done') throw new Error('BBQ roll tamamlanmadı: ' + p2);
  await clickChoice(page, 'İyiyim');
  await page.getByTestId('end-maneuver-done').waitFor();
  ep = (await storeOf(page)).episodes.at(-1);
  const m = ep.maneuvers.at(-1);
  if (m?.protocolId !== 'bbq-roll' || m.side !== 'R' || !m.completed) throw new Error('BBQ roll kaydı: ' + JSON.stringify(m && { p: m.protocolId, s: m.side, c: m.completed }));
  // Atak kaydı ve rapor gerçekte yapılan test ve manevrayı yazar (yeni kullanıcı turu 1, y04 #2, y06 #1).
  if (ep.protocolId !== 'bbq-roll') throw new Error('atak kaydında manevra BBQ roll değil: ' + ep.protocolId);
  if (!ep.appVersion || !ep.rulesVersion) throw new Error('atakta sürüm yok');
  await page.goto(BASE + '#/hasta/rapor/' + ep.id);
  const rep = await page.getByTestId('episode-report').innerText();
  if (!rep.includes('BBQ roll') || !rep.includes('Sırtüstü baş çevirme testi')) throw new Error('raporda yapılan test/manevra yok: ' + rep.slice(0, 600));
  if (/Dix-Hallpike|Epley/.test(rep)) throw new Error('raporda yapılmayan test/manevra adı: ' + rep.slice(0, 600));
  if (!(await page.getByTestId('report-source').innerText()).includes('karar kuralları')) throw new Error('raporda sürüm satırı yok');
  const research = await page.getByTestId('report-overrides').innerText();
  if (/alt tip uyarısına rağmen|bir uyarıya rağmen/.test(research)) throw new Error('uyarı gösterilmeyen yerde "uyarıya rağmen": ' + research);
  if (!research.includes('Uyarıya rağmen devam (kullanıcının aştığı uyarılar): yok')) throw new Error('aşma sayısı satırı yok: ' + research);
  noErrors(errors);
  await ctx.close();
});

/** Reçete bağlantısının gövdesini (JSON) çözer. */
const rxBody = (url) => JSON.parse(Buffer.from(url.split('#/recete/')[1].split('.')[0], 'base64url').toString('utf8'));

/** Reçete bağlantısını açar, kabul eder ve tek ekran kurulumu bitirir (ana ekran). */
async function acceptRx(page, url) {
  await page.goto(url);
  await page.getByTestId('rx-card').waitFor();
  await page.getByTestId('rx-accept').click();
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-start').click();
  await page.getByTestId('start-episode').waitFor();
}

await step('Klinisyen → hasta (yatay kanal, L4-1): supine roll bulgusu → yatay kanal tanısı → BBQ roll reçetesi (v3); hasta kısa yolda BBQ roll yapar, "geçmişti" derse sırtüstü baş çevirme testi', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test' } } }));
  await newExam(page, 'Y-1');
  // Elle gir sırası: Sağ DH, Sol DH, sırtüstü nötr, baş sağa, baş sola.
  const roll = async (i, intensity, dur) => {
    await page.getByRole('button', { name: 'Elle gir' }).nth(i).click();
    await page.getByTestId('finding-form').waitFor();
    await page.getByRole('radio', { name: 'Yatay geotropik' }).click();
    await page.locator('#dur').fill(dur);
    // Şiddet seçilmeden Kaydet kapalı ve nedeni yazılı (L4-4).
    if (await page.getByTestId('finding-save').isEnabled()) throw new Error('şiddetsiz roll bulgusunda Kaydet etkin');
    if (!(await page.getByTestId('finding-save-why').innerText()).includes('şiddeti seçin')) throw new Error('Kaydet kapalı nedeni yazmıyor');
    await page.getByTestId('finding-intensity-help').waitFor();
    await page.getByRole('button', { name: intensity }).click();
    await page.getByTestId('finding-save').click();
  };
  await roll(3, '3 güçlü', '30');
  await roll(4, '1 hafif', '20');
  await page.getByRole('button', { name: 'Tanı', exact: true }).click();
  const sug = page.getByTestId('dx-suggestion').first();
  await sug.waitFor();
  if (!/Sağ yatay kanal/.test(await sug.innerText())) throw new Error('tanı önerisi: ' + (await sug.innerText()));
  await page.getByTestId('dx-confirm').first().click();
  await page.getByRole('button', { name: 'Reçete', exact: true }).click();
  // Kilit yok: reçete formu doğrudan açılır, kanal tanıdan gelir, manevra BBQ roll.
  if (await page.getByTestId('rx-blocked').count()) throw new Error('yatay kanal tanısında reçete hâlâ kilitli');
  if (await page.getByTestId('rx-warning').count()) throw new Error('yatay kanal tipik tanısında beklenmeyen uyarı');
  if (!(await page.getByTestId('rx-canal').innerText()).includes('Yatay kanal')) throw new Error('reçete kanalı tanıdan gelmedi');
  await page.getByTestId('rx-maneuver-hc').waitFor();
  await page.getByTestId('rx-make').click();
  await page.getByTestId('rx-output').waitFor();
  const sum = await page.getByTestId('rx-summary').innerText();
  if (!sum.includes('SAĞ yatay kanal · BBQ roll')) throw new Error('reçete özeti: ' + sum);
  // iPhone talimatı (L4-5) hekim ekranında.
  if (!(await page.getByTestId('rx-ios-tip').innerText()).includes('Ana Ekrana Ekle')) throw new Error('iPhone talimatı yok');
  await snap(page, 'odyolog-yatay-kanal-recete');
  const url = await page.getByTestId('rx-url').inputValue();
  const body = rxBody(url);
  if (body.v !== 3 || body.canal !== 'HC' || body.maneuver !== 'bbq-roll' || body.side !== 'R') throw new Error('reçete gövdesi: ' + JSON.stringify(body));
  const note = await hbysNote(page);
  if (!/^Ev reçetesi: sağ BBQ roll \(yatay kanal\)/m.test(note)) throw new Error('HBYS notunda yatay kanal reçetesi yok: ' + note);
  noErrors(errors);
  await ctx.close();

  // Hasta 1: "muayeneden beri geçmedi" → doğrudan BBQ roll (reçete tarafı).
  {
    const { ctx, page, errors } = await newPage(seed());
    await page.goto(url);
    await page.getByTestId('rx-card').waitFor();
    if ((await page.getByTestId('rx-dx').innerText()) !== 'SAĞ kulak — yatay kanal kristal oynaması (BPPV)') throw new Error('reçete kartı tanı: ' + (await page.getByTestId('rx-dx').innerText()));
    if ((await page.getByTestId('rx-maneuver').innerText()) !== 'BBQ roll') throw new Error('reçete kartı manevra');
    await snap(page, 'hasta-yatay-kanal-recete-karti');
    await acceptRx(page, url);
    const p = (await storeOf(page)).patient;
    if (p.canal !== 'HC' || p.side !== 'R' || p.prescription?.maneuver !== 'bbq-roll') throw new Error('profil: ' + JSON.stringify({ c: p.canal, s: p.side, rx: p.prescription }));
    if (!(await page.getByTestId('home-rx').innerText()).includes('BBQ roll')) throw new Error('ana ekranda reçete manevrası yanlış');
    await page.getByTestId('start-episode').click();
    await answerRedFlags(page);
    await page.getByTestId('rx-same').waitFor({ timeout: 15000 });
    await unlocked(page);
    await page.getByTestId('rx-same').click();
    await page.getByTestId('prep-hc').waitFor();
    await calibrate(page);
    const ph = await driveRunner(page, { timeout: 180000 });
    if (ph !== 'done') throw new Error('BBQ roll tamamlanmadı: ' + ph);
    await clickChoice(page, 'İyiyim');
    await page.getByTestId('end-maneuver-done').waitFor();
    const ep = (await storeOf(page)).episodes.at(-1);
    const m = ep.maneuvers.at(-1);
    if (m?.protocolId !== 'bbq-roll' || m.side !== 'R' || !m.completed) throw new Error('BBQ roll kaydı: ' + JSON.stringify(m && { p: m.protocolId, s: m.side, c: m.completed }));
    if (ep.rxShortcut !== true || ep.sideTests.length !== 0) throw new Error('reçeteli kısa yol kaydı: ' + JSON.stringify({ k: ep.rxShortcut, t: ep.sideTests.length }));
    noErrors(errors);
    await ctx.close();
  }

  // Hasta 2: "geçmişti; yeniden başladı" → alt tip sorulmadan sırtüstü baş çevirme testi → BBQ roll kararı.
  {
    const { ctx, page, errors } = await newPage(seed());
    await acceptRx(page, url);
    await page.getByTestId('start-episode').click();
    await answerRedFlags(page);
    await page.getByTestId('rx-new').waitFor({ timeout: 15000 });
    await unlocked(page);
    await page.getByTestId('rx-new').click();
    await page.getByTestId('prep-hc').waitFor();
    if (await page.getByTestId('subtype-turn').count()) throw new Error('yatay kanal reçetesinde alt tip yeniden soruldu');
    await calibrate(page);
    const p1 = await driveRunner(page, { markVertigoAtStep: 1, vertigoSec: 0.8 });
    if (p1 !== 'done') throw new Error('sırtüstü baş çevirme testi tamamlanmadı: ' + p1);
    const gate = page.getByTestId('chain-continue');
    await gate.waitFor({ timeout: 15000 });
    if (!/sağ/i.test(await gate.innerText())) throw new Error('sağ taraf kararı beklenirdi: ' + (await gate.innerText()));
    const ep = (await storeOf(page)).episodes.at(-1);
    const t = ep.sideTests.at(-1);
    if (t?.canal !== 'HC' || t.decision?.kind !== 'TREAT' || t.decision.side !== 'R') throw new Error('yatay kanal testi kaydı: ' + JSON.stringify(t));
    if (!ep.overrides?.find((o) => o.kind === 'APP_DECISION')?.detail?.includes('BBQ roll')) throw new Error('kararda BBQ roll yok');
    noErrors(errors);
    await ctx.close();
  }
});

await step('Klinisyen (L4-2): saf aşağı vuran nistagmus → Tedavi ve Reçete uyarısı bulguyu adıyla söyler; gerekçe ≥10 karakter; hastanın kartında "Hekim uyarıya rağmen verdi"', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test' } } }));
  await newExam(page, 'S-1');
  await page.getByRole('button', { name: 'Elle gir' }).nth(0).click();
  await page.getByRole('radio', { name: 'Saf aşağı vuran' }).click();
  await page.locator('#lat').fill('0');
  await page.locator('#dur').fill('30');
  await page.getByTestId('finding-save').click();
  await page.getByRole('button', { name: 'Elle gir' }).nth(1).click();
  await page.getByRole('radio', { name: 'Yok' }).click();
  await page.getByTestId('finding-save').click();
  await page.getByRole('button', { name: 'Tedavi', exact: true }).click();
  const tc = await page.getByTestId('treat-central').innerText();
  if (!tc.includes('Santral örüntü — Sağ Dix-Hallpike: saf aşağı vuran nistagmus')) throw new Error('Tedavi uyarısı bulguyu adıyla söylemiyor: ' + tc);
  await page.getByRole('button', { name: 'Reçete', exact: true }).click();
  const warn = page.getByTestId('rx-warning');
  await warn.waitFor();
  if ((await warn.getAttribute('data-kind')) !== 'RX_CENTRAL') throw new Error('uyarı türü: ' + (await warn.getAttribute('data-kind')));
  const wt = await warn.innerText();
  if (!wt.includes('Santral örüntü: saf aşağı vuran nistagmus') || !wt.includes('Sağ Dix-Hallpike: saf aşağı vuran nistagmus')) throw new Error('reçete uyarısı: ' + wt);
  await snap(page, 'odyolog-santral-uyari');
  await page.getByTestId('rx-override').click();
  await page.getByTestId('rx-side-pick').getByRole('button', { name: 'Sağ', exact: true }).click();
  await page.getByTestId('rx-override-reason').fill('x');
  if (await page.getByTestId('rx-make').isEnabled()) throw new Error('tek harf gerekçeyle reçete düğmesi etkin');
  if (!(await page.getByTestId('rx-make-why').innerText()).includes('en az 10 karakter')) throw new Error('kısa gerekçe nedeni yazmıyor');
  await page.getByTestId('rx-override-reason').fill('Nöroloji konsültasyonu istendi; MR randevusu var');
  await page.getByTestId('rx-make').click();
  await page.getByTestId('rx-output').waitFor();
  if (!(await page.getByTestId('rx-override-note').innerText()).includes('(uyarı: santral örüntü)')) throw new Error('aşma notu');
  if (!(await page.getByTestId('rx-output-ov').innerText()).includes('Hekim uyarıya rağmen verdi')) throw new Error('hasta kartı önizlemesi yok');
  const url = await page.getByTestId('rx-url').inputValue();
  if (rxBody(url).v !== 3 || !rxBody(url).ov) throw new Error('reçetede uyarı notu yok: ' + JSON.stringify(rxBody(url)));
  const ex = (await storeOf(page)).clinicExams[0];
  if (ex.rxOverride?.kind !== 'RX_CENTRAL') throw new Error('muayeneye aşma kaydı: ' + JSON.stringify(ex.rxOverride));
  noErrors(errors);
  await ctx.close();
  {
    const { ctx, page, errors } = await newPage(seed());
    await page.goto(url);
    const line = await page.getByTestId('rx-override-line').innerText();
    if (!line.startsWith('Hekim uyarıya rağmen verdi: muayene bulgusu beyin kaynaklı')) throw new Error('reçete kartında uyarı satırı: ' + line);
    await snap(page, 'hasta-recete-uyariya-ragmen');
    await acceptRx(page, url);
    if (!(await page.getByTestId('home-rx-ov').innerText()).includes('Hekim uyarıya rağmen verdi')) throw new Error('ana ekranda uyarı satırı yok');
    noErrors(errors);
    await ctx.close();
  }
});

await step('Klinisyen (L4-3/L4-4/L4-6): tipik arka kanal bulgusundan sonra "Sıradaki: Tanı" (roll isteğe bağlı); bulgu formunda "Nasıl görünür?" ve "Emin değilim"; yeni muayenede "Önceki kalibrasyonu kullan"', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'clinician' }, data: { clinician: { name: 'Dr. Test', method: 'çıplak göz' } } }));
  await newExam(page, 'T-1');
  await page.getByTestId('test-run-dhR').click();
  if (await page.getByTestId('cal-reuse').count()) throw new Error('kalibrasyon yokken "önceki kalibrasyon" sunuldu');
  await calibrate(page);
  await page.getByTestId('runner-ready').waitFor();
  await driveRunner(page, { markVertigoAtStep: 1, vertigoSec: 0.5 });
  await page.getByTestId('finding-form').waitFor();
  // Çıplak göz: "Emin değilim" kısa yolu ve "Nasıl görünür?" yardımı (L4-4).
  await page.getByTestId('finding-unsure').waitFor();
  await page.getByTestId('finding-help').locator('summary').click();
  if (!(await page.getByTestId('finding-help').innerText()).includes('üst kutup alttaki kulağa')) throw new Error('nasıl görünür yardımı eksik');
  await page.getByRole('radio', { name: 'Yukarı vuran + torsiyonel' }).click();
  await page.locator('#lat').fill('3');
  await page.locator('#dur').fill('20');
  await page.getByTestId('finding-save').click();
  // Sol DH: "Emin değilim, baş dönmesi var" → nistagmus yok + baş dönmesi + not.
  await page.getByRole('button', { name: 'Elle gir' }).nth(1).click();
  await page.getByTestId('finding-unsure').click();
  await page.getByTestId('finding-save').click();
  let fx = (await storeOf(page)).clinicExams[0].findings;
  if (fx.dhL?.nystagmus !== 'none' || fx.dhL.vertigo !== true || !fx.dhL.note?.includes('emin değil')) throw new Error('"emin değilim" kaydı: ' + JSON.stringify(fx.dhL));
  // Nistagmussuz baş dönmesi tipik öneriyi düşürür: sol DH'yi negatif yap → tipik → "Sıradaki: Tanı".
  await page.getByRole('button', { name: 'Elle gir' }).nth(1).click();
  await page.getByRole('radio', { name: 'Yok' }).click();
  await page.locator('input[type="checkbox"]').first().uncheck();
  await page.getByTestId('finding-save').click();
  await page.getByTestId('test-next-dx').waitFor();
  if (!(await page.getByTestId('test-next').innerText()).includes('isteğe bağlı')) throw new Error('roll testi isteğe bağlı yazmıyor');
  await snap(page, 'odyolog-siradaki-tani');
  await page.getByTestId('test-next-dx').click();
  await page.getByTestId('dx-suggestion').first().waitFor();
  // Yeni muayene: bu oturumdaki kalibrasyon tek dokunuşla yeniden kullanılır (L4-6).
  await newExam(page, 'T-2');
  await page.getByTestId('test-run-dhR').click();
  await page.getByTestId('cal-reuse').click();
  await page.getByTestId('runner-ready').waitFor();
  if (await page.getByTestId('cal-start').count()) throw new Error('önceki kalibrasyon kullanılmadı');
  noErrors(errors);
  await ctx.close();
});

let rxUrl = null;
/** Odyolog senaryosunun sonundaki uygulama verisi (muayene + reçete): basılı rapor senaryosu bunu tohumlar. */
let clinState = null;
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
  await page.getByRole('button', { name: 'Tanı', exact: true }).click();
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
  clinState = await page.evaluate(() => JSON.parse(localStorage.getItem('dengeyol:v1')));
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
  // Tek ekran kurulum: onay + "Başla"; reçete bilgisi kendiliğinden dolar (tanı sorulmaz).
  await page.getByTestId('ob-consent').click();
  await page.getByTestId('ob-start').click();
  await page.getByTestId('start-episode').waitFor();
  const home = await page.locator('main').innerText();
  if (!home.includes('Reçete')) throw new Error('ana ekranda reçete yok');
  // Reçete hekim tanısı yerine geçer: "tanı yok" satırı gösterilmez.
  if (await page.getByTestId('home-no-dx').count()) throw new Error('reçeteliyken "tanı yok" satırı var');
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
        m: [
          [10, 's', 'R', 'chn', 1, 4, [[5, 0], [60, 6, 41, 2, 15], [60, 8], [30, 32]]],
          // Sol Epley (kendi başına): 4. adımda önce yanlış taraf; başlıklar tarafıyla çözülmeli ("Sağ yan, burun yere").
          [40, 'e', 'L', 'con', 0, 5, [[30, 0], [30, 0], [30, 0], [30, 16], [30, 0]]]
        ],
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
  if (!head.includes('1 atak') || !head.includes('2 manevra (2 tamamlandı)')) throw new Error('rapor özeti hatalı: ' + head);
  // Özet son atağın sonucuyla başlar (tur 5, k09).
  if (!/^Son atak \(\d\d\.\d\d(\.\d{4})?\): düzeldi · /.test(head)) throw new Error('özet son atağın sonucuyla başlamıyor: ' + head);
  // Tarihler ayrı adlarla: reçete (geçerlilik … dahil) · atak · rapor (tur 5, k09).
  const title = await page.getByTestId('hr-report').locator('h3').first().innerText();
  if (!/Reçete 31\.10(\.2026)? \(geçerlilik 13\.11(\.2026)? dahil\) · atak \S+ · rapor \S+/.test(title)) throw new Error('dönem tarihleri adlandırılmamış: ' + title);
  const steps = (await page.getByTestId('hr-report-steps').allInnerTexts()).join('\n');
  if (!steps.includes('komuttan önce hareket') || !steps.includes('oturuştan geçilmedi') || !steps.includes('hedef sınırında')) {
    throw new Error('adım işaretleri yok: ' + steps);
  }
  // İçe aktarılan adım başlıklarında çözülmemiş "{…}" belirteci kalmaz; sol Epley'nin 4. adımı sağ yandır (tur 4–5, k09/k10).
  if (steps.includes('{')) throw new Error('adım başlığında "{" kaldı: ' + steps);
  if (!steps.includes('Sağ yan, burun yere') || !steps.includes('önce yanlış taraf')) throw new Error('sol Epley adımları tarafıyla çözülmedi: ' + steps);
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

await step('Tur 6 kilidi: ev raporu biçim v2 (testte durdurma, yüzüstünden gelme) içe aktarılır; ev dönemi ekli basılı rapor tek A4 sayfası', async () => {
  if (!clinState) throw new Error('odyolog senaryosunun verisi yok');
  const exam = clinState.clinicExams[0];
  const patient = clinState.clinicPatients.find((p) => p.id === exam.patientId);
  if (!exam?.prescriptionToken || !patient) throw new Error('muayenede reçete yok');
  const now = Date.now();
  const m = (t) => Math.floor(t / 60000);
  const start = now - 3 * 3600e3;
  // k08'in gerçek döngüsü: reçeteli kısa yol, Epley (2. adımda baş dönmesi), 1. saat tekrar testi negatif; ayrıca sol taraf
  // testi "kendimi kötü hissediyorum" ile durduruldu ve yarıda kalan bir Epley'de yüzüstünden gelindi (v2'ye özgü bilgiler).
  const token = homeReportToken({
    v: 2,
    g: m(now),
    p: patient.code,
    c: exam.prescriptionToken.split('.')[1],
    r: [new Date(exam.at).toISOString().slice(0, 10), 'R', 'e', 3, 5],
    a: m(start),
    b: m(now),
    e: [
      {
        s: m(start),
        u: 'a',
        d: 'R',
        k: 1,
        m: [
          [5, 'e', 'R', 'P', 1, 4, [[30, 0], [30, 0], [30, 0], [0, 16 | 256]]],
          [20, 'e', 'R', 'chn', 0, 5, [[30, 0], [30, 0, null, 11, 17], [30, 0], [30, 0], [30, 0]]]
        ],
        q: [[90, 'e', 'R', 0, null, null]],
        y: [[2, 's', 'L', 'U']]
      }
    ]
  });
  // Kontrol muayenesine benzer dolu rapor: manevra sonrası tekrar test bulguları ve muayene notu da var (k08'in basılı raporu).
  const full = structuredClone(clinState);
  const ex = full.clinicExams.find((e) => e.id === exam.id);
  ex.retestFindings = structuredClone(ex.findings);
  ex.notes = 'Kontrol muayenesi. Hasta evde reçeteli Epley uyguladı; 1. saat tekrar testi negatif. Sabah testi sonrası ev raporu yeniden istenecek.';
  const { ctx, page, errors } = await newPage(full);
  await page.goto(BASE + '#/odyolog/ev-raporu/' + token);
  await page.getByTestId('hr-report').waitFor();
  const stop = await page.getByTestId('hr-report-test-stop').innerText();
  if (!stop.includes('sol taraf testi durduruldu — hasta kendini iyi hissetmedi')) throw new Error('testte durdurma satırı yok: ' + stop);
  const steps = (await page.getByTestId('hr-report-steps').allInnerTexts()).join('\n');
  if (!steps.includes('yüzüstünden gelme reddedildi')) throw new Error('yüzüstünden gelme işareti yok: ' + steps);
  // Ev dönemi satırında 1. saat testi bir kez (tur 6, k08 #4).
  const head = await page.getByTestId('hr-report-headline').innerText();
  if (!head.includes('atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor')) throw new Error('özet beklenmedik: ' + head);
  if ((head.match(/tekrar test/g) ?? []).length !== 1) throw new Error('ev dönemi satırında tekrar testi iki kez: ' + head);
  if ((await page.getByTestId('hr-patient').inputValue()) !== patient.id) throw new Error('aynı kodlu hasta seçili gelmedi');
  await page.getByTestId('hr-exam').selectOption(exam.id);
  await page.getByTestId('hr-attach').click();
  await page.getByTestId('report-home').waitFor();
  await page.getByTestId('exam-report').waitFor();
  // HBYS notu: testte durdurma kısa; tekrar testi bir kez.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('exam-copy-note').click();
  const note = await page.evaluate(() => navigator.clipboard.readText());
  const homeLine = note.split('\n').find((l) => l.startsWith('Ev dönemi')) ?? '';
  if (!homeLine.includes('testte durdurma: sol taraf testi')) throw new Error('HBYS satırında testte durdurma yok: ' + homeLine);
  if ((homeLine.match(/tekrar test/g) ?? []).length !== 1) throw new Error('HBYS satırında tekrar testi iki kez: ' + homeLine);
  // Basılı rapor (A4): ev dönemi ekliyken de tek sayfa; reçete + QR + imza bloğu aynı sayfada.
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: false });
  await page.emulateMedia({ media: 'screen' });
  writeFileSync(join(out, 'ev-donemi-ekli-rapor.pdf'), pdf);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (pages !== 1) throw new Error(`ev dönemi ekli basılı rapor ${pages} sayfa (beklenen 1)`);
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Klinisyen: kayıtsız tarayıcıda rapor bağlantısı kopyalama yönergesi; reçete bağlantısı yapıştırılınca açık mesaj; ses kipi profilde', async () => {
  const now = Date.now();
  const m = (t) => Math.floor(t / 60000);
  // Açık atak: Epley yapıldı, 1. saat tekrar testi negatif (sabah testi bekleniyor).
  const token = homeReportToken({
    v: 1, g: m(now), p: 'NO-77', a: m(now - 3600e3), b: m(now),
    e: [{ s: m(now - 3600e3), u: 'a', d: 'R', k: 1, m: [[2, 'e', 'R', 'con', 0, 5]], q: [[58, 'e', 'R', 0, null, null]] }]
  });
  // 1) Klinisyen kaydı olmayan tarayıcı (iPhone'da QR Safari'de açılır): önce "kopyalayıp uygulamaya yapıştırın" yolu (k08).
  const a = await newPage(seed());
  await a.page.goto(BASE + '#/odyolog/ev-raporu/' + token);
  await a.page.getByTestId('hr-report').waitFor();
  // Açık atakta 1. saat tekrar testi negatifse "sürüyor" denmez (tur 5, k08).
  const openHead = await a.page.getByTestId('hr-report-headline').innerText();
  if (!openHead.includes('atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor') || openHead.includes('sürüyor')) {
    throw new Error('açık atak özeti hatalı: ' + openHead);
  }
  if ((await a.page.getByTestId('hr-report').innerText()).includes('sürüyor')) throw new Error('açık atak "sürüyor" diye yazıldı');
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
// Yeniden tasarımdan (kilit yok) sonra eski "engel" kilitleri yerine uyarı + "Yine de devam et" + kayıt sınanır.

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

await step('Tur 2–3 kilidi: aynı gün manevrayla kapatılan atak yeniden açılır; 1 saatlik tekrar testi uyarısı, "Yine de manevra yap" EARLY_REPEAT kaydı', async () => {
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
  const plan = page.getByTestId('plan-warn');
  await plan.waitFor();
  const t = await plan.innerText();
  if (!t.includes('Manevra az önce yapıldı') || !/Tekrar testi/.test(t)) throw new Error('plan uyarısı beklenmedik: ' + t);
  await page.getByTestId('plan-override').waitFor();
  if (await page.getByTestId('redflags').count()) throw new Error('yeniden açmada önce güvenlik listesi açıldı');
  let st = await storeOf(page);
  if (st.episodes.length !== 1 || st.episodes[0].status !== 'active' || st.episodes[0].endedAt) throw new Error('aynı atak yeniden açılmadı');
  // Ana ekran: aynı atak, tekrar testi saati (henüz hazır değil).
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('active-episode').waitFor();
  if (await page.getByTestId('do-retest').count()) throw new Error('1 saat dolmadan tekrar testi açıldı');
  if (!(await page.getByTestId('active-episode').innerText()).includes('Test saati')) throw new Error('tekrar testi saati yok');
  // Adresle "treat"/"start": manevra ya da test kendiliğinden açılmaz, önce uyarı.
  for (const mode of ['treat', 'start']) {
    await page.goto(BASE + '#/hasta/atak/' + mode);
    await page.getByTestId('plan-warn').waitFor();
    if ((await page.getByTestId('prep').count()) || (await page.getByTestId('runner').count())) throw new Error(`#/hasta/atak/${mode} uyarısız manevra açtı`);
  }
  // Kilit yok: "Yine de manevra yap" akışı sürdürür ve kayda geçer.
  await unlocked(page);
  await page.getByTestId('plan-override').click();
  await answerRedFlags(page);
  await page.getByTestId('prep').waitFor();
  st = await storeOf(page);
  if (st.episodes.length !== 1 || st.episodes[0].maneuvers.length !== 1) throw new Error('yeni atak ya da manevra kaydı açıldı');
  if (!kindsOf(st.episodes[0]).includes('EARLY_REPEAT')) throw new Error('EARLY_REPEAT kaydı yok: ' + kindsOf(st.episodes[0]).join(', '));
  noErrors(errors);
  await ctx.close();
});

await step('Tur 2–3 kilidi: günlük sınır doluyken ana ekranda bilgi satırı + başlat; akışta doz uyarısı, "Yine de devam et" DOSE kaydı', async () => {
  const now = Date.now();
  // a) Bugün 3 manevrayla kapatılmış atak: büyük düğme kalır, altında sınır satırı ve sonraki izinli zaman.
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
  if (!card.includes('Bugün için önerilen manevra sayısına ulaştınız') || !card.includes('Önerilen sonraki manevra')) throw new Error('sınır satırı eksik: ' + card);
  await a.page.getByTestId('start-episode').waitFor();
  await snap(a.page, 'sinir-satiri');
  // Akış: aynı gün yeniden açma → tekrar testi uyarısı → doz uyarısı; ikisi de aşılabilir ve kayda geçer.
  await a.page.getByTestId('start-episode').click();
  await a.page.getByTestId('plan-warn').waitFor();
  await unlocked(a.page);
  await a.page.getByTestId('plan-override').click();
  const dose = a.page.getByTestId('dose-warn');
  await dose.waitFor();
  if (!(await dose.innerText()).includes('Bugün için önerilen manevra sayısına ulaştınız')) throw new Error('doz uyarısı metni: ' + (await dose.innerText()));
  await snap(a.page, 'doz-uyarisi');
  await unlocked(a.page);
  await a.page.getByTestId('dose-override').click();
  await answerRedFlags(a.page);
  await a.page.getByTestId('prep').waitFor();
  const ka = kindsOf((await storeOf(a.page)).episodes[0]);
  if (!ka.includes('DOSE') || !ka.includes('EARLY_REPEAT')) throw new Error('DOSE/EARLY_REPEAT kaydı yok: ' + ka.join(', '));
  noErrors(a.errors);
  await a.ctx.close();
  // b) Aktif atak: bugün 3 manevra, tekrar testi pozitif → "Manevrayı tekrarla" kalır, altında sınır satırı.
  const active = {
    ...readyEpisode('act'),
    maneuvers: [maneuverAgo('m1', 7), maneuverAgo('m2', 5), maneuverAgo('m3', 3)],
    retests: [{ at: now - MIN, kind: 'early', side: 'R', vertigo: true, latencySec: 2, durationSec: 15 }]
  };
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [active] } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('do-treat').waitFor();
  const limitLine = await page.getByTestId('active-episode').getByTestId('home-dose-limit').innerText();
  if (!limitLine.includes('Bugün için önerilen manevra sayısına ulaştınız')) throw new Error('aktif atakta sınır satırı yok: ' + limitLine);
  await page.getByTestId('do-treat').click();
  await page.getByTestId('dose-warn').waitFor();
  if ((await page.getByTestId('prep').count()) || (await page.getByTestId('runner').count())) throw new Error('doz uyarısı gösterilmeden manevra açıldı');
  await unlocked(page);
  await page.getByTestId('dose-override').click();
  await answerRedFlags(page);
  await page.getByTestId('prep').waitFor();
  if (!kindsOf((await storeOf(page)).episodes[0]).includes('DOSE')) throw new Error('DOSE kaydı yok');
  noErrors(errors);
  await ctx.close();
});

await step('Tur 2–3 kilidi (tek ekran liste): açılışta "Hiçbiri yok" kısa süre kilitli, kilitliyken dokunuş yanıt sayılmaz; yanıtlanan maddeler cihazda hatırlanır', async () => {
  // Eski soru-soru okuma kilidinin yerine: tek ekranda büyük düğmenin açılış kilidi (ana ekrandaki çift dokunuşun ikincisi
  // "Hiçbiri yok" sayılmasın). Sahte ses açık: kısa okunuş düğmeyi uzun süre kilitlemez.
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient', speech: true }, data: { patient: PATIENT_OK } }), { speechMs: 4000 });
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  const t0 = Date.now();
  if ((await page.locator('.sticky-actions[data-locked]').count()) !== 1) throw new Error('liste kilitsiz açıldı (sınama geçersiz)');
  // Kilitliyken büyük düğmeye dokunuş (çift dokunuşun ikincisi gibi): liste yerinde kalır.
  await page.getByTestId('redflags-none').click({ force: true });
  if (Date.now() - t0 > 700) throw new Error('dokunuş kilit süresinden sonra yapıldı (sınama geçersiz)');
  await page.waitForTimeout(150);
  if (!(await page.getByTestId('redflags').isVisible())) throw new Error('kilitliyken dokunuş "Hiçbiri yok" sayıldı');
  await unlocked(page);
  const lockMs = Date.now() - t0;
  if (lockMs > 2000) throw new Error('liste kilidi çok uzun (ses okunuşuna bağlı kalmış olabilir): ' + lockMs);
  if ((await storeOf(page)).episodes.length) throw new Error('kilitliyken atak/yanıt kaydı açıldı');
  await snap(page, 'liste-acilis-kilidi');
  await page.getByTestId('redflags-none').click();
  await page.getByTestId('prep').waitFor();
  const st = await storeOf(page);
  const rf = st.episodes[0].redFlags.at(-1);
  if (!rf || rf.stopped || Object.values(rf.answers).some((v) => v === true)) throw new Error('yanıtlar yanlış kaydedildi: ' + JSON.stringify(rf));
  const answered = Object.keys(st.settings.answeredQuestions ?? {});
  if (answered.length < Object.keys(rf.answers).length || !answered.includes('neuro')) throw new Error('yanıtlanan maddeler hatırlanmadı: ' + answered.join(', '));
  noErrors(errors);
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

// ------------------------------------------------------------------------------------------------
// Kullanıcı turu 5 (k06 #4): elle denenip testle korunmayan davranışlar da uçtan uca kilit altında.

/** Yeni ekrandaki seçenek grubunun ilk seçeneğine, grup hâlâ kilitliyken (çift dokunuşun ikincisi gibi) dokunur. */
async function tapWhileLocked(page, group, sinceMs, lockMs) {
  const g = page.getByRole('radiogroup', { name: group });
  await g.waitFor({ timeout: 5000 });
  const radio = g.getByRole('radio').first();
  const b = await radio.boundingBox();
  if ((await g.getAttribute('data-locked')) === null) throw new Error(`"${group}" kilitsiz açıldı (sınama geçersiz)`);
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  const ms = Date.now() - sinceMs;
  if (ms > lockMs) throw new Error(`ikinci dokunuş kilit süresinden sonra yapıldı (${ms} ms; sınama geçersiz)`);
  // Kilit kalktıktan sonra da soru yerinde ve yanıtsız.
  await page.waitForTimeout(lockMs + 300);
  if (!(await g.isVisible())) throw new Error(`kilitliyken dokunuş "${group}" sorusunu yanıtladı`);
  if (await g.locator('[role="radio"][aria-checked="true"]').count()) throw new Error(`kilitliyken dokunuş "${group}" seçimini işaretledi`);
}

/** Hekim tanısı var ama kanal bilinmiyor: alt tip sorusu sorulur. */
const PATIENT_CANAL_UNKNOWN = { ...PATIENT_OK, canal: 'unknown' };

await step('Tur 5 kilidi: güvenlik listesinden sonra çift dokunuşun ikincisi alt tip sorusunu yanıtlamaz', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_CANAL_UNKNOWN } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  await unlocked(page);
  const t0 = Date.now();
  await page.getByTestId('redflags-none').click();
  // "Hiçbiri yok"tan hemen sonra alt tip sorusu kilitli açılır; hemen gelen dokunuş yanıtlamaz.
  await tapWhileLocked(page, 'Tetikleyen hareket', t0, 800);
  await snap(page, 'secenek-cift-dokunus');
  if (await page.getByTestId('prep').count()) throw new Error('kilitliyken dokunuş alt tip sorusunu geçip hazırlığa götürdü');
  // Bilinçli yanıt kilit kalkınca çalışır.
  await answerSubtype(page, 'liedown');
  await page.getByTestId('prep').waitFor();
  const ep = (await storeOf(page)).episodes.at(-1);
  if (ep?.subtype?.trigger !== 'liedown') throw new Error('alt tip yanıtı kaydedilmedi: ' + JSON.stringify(ep?.subtype));
  const rf = ep.redFlags.at(-1);
  if (!rf || rf.stopped || Object.values(rf.answers).some((v) => v === true)) throw new Error('güvenlik listesi yanıtı yanlış: ' + JSON.stringify(rf));
  noErrors(errors);
  await ctx.close();
});

await step('Tur 5 kilidi: sık tekrar uyarısı varken güvenlik listesinin "Hiçbiri yok" düğmesi iPhone 13 ekranında görünür', async () => {
  const now = Date.now();
  const DAY = 24 * 3600e3;
  // Son 6 ayda 4 kapanmış atak (+ yeni atak): sık tekrar uyarısı güvenlik listesinde gösterilir.
  const past = [8, 35, 70, 120].map((d, i) => ({
    id: 'old' + i,
    startedAt: now - d * DAY,
    endedAt: now - d * DAY + 3600e3,
    side: 'R',
    protocolId: 'epley',
    redFlags: [],
    sideTests: [],
    maneuvers: [],
    retests: [],
    status: 'resolved'
  }));
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: past } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  await page.getByTestId('recurrence-warning').waitFor();
  const vp = page.viewportSize();
  const b = await page.getByTestId('redflags-none').boundingBox();
  if (!b || b.y < 0 || b.y + b.height > vp.height || b.x < 0 || b.x + b.width > vp.width) {
    throw new Error(`"Hiçbiri yok" görünür alanın dışında: ${JSON.stringify(b)} (ekran ${vp.width}×${vp.height})`);
  }
  const scrolled = await page.evaluate(() => window.scrollY);
  if (scrolled !== 0) throw new Error('güvenlik listesi sayfa kaydırılmış olarak açıldı: ' + scrolled);
  await snap(page, 'sik-tekrar-liste');
  noErrors(errors);
  await ctx.close();
});

// ------------------------------------------------------------------------------------------------
// Kullanıcı turu 6 (k06 #1): elle denenip testle korunmayan kalan davranışlar da uçtan uca kilit altında.

await step('Tur 6 kilidi (tek ekran liste): sistem geri tuşu ana ekrana döner; yarım atak ya da yanıt kaydı açılmaz, yeniden başlayınca liste temiz', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags').waitFor();
  await page.getByTestId('rf-neuro').click();
  await page.getByTestId('redflags-continue').waitFor();
  await page.evaluate(() => history.back());
  await page.getByTestId('start-episode').waitFor({ timeout: 5000 });
  if (page.url().includes('#/hasta/atak/')) throw new Error('geri tuşu akışta kaldı: ' + page.url());
  if ((await storeOf(page)).episodes.length) throw new Error('geri dönülen listeden atak/yanıt kaydı açıldı');
  await page.getByTestId('start-episode').click();
  await page.getByTestId('redflags-none').waitFor();
  if ((await page.getByTestId('rf-neuro').getAttribute('aria-checked')) === 'true') throw new Error('eski işaret yeni listede duruyor');
  await snap(page, 'geri-tusu-liste');
  noErrors(errors);
  await ctx.close();
});

await step('Tur 6 kilidi: yarıda bırakılan atağa 6 saat içinde devamda alt tip sorusu yeniden sorulmaz; sonra sorulur', async () => {
  const now = Date.now();
  /** Güvenlik soruları yarım saat önce, alt tip `subtypeAgoMin` dakika önce yanıtlanmış; taraf testi yapılmamış atak. */
  const halfDone = (subtypeAgoMin) => ({
    id: 'sub',
    startedAt: now - (subtypeAgoMin + 5) * MIN,
    side: null,
    protocolId: 'epley',
    redFlags: [{ at: now - 30 * MIN, answers: {}, stopped: false }],
    sideTests: [],
    maneuvers: [],
    retests: [],
    status: 'active',
    subtype: { at: now - subtypeAgoMin * MIN, trigger: 'liedown', duration: 'short' }
  });
  for (const [ago, wantSubtype] of [
    [40, false],
    [7 * 60, true]
  ]) {
    const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_CANAL_UNKNOWN, episodes: [halfDone(ago)] } }));
    await page.goto(BASE + '#/hasta');
    await page.getByTestId('start-episode').click();
    await page.locator('[data-testid="prep"], [data-testid="subtype-liedown"], [data-testid="redflags"]').first().waitFor({ timeout: 10000 });
    if (await page.getByTestId('redflags').count()) throw new Error('yanıtı taze güvenlik listesi yeniden açıldı');
    const asked = await page.getByRole('radiogroup', { name: 'Tetikleyen hareket' }).isVisible().catch(() => false);
    if (asked !== wantSubtype) throw new Error(`${ago} dk önce yanıtlanan alt tipte soru ${asked ? 'soruldu' : 'sorulmadı'}`);
    if (!wantSubtype) await snap(page, 'alt-tip-hatirlandi');
    noErrors(errors);
    await ctx.close();
  }
});

await step('Tur 6 kilidi: manevra yapılan gün sınırı doluyken ana ekranda gün sınırı satırı + başlat; akışta uyarı, "Yine de devam et" DOSE kaydı', async () => {
  const now = Date.now();
  const DAY = 24 * 3600e3;
  // Varsayılan doz (reçetesiz): en çok 3 farklı günde manevra. Son 3 günün her birinde birer manevra; bugün 4. gün olurdu.
  const ep = {
    id: 'days',
    startedAt: now - 3 * DAY - 10 * MIN,
    side: 'R',
    protocolId: 'epley',
    redFlags: [],
    sideTests: [],
    maneuvers: [3, 2, 1].map((d) => ({ ...maneuverAgo('d' + d, 0), at: now - d * DAY })),
    retests: [],
    status: 'resolved',
    endedAt: now - DAY + 30 * MIN
  };
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [ep] } }));
  await page.goto(BASE + '#/hasta');
  const card = page.getByTestId('home-dose-limit');
  await card.waitFor();
  const t = await card.innerText();
  if (!t.includes('önerilen gün sayısı doldu') || !t.includes('Hekiminize')) throw new Error('gün sınırı satırı eksik: ' + t);
  if (t.includes('Bugünlük')) throw new Error('gün sınırı günlük sınır gibi yazıldı: ' + t);
  await page.getByTestId('start-episode').waitFor();
  await snap(page, 'gun-siniri-satiri');
  await page.getByTestId('start-episode').click();
  const warn = page.getByTestId('dose-warn');
  await warn.waitFor();
  if (!(await warn.innerText()).includes('gün sayısı doldu')) throw new Error('akışta gün sınırı metni yok');
  if ((await page.getByTestId('redflags').count()) || (await page.getByTestId('prep').count())) throw new Error('uyarı gösterilmeden akış açıldı');
  if ((await storeOf(page)).episodes.length !== 1) throw new Error('uyarı aşılmadan yeni atak açıldı');
  await unlocked(page);
  await page.getByTestId('dose-override').click();
  await answerRedFlags(page);
  await page.getByTestId('prep').waitFor();
  const st = await storeOf(page);
  const cur = st.episodes.find((e) => e.id !== 'days');
  if (!cur || !kindsOf(cur).includes('DOSE')) throw new Error('yeni atakta DOSE kaydı yok: ' + JSON.stringify(cur?.overrides));
  noErrors(errors);
  await ctx.close();
});
/** Sayfanın görünürlüğünü değiştirir (telefonda uygulama arka plana alınıp geri gelince olduğu gibi). */
async function setHidden(page, hidden) {
  await page.evaluate((h) => {
    if (h) Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    else delete document.visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

/** Sayfa kapatılmak/yenilenmek istenirse tarayıcı uyarır mı (kayıtlı `beforeunload` işleyicisi olayı iptal ediyor mu)? */
const unloadWarns = (page) =>
  page.evaluate(() => {
    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });

await step('Tur 6 kilidi: manevra sırasında uygulama arka plana alınınca yürütücü duraklar; geri gelince kendiliğinden sürmez', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await startManeuver(page);
  await setHidden(page, true);
  await waitPhase(page, ['paused'], 5000);
  await setHidden(page, false);
  await page.waitForTimeout(800);
  if ((await page.getByTestId('runner').getAttribute('data-phase')) !== 'paused') throw new Error('görünür olunca yürütücü kendiliğinden sürdü');
  await page.getByTestId('runner-paused').waitFor();
  await snap(page, 'arka-plan-duraklatma');
  await page.getByTestId('runner-resume').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="runner"]')?.getAttribute('data-phase') !== 'paused');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Tur 6 kilidi: manevra sürerken sayfayı kapatma/yenileme uyarısı var; manevra öncesi ve bitince yok', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('start-episode').waitFor();
  if (await unloadWarns(page)) throw new Error('ana ekranda kapatma uyarısı var');
  await startManeuver(page);
  if (!(await unloadWarns(page))) throw new Error('manevra sürerken kapatma uyarısı (beforeunload) yok');
  // Duraklatılmışken de manevra bitmemiştir: uyarı sürer.
  await page.getByTestId('runner-pause').press('Enter');
  await waitPhase(page, ['paused']);
  if (!(await unloadWarns(page))) throw new Error('duraklatılmış manevrada kapatma uyarısı yok');
  await page.getByTestId('runner-resume').click();
  const phase = await driveRunner(page);
  if (phase !== 'done') throw new Error('manevra tamamlanmadı: ' + phase);
  if (await unloadWarns(page)) throw new Error('manevra bitince kapatma uyarısı kalkmadı');
  if (errors.length) throw new Error('konsol hataları: ' + errors.join(' | '));
  await ctx.close();
});

await step('Yeni kullanıcı turu 1 (y01 #6): manevra sürerken sayfa yenilenince yarım manevra "yarıda kaldı (adım n)" olarak atağa ve rapora yazılır', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await startManeuver(page);
  await holdAtStep(page, 1);
  let ep = (await storeOf(page)).episodes[0];
  if ((ep.pendingManeuver?.records?.length ?? 0) < 2) throw new Error('manevra sürerken ara kayıt yok: ' + JSON.stringify(ep.pendingManeuver ?? null).slice(0, 200));
  // Kapatma uyarısı (beforeunload) onaylanır: kullanıcı sayfayı gerçekten yeniledi/kapattı.
  page.on('dialog', (d) => void d.accept().catch(() => undefined));
  await page.reload();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('dengeyol:v1')).episodes[0].maneuvers.length > 0, null, { timeout: 15000 });
  ep = (await storeOf(page)).episodes[0];
  const m = ep.maneuvers[0];
  if (ep.pendingManeuver || m.completed || m.stopReason !== 'INTERRUPTED' || !m.recovered || m.records.length < 2) {
    throw new Error('yarım manevra kaydı: ' + JSON.stringify({ p: !!ep.pendingManeuver, c: m.completed, s: m.stopReason, r: m.recovered, n: m.records.length }));
  }
  await page.goto(BASE + '#/hasta/rapor/' + ep.id);
  const rep = await page.getByTestId('episode-report').innerText();
  if (!/yarıda kaldı \(\d+\. adımda uygulama kapandı ya da yenilendi\)/.test(rep)) throw new Error('raporda yarım manevra yok: ' + rep.slice(0, 800));
  noErrors(errors);
  await ctx.close();
});

/** Manevrayı `stepIndex` adımında tutma fazına getirir (demo başı hedefe götürerek). */
async function holdAtStep(page, stepIndex, timeout = 30000) {
  if (!(await page.getByTestId('sim-panel').isVisible().catch(() => false))) await page.getByTestId('sim-open').click();
  const t0 = Date.now();
  let last = -1;
  while (Date.now() - t0 < timeout) {
    const r = page.getByTestId('runner');
    const st = Number(await r.getAttribute('data-step'));
    const phase = await r.getAttribute('data-phase');
    if (st === stepIndex && phase === 'holding') return;
    if (st !== last && phase !== 'between') {
      last = st;
      await page.getByTestId('sim-goto').click();
    }
    await page.waitForTimeout(120);
  }
  throw new Error(`${stepIndex}. adımın tutma fazına gelinmedi`);
}

await step('Yürütücü: uzun baş dönmesinde uyarı (112 ile) bekler; "Devam et" VERTIGO_TOO_LONG kaydıyla sürer, "Durdur" durdurur', async () => {
  // ×20: 2 dakikalık sınır gerçek 6 s.
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient' }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await startManeuver(page);
  // Epley 2. adım (sarkık baş): baş dönmesi başladı, bitişi işaretlenmiyor.
  await holdAtStep(page, 1);
  // Kullanıcının göreceği ekran: demo paneli kapalı (uyarı sayfasını örtmesin).
  await page.getByTestId('sim-panel').getByRole('button', { name: 'Kapat' }).click();
  await page.getByTestId('vertigo-pad').click();
  const hold = page.getByTestId('runner-safety-hold');
  // Uyarı açılır açılmaz gelen kör dokunuş ("baş dönmesi geçti" diye ekrana dokunan hasta) seçim yapmaz.
  await hold.waitFor({ timeout: 20000, state: 'attached' });
  const holdVisible = Date.now();
  const contBox = await page.getByTestId('runner-hold-continue').boundingBox();
  const stopBox = await page.getByTestId('runner-hold-stop').boundingBox();
  for (const b of [stopBox, contBox]) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  if (Date.now() - holdVisible > 900) throw new Error('kör dokunuş geç yapıldı (sınama geçersiz)');
  await page.waitForTimeout(300);
  if ((await page.getByTestId('runner').getAttribute('data-phase')) !== 'safetyHold') throw new Error('uyarı açılır açılmaz gelen kör dokunuş seçim yaptı');
  if ((await hold.getAttribute('data-reason')) !== 'VERTIGO_TOO_LONG') throw new Error('uyarı nedeni: ' + (await hold.getAttribute('data-reason')));
  if ((await page.getByTestId('runner').getAttribute('data-phase')) !== 'safetyHold') throw new Error('yürütücü beklemede değil');
  await page.getByTestId('runner-hold-112').waitFor();
  // Önerilen yol "Durdur" büyük dolu birincil; "Devam et" çerçeveli ikincil (yeni kullanıcı turu 1, L1-4).
  if ((await page.getByTestId('runner-hold-stop').getAttribute('data-variant')) !== 'primary') throw new Error('"Durdur" birincil düğme değil');
  if ((await page.getByTestId('runner-hold-continue').getAttribute('data-variant')) !== 'secondary') throw new Error('"Devam et" ikincil düğme değil');
  if (!(await page.getByTestId('runner-hold-stop').evaluate((b) => b.classList.contains('primary')))) throw new Error('"Durdur" dolu değil');
  await page.getByTestId('runner-safety-hold-hint').waitFor();
  // Kendiliğinden seçim yok: bir süre sonra da bekliyor, kayıt yazılmadı.
  await page.waitForTimeout(1500);
  if ((await page.getByTestId('runner').getAttribute('data-phase')) !== 'safetyHold') throw new Error('uyarı kendiliğinden kapandı');
  await snap(page, 'yurutucu-guvenlik-uyarisi');
  await unlocked(page);
  await page.getByTestId('runner-hold-continue').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="runner"]')?.getAttribute('data-phase') !== 'safetyHold');
  let ep = (await storeOf(page)).episodes[0];
  if (kindsOf(ep).filter((k) => k === 'VERTIGO_TOO_LONG').length !== 1) throw new Error('"Devam et" VERTIGO_TOO_LONG kaydı yazmadı: ' + kindsOf(ep).join(', '));
  if (ep.maneuvers.length) throw new Error('"Devam et" manevrayı bitirdi');
  // Baş dönmesi sürüyor: bir sınır daha sonra yeniden uyarı; bu kez ekrana bakmadan "Durdur" (y07): kısa kör dokunuş bir
  // şey seçmez, ekranın herhangi bir yerine 2 s basılı tutmak durdurur.
  await hold.waitFor({ timeout: 20000 });
  await unlocked(page);
  const textBox = await page.getByTestId('runner-safety-hold-text').boundingBox();
  await page.mouse.click(textBox.x + textBox.width / 2, textBox.y + textBox.height / 2);
  await page.waitForTimeout(300);
  if ((await page.getByTestId('runner').getAttribute('data-phase')) !== 'safetyHold') throw new Error('kısa kör dokunuş seçim yaptı');
  // Kısa basış (1 s) da seçmez.
  await page.mouse.move(textBox.x + textBox.width / 2, textBox.y + textBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();
  await page.waitForTimeout(300);
  if ((await page.getByTestId('runner').getAttribute('data-phase')) !== 'safetyHold') throw new Error('1 s basış seçim yaptı');
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await page.getByTestId('end-safety').waitFor({ timeout: 15000 });
  await page.getByTestId('end-retry').waitFor();
  ep = (await storeOf(page)).episodes[0];
  const m = ep.maneuvers.at(-1);
  if (!m || m.completed || m.stopReason !== 'VERTIGO_TOO_LONG') throw new Error('durdurulan manevra kaydı: ' + JSON.stringify(m && { c: m.completed, r: m.stopReason }));
  if (kindsOf(ep).filter((k) => k === 'VERTIGO_TOO_LONG').length !== 1) throw new Error('"Durdur" aşma kaydı yazdı');
  noErrors(errors);
  await ctx.close();
});

await step('Yeni kullanıcı turu 1 kilidi: duraklatmadan "Devam et"e çift dokunuş baş dönmesi işaretlemez; hızlı çift dokunuş işareti açık bırakmaz; tek dokunuş işaretler', async () => {
  // ×4: Epley sarkık baş adımı (45 s) gerçek ~11 s; çift dokunuş ve 1 s bekleme adım içinde kalır.
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient', timeScale: 4 }, data: { patient: PATIENT_OK, episodes: [readyEpisode()] } }));
  await startManeuver(page);
  await holdAtStep(page, 1, 60000);
  await page.getByTestId('sim-panel').getByRole('button', { name: 'Kapat' }).click();
  await page.getByTestId('runner-pause').press('Enter');
  await waitPhase(page, ['paused']);
  await page.getByTestId('runner-resume').dblclick();
  await page.waitForFunction(() => document.querySelector('[data-testid="runner"]')?.getAttribute('data-phase') !== 'paused');
  await page.waitForTimeout(300);
  if ((await page.getByTestId('vertigo-pad').getAttribute('aria-pressed')) === 'true') throw new Error('"Devam et"e çift dokunuşun ikincisi baş dönmesi işaretledi');
  await page.waitForTimeout(1200);
  // Titreyen elle hızlı çift dokunuş (y02): başlatma işareti geri alınır, baş dönmesi "açık" kalmaz.
  await page.getByTestId('vertigo-pad').dblclick();
  await page.waitForTimeout(300);
  if ((await page.getByTestId('vertigo-pad').getAttribute('aria-pressed')) === 'true') throw new Error('hızlı çift dokunuş baş dönmesini açık bıraktı');
  await page.waitForTimeout(1200);
  await page.getByTestId('vertigo-pad').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="vertigo-pad"]')?.getAttribute('aria-pressed') === 'true', null, { timeout: 3000 });
  noErrors(errors);
  await ctx.close();
});

await step('Tur 6 kilidi: konuşma sürerken ileri ya da geri geçilince ses susar (yeni ekran eski cümleyi duymaz)', async () => {
  const { ctx, page, errors } = await newPage(seed({ settings: { role: 'patient', speech: true }, data: { patient: PATIENT_OK } }), { speechMs: 6000 });
  // Geri düğmesi: Ayarlar'da "Sesi dene" konuşurken geri basılır.
  await page.goto(BASE + '#/hasta');
  await page.getByTestId('nav-settings').click();
  await page.getByRole('button', { name: /Sesi dene/ }).click();
  await page.waitForFunction(() => window.speechSynthesis.__busy(), null, { timeout: 3000 });
  await page.getByRole('button', { name: 'Geri' }).click();
  await page.waitForTimeout(150);
  if (await page.evaluate(() => window.speechSynthesis.__busy())) throw new Error('geri basınca önceki ekranın konuşması sürdü');
  // İleri düğmesi: konuşma sürerken herhangi bir düğmeye basılır (Ayarlar'a gidiş), eski cümle kesilir.
  await page.getByTestId('nav-settings').click();
  await page.getByRole('button', { name: /Sesi dene/ }).click();
  await page.waitForFunction(() => window.speechSynthesis.__busy(), null, { timeout: 3000 });
  await page.evaluate(() => { location.hash = '#/hasta'; });
  await page.waitForTimeout(150);
  if (await page.evaluate(() => window.speechSynthesis.__busy())) throw new Error('sayfa değişince konuşma sürdü');
  if (errors.length) throw new Error('konsol hatası: ' + errors.join(' | '));
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
