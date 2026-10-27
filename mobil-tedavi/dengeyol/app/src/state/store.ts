/**
 * Yerel veri deposu. Tüm veri yalnızca bu cihazda (localStorage) tutulur; ağa hiçbir veri gönderilmez.
 */
import { useSyncExternalStore } from 'react';
import { type AppData, DEFAULT_SETTINGS, emptyData } from './types';

const KEY = 'dengeyol:v1';

function safeParse(raw: string | null): AppData | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<AppData>;
    if (!d || typeof d !== 'object' || d.version !== 1) return null;
    const base = emptyData();
    return {
      ...base,
      ...d,
      settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
      episodes: Array.isArray(d.episodes) ? d.episodes : [],
      clinicPatients: Array.isArray(d.clinicPatients) ? d.clinicPatients : [],
      clinicExams: Array.isArray(d.clinicExams) ? d.clinicExams : [],
      clinician: d.clinician ?? {}
    } as AppData;
  } catch {
    return null;
  }
}

function load(): AppData {
  try {
    return safeParse(localStorage.getItem(KEY)) ?? emptyData();
  } catch {
    return emptyData();
  }
}

let data: AppData = load();
let storageOk = true;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    storageOk = true;
  } catch {
    storageOk = false;
  }
}

export const store = {
  get: (): AppData => data,
  update(fn: (d: AppData) => AppData) {
    data = fn(data);
    persist();
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  isPersistent: () => storageOk,
  exportJson: (): string => JSON.stringify(data, null, 2),
  importJson(text: string): boolean {
    const d = safeParse(text);
    if (!d) return false;
    data = d;
    persist();
    listeners.forEach((l) => l());
    return true;
  },
  wipe() {
    data = emptyData();
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* yok say */
    }
    listeners.forEach((l) => l());
  }
};

export function useData(): AppData {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function uid(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function activeEpisode(d: AppData) {
  return d.episodes.find((e) => e.status === 'active') ?? null;
}
