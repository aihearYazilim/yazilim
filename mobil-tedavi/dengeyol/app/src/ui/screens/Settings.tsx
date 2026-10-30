import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { speech, Speech } from '../../platform/speech';
import { tones } from '../../platform/tones';
import { haptics } from '../../platform/haptics';
import { applySettings, unlockAudio } from '../../platform/feedback';
import { store, useData } from '../../state/store';
import type { Settings as S } from '../../state/types';
import { Segmented } from '../components/Controls';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';

export function Settings() {
  const d = useData();
  const s = d.settings;
  const nav = useNavigate();
  const [confirmWipe, setConfirmWipe] = useState(false);
  const set = (p: Partial<S>) => store.update((x) => ({ ...x, settings: { ...x.settings, ...p } }));

  const testSound = () => {
    unlockAudio();
    applySettings({ ...s });
    tones.play('test');
    haptics.play('reached');
    speech.speak('Ses testi. Bu sesi duyuyorsanız sesli yönergeler çalışıyor.', 'high');
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
            options={[
              { value: 0.8, label: 'Yavaş' },
              { value: 1, label: 'Normal' },
              { value: 1.15, label: 'Hızlı' }
            ]}
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
