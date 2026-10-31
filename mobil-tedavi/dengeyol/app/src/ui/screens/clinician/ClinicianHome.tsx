import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ObservationMethod } from '../../../core/diagnosis';
import { formatDateTime } from '../../../state/episodes';
import { store, uid, useData } from '../../../state/store';
import type { ClinicExam, ClinicPatient } from '../../../state/types';
import { Segmented } from '../../components/Controls';
import { Icon, Logo } from '../../components/Icon';
import { Screen } from '../../components/Screen';

export function ClinicianHome() {
  const d = useData();
  const nav = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [code, setCode] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [sex, setSex] = useState<'K' | 'E' | '-'>('-');
  const [editProfile, setEditProfile] = useState(!d.clinician.name);
  const [name, setName] = useState(d.clinician.name ?? '');
  const [clinic, setClinic] = useState(d.clinician.clinic ?? '');
  const [sensorless, setSensorless] = useState(!!d.clinician.sensorless);
  const [method, setMethod] = useState<ObservationMethod | 'last'>(d.clinician.method ?? 'last');
  const [query, setQuery] = useState('');
  const norm = (s: string) => s.trim().toLocaleLowerCase('tr-TR');
  const existing = code.trim() ? d.clinicPatients.find((p) => norm(p.code) === norm(code)) : undefined;

  const allExams = [...d.clinicExams].sort((a, b) => b.at - a.at);
  const exams = query.trim()
    ? allExams.filter((e) => norm(d.clinicPatients.find((p) => p.id === e.patientId)?.code ?? '').includes(norm(query)))
    : allExams;
  const patientOf = (id: string) => d.clinicPatients.find((p) => p.id === id);

  const create = () => {
    // Aynı kodla kayıtlı hasta varsa yeni kayıt açılmaz; muayene o hastaya eklenir.
    if (existing) {
      const e: ClinicExam = { id: uid(), patientId: existing.id, at: Date.now(), findings: {}, maneuvers: [], retestFindings: {} };
      store.update((x) => ({ ...x, clinicExams: [...x.clinicExams, e] }));
      nav(`/odyolog/muayene/${e.id}`);
      return;
    }
    const byNum = Number(birthYear);
    const p: ClinicPatient = {
      id: uid(),
      code: code.trim() || `H-${(d.clinicPatients.length + 1).toString().padStart(3, '0')}`,
      birthYear: Number.isFinite(byNum) && byNum > 1900 && byNum <= new Date().getFullYear() ? byNum : undefined,
      sex,
      createdAt: Date.now()
    };
    const e: ClinicExam = { id: uid(), patientId: p.id, at: Date.now(), findings: {}, maneuvers: [], retestFindings: {} };
    store.update((x) => ({ ...x, clinicPatients: [...x.clinicPatients, p], clinicExams: [...x.clinicExams, e] }));
    nav(`/odyolog/muayene/${e.id}`);
  };

  return (
    <Screen
      title="Klinisyen modu"
      wide
      right={
        <button className="btn icon" aria-label="Ayarlar" onClick={() => nav('/ayarlar')}>
          <Icon name="settings" />
        </button>
      }
    >
      <div className="brand">
        <Logo size={40} />
        <div>
          <div className="name">DengeYol Klinik</div>
          <div className="small muted">Pozisyon testleri · manevra · ev reçetesi</div>
        </div>
      </div>

      {editProfile ? (
        <div className="card stack">
          <h3>Bilgileriniz (reçete ve raporlarda görünür)</h3>
          <div className="field">
            <label htmlFor="cn">Ad soyad, unvan</label>
            <input id="cn" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ör. Odyolog Ayşe Yılmaz / Dr. Can Demir" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="cc">Kurum</label>
            <input id="cc" className="input" value={clinic} onChange={(e) => setClinic(e.target.value)} placeholder="Ör. ... Hastanesi KBB / Odyoloji" maxLength={80} />
          </div>
          <label className="row">
            <input type="checkbox" className="check-lg" checked={sensorless} onChange={(e) => setSensorless(e.target.checked)} data-testid="clin-sensorless" />
            <span>
              Testlerde VNG / Frenzel gözlüğü kullanıyorum
              <span className="small muted" style={{ display: 'block' }}>
                Telefon alına konmaz; testler sensörsüz (zamanlayıcı ve elle onay) başlar.
              </span>
            </span>
          </label>
          <div className="field" data-testid="clin-method">
            <label>Bulgu formunda gözlem yöntemi hazır gelsin</label>
            <Segmented
              label="Varsayılan gözlem yöntemi"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'VNG', label: 'VNG' },
                { value: 'Frenzel', label: 'Frenzel' },
                { value: 'çıplak göz', label: 'Çıplak göz' },
                { value: 'last', label: 'Son muayenedeki' }
              ]}
            />
            <span className="small muted">Her formda değiştirilebilir; tanıyı etkilemez.</span>
          </div>
          <button
            className="btn primary"
            onClick={() => {
              store.update((x) => ({
                ...x,
                clinician: {
                  ...x.clinician,
                  name: name.trim() || undefined,
                  clinic: clinic.trim() || undefined,
                  sensorless: sensorless || undefined,
                  method: method === 'last' ? undefined : method
                }
              }));
              setEditProfile(false);
            }}
            data-testid="clin-save-profile"
          >
            Kaydet
          </button>
        </div>
      ) : (
        <div className="card soft row">
          <Icon name="steth" />
          <div className="grow">
            <strong>{d.clinician.name}</strong>
            <div className="small muted">
              {d.clinician.clinic}
              {d.clinician.sensorless ? ' · VNG/Frenzel (sensörsüz)' : ''}
              {d.clinician.method ? ` · gözlem: ${d.clinician.method}` : ''}
            </div>
          </div>
          <button className="btn ghost" onClick={() => setEditProfile(true)}>
            Düzenle
          </button>
        </div>
      )}

      {!showNew ? (
        <button className="big-action" onClick={() => setShowNew(true)} data-testid="clin-new">
          <Icon name="plus" size={34} />
          Yeni muayene
          <span className="sub">Dix-Hallpike · supine roll · tanı önerisi · manevra · reçete</span>
        </button>
      ) : (
        <div className="card stack">
          <h2>Yeni muayene</h2>
          <p className="small muted">Kişisel veriyi en aza indirmek için hasta adı yerine kurum içi bir kod kullanın.</p>
          <div className="field">
            <label htmlFor="pc">Hasta kodu</label>
            <input id="pc" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ör. protokol no ya da baş harfler" maxLength={30} data-testid="clin-code" />
          </div>
          <div className="row">
            <div className="field grow">
              <label htmlFor="by">Doğum yılı</label>
              <input id="by" className="input" inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Ör. 1961" />
            </div>
            <div className="field grow">
              <label>Cinsiyet</label>
              <Segmented
                label="Cinsiyet"
                value={sex}
                onChange={setSex}
                options={[
                  { value: 'K', label: 'K' },
                  { value: 'E', label: 'E' },
                  { value: '-', label: '—' }
                ]}
              />
            </div>
          </div>
          {existing && (
            <div className="notice info" data-testid="clin-existing">
              <Icon name="info" />
              <span>
                <strong>{existing.code}</strong> kodlu hasta kayıtlı. Yeni muayene bu hastaya eklenecek.
              </span>
            </div>
          )}
          <div className="row">
            <button className="btn primary grow" onClick={create} data-testid="clin-create">
              Muayeneyi başlat
            </button>
            <button className="btn secondary" onClick={() => setShowNew(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}

      <h3>Son muayeneler</h3>
      {allExams.length > 3 && (
        <input
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hasta kodu ile ara"
          aria-label="Hasta kodu ile ara"
          data-testid="clin-search"
        />
      )}
      {exams.length === 0 ? (
        <div className="card soft center muted">{allExams.length ? 'Bu kodla muayene yok.' : 'Henüz muayene yok.'}</div>
      ) : (
        <div className="list">
          {exams.slice(0, 50).map((e) => {
            const p = patientOf(e.patientId);
            return (
              <button key={e.id} className="list-item" onClick={() => nav(`/odyolog/muayene/${e.id}`)}>
                <div className="grow">
                  <strong>{p?.code ?? '—'}</strong>
                  <div className="sub">
                    {formatDateTime(e.at)} · {e.diagnosis?.label ?? 'tanı girilmedi'} · {e.maneuvers.filter((m) => m.completed).length} manevra
                  </div>
                </div>
                {e.prescriptionToken && <span className="chip primary">reçete</span>}
                <Icon name="chevron" />
              </button>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
