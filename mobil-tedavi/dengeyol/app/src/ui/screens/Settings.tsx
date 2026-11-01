import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { contraindicationsFor } from '../../core/safety';
import { rxCanalName } from '../../core/prescription';
import { speech, Speech, SPEECH_RATES, SPEECH_SAMPLE } from '../../platform/speech';
import { tones } from '../../platform/tones';
import { haptics } from '../../platform/haptics';
import { applySettings, unlockAudio } from '../../platform/feedback';
import { store, useData } from '../../state/store';
import type { PatientProfile, Settings as S } from '../../state/types';
import { Segmented } from '../components/Controls';
import { HapticLegend } from '../components/HapticLegend';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { CONSENT_VERSION, consentLine } from './patient/consent';

/**
 * Tanı bilgisinin tek satırlık özeti (Ayarlar): kurulum artık tanı sormaz; bilgi isteğe bağlı olarak buradan girilir.
 */
export function patientInfoSummary(p: PatientProfile | undefined): { dx: string; contra: string } {
  const rx = p?.prescription;
  const sideTxt = (s: string | undefined) => (s === 'R' ? 'sağ kulak' : s === 'L' ? 'sol kulak' : 'kulak bilinmiyor');
  const canalTxt = (c: string | undefined) => (c === 'PC' ? 'arka kanal' : c === 'HC' ? 'yatay kanal' : 'kanal bilinmiyor');
  const dx = rx
    ? `Reçete: ${sideTxt(rx.side)}, ${rxCanalName(rx)}`
    : p?.diagnosedByDoctor
      ? `Hekim tanısı: ${canalTxt(p.canal)}, ${sideTxt(p.side)}`
      : 'Girilmedi (her atakta iki taraf test edilir)';
  const items = contraindicationsFor(p?.contraindications ?? []);
  return { dx, contra: items.length ? items.map((c) => c.label).join(', ') : 'İşaretlenmedi' };
}

export function Settings() {
  const d = useData();
  const s = d.settings;
  const nav = useNavigate();
  const { hash } = useLocation();
  // "#tani" ile gelindiyse (ana ekrandaki "Tanımı gir") tanı bölümü görünür olsun.
  useEffect(() => {
    if (hash !== '#tani') return;
    const el = document.getElementById('tani');
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start' });
  }, [hash]);
  const info = patientInfoSummary(d.patient);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const set = (p: Partial<S>) => store.update((x) => ({ ...x, settings: { ...x.settings, ...p } }));

  const testSound = () => {
    unlockAudio();
    applySettings({ ...s });
    tones.play('test');
    haptics.play('reached');
    // Seçili hızla örnek bir yönerge: kullanıcı hızın kendisine uyup uymadığını duyar.
    speech.speak(SPEECH_SAMPLE, 'high');
  };

  const exportData = () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dengeyol-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const importData = (f: File | undefined) => {
    if (!f) return;
    void f.text().then((t) => {
      if (!store.importJson(t)) alert('Dosya okunamadı ya da DengeYol yedeği değil.');
    });
  };

  return (
    <Screen title="Ayarlar" back={true}>
      {s.role === 'patient' && d.patient?.consentAt && (
        <section className="card stack" id="tani" data-testid="settings-patient-info">
          <h3>Tanı ve sağlık bilgilerim</h3>
          <p className="small muted">İsteğe bağlı. Girerseniz uygulama hekiminizin söylediğini dikkate alır; girmezseniz her atakta iki tarafı test eder.</p>
          <dl className="kv small">
            <dt>Tanı</dt>
            <dd data-testid="settings-dx">{info.dx}</dd>
            <dt>Dikkat edilecek durum</dt>
            <dd data-testid="settings-contra">{info.contra}</dd>
          </dl>
          <button className="btn secondary" onClick={() => nav('/hasta/kurulum?adim=tani')} data-testid="settings-edit-info">
            Bilgilerimi düzenle
          </button>
        </section>
      )}

      <section className="card stack">
        <h3>Ses ve geri bildirim</h3>
        <label className="row">
          <input type="checkbox" checked={s.speech} onChange={(e) => set({ speech: e.target.checked })} />
          <span className="grow">Sesli yönergeler</span>
        </label>
        {!Speech.supported() && <p className="small muted">Bu tarayıcı sesli okumayı desteklemiyor.</p>}
        {Speech.supported() && !speech.hasTurkishVoice() && (
          <p className="small muted">Cihazda Türkçe ses bulunamadı; varsayılan ses kullanılacak. Telefonun ayarlarından Türkçe metin okuma sesi yükleyebilirsiniz.</p>
        )}
        <div className="field">
          <label>Konuşma hızı</label>
          <Segmented
            label="Konuşma hızı"
            value={s.speechRate}
            onChange={(v) => set({ speechRate: v })}
            options={SPEECH_RATES}
          />
        </div>
        <label className="row">
          <input type="checkbox" checked={s.guidanceTone} onChange={(e) => set({ guidanceTone: e.target.checked })} />
          <span className="grow">Yaklaşma sesi (hedefe yaklaştıkça hızlanan bip)</span>
        </label>
        <label className="row">
          <input type="checkbox" checked={s.haptics} onChange={(e) => set({ haptics: e.target.checked })} />
          <span className="grow">Titreşim {haptics.supported() ? '' : '(bu cihazda desteklenmiyor)'}</span>
        </label>
        <button className="btn secondary" onClick={testSound}>
          <Icon name="volume" /> Sesi dene
        </button>
      </section>

      <section className="card stack" id="titresimler">
        <details>
          <summary>
            <strong>Titreşimleri tanı</strong>
          </summary>
          <p className="small muted" style={{ marginTop: 6 }}>
            Sesi duymakta zorlanıyorsanız manevrada ne zaman hareket edeceğinizi titreşimlerden anlayabilirsiniz. Her düğme o anlamın titreşimini çalar.
          </p>
          <HapticLegend />
        </details>
      </section>

      <section className="card stack">
        <h3>Görünüm</h3>
        <div className="field">
          <label>Yazı boyutu</label>
          <Segmented
            label="Yazı boyutu"
            value={s.fontScale}
            onChange={(v) => set({ fontScale: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'large', label: 'Büyük' },
              { value: 'xlarge', label: 'Çok büyük' }
            ]}
          />
        </div>
        <div className="field">
          <label>Tema</label>
          <Segmented
            label="Tema"
            value={s.theme}
            onChange={(v) => set({ theme: v })}
            options={[
              { value: 'auto', label: 'Otomatik' },
              { value: 'light', label: 'Açık' },
              { value: 'dark', label: 'Koyu' }
            ]}
          />
        </div>
      </section>

      <section className="card stack">
        <h3>Kullanım modu</h3>
        <p className="small muted">Şu an: {s.role === 'clinician' ? 'Klinisyen' : s.role === 'patient' ? 'Hasta' : 'seçilmedi'}</p>
        {s.role === 'patient' && (
          <>
            <div className="field" data-testid="settings-assist">
              <label>Manevrayı kim yaptırıyor?</label>
              <Segmented
                label="Manevrayı kim yaptırıyor"
                value={s.assist ?? 'self'}
                onChange={(v) => set({ assist: v })}
                options={[
                  { value: 'self', label: 'Kendim' },
                  { value: 'helper', label: 'Bir yakınım' }
                ]}
              />
            </div>
            {d.patient?.consentAt && (
              <p className="small muted" data-testid="settings-consent">
                Onam: {consentLine(d.patient)}
                {(d.patient.consentVersion ?? '1') !== CONSENT_VERSION ? ' — bilgilendirme metni güncellendi; yeniden okuyup onaylayabilirsiniz.' : ''}
              </p>
            )}
            {d.patient?.consentAt && (
              <button className="btn ghost" onClick={() => nav('/hasta/kurulum?adim=baslangic')}>
                Bilgilendirme ve onamı yeniden oku
              </button>
            )}
          </>
        )}
        <button
          className="btn secondary"
          onClick={() => {
            set({ role: null });
            nav('/', { replace: true });
          }}
        >
          Modu değiştir
        </button>
      </section>

      <section className="card stack">
        <h3>Demo modu</h3>
        <p className="small muted">
          Gerçek sensör yerine ekrandan kontrol edilen sanal bir baş kullanılır. Yalnızca uygulamayı tanıtmak ve denemek içindir; tedavi amaçlı kullanılmaz.
        </p>
        <label className="row">
          <input type="checkbox" checked={s.simulation} onChange={(e) => set({ simulation: e.target.checked, timeScale: 1 })} data-testid="sim-toggle" />
          <span className="grow">Demo modu</span>
        </label>
      </section>

      <section className="card stack">
        <h3>Veriler</h3>
        <p className="small muted">Tüm kayıtlar yalnızca bu cihazdadır. Yedek dosyası kişisel sağlık verisi içerir; güvenli saklayın.</p>
        <button className="btn secondary" onClick={exportData}>
          <Icon name="share" /> Yedeği indir (JSON)
        </button>
        <label className="btn secondary">
          Yedekten geri yükle
          <input type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </label>
        {!confirmWipe ? (
          <button className="btn ghost" style={{ color: 'var(--danger)' }} onClick={() => setConfirmWipe(true)}>
            <Icon name="trash" /> Tüm verileri sil
          </button>
        ) : (
          <div className="notice danger stack">
            <span>Tüm kayıtlar, ayarlar ve kalibrasyon kalıcı olarak silinecek. Emin misiniz?</span>
            <div className="row">
              <button
                className="btn danger grow"
                onClick={() => {
                  store.wipe();
                  nav('/', { replace: true });
                }}
              >
                Evet, sil
              </button>
              <button className="btn secondary grow" onClick={() => setConfirmWipe(false)}>
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </section>
      <button className="btn ghost" onClick={() => nav('/hakkinda')}>
        <Icon name="info" /> Hakkında, kaynaklar ve yasal uyarı
      </button>
    </Screen>
  );
}
