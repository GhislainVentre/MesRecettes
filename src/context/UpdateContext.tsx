import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Directory, File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import {
  CHECK_INTERVAL_MS,
  LATEST_RELEASE_URL,
  isNewer,
  parseBuild,
  parseRelease,
  shouldPropose,
  type AppRelease,
} from '../lib/updates';

const STORAGE_KEY = 'mesrecettes:updates:v1';
const APK_PREFIX = 'MesRecettes-';
// FLAG_GRANT_READ_URI_PERMISSION : l'installateur d'Android peut lire le fichier téléchargé.
const GRANT_READ_URI = 1;

interface Saved {
  lastCheck: number | null;
  snoozed: { build: number; at: number } | null;
}

export type CheckResult = 'available' | 'up-to-date' | 'error' | 'unsupported';

export type InstallState =
  | { step: 'idle' }
  | { step: 'downloading'; progress: number | null }
  | { step: 'installing' }
  | { step: 'error'; message: string };

interface UpdateContextValue {
  /** Numéro de version affiché (« 1.0.31 »), ou null hors APK. */
  installedVersion: string | null;
  /** Version plus récente à proposer maintenant, ou null. */
  proposed: AppRelease | null;
  install: InstallState;
  /** Vérification demandée par l'utilisateur : propose la mise à jour même repoussée. */
  checkNow: () => Promise<CheckResult>;
  /** Télécharge l'APK puis ouvre l'installateur d'Android. */
  installUpdate: () => Promise<void>;
  /** « Plus tard » : on reproposera cette version demain. */
  snooze: () => void;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

const SUPPORTED = Platform.OS === 'android';
const INSTALLED_BUILD = SUPPORTED ? parseBuild(Application.nativeBuildVersion) : null;

async function readSaved(): Promise<Saved> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<Saved>) : {};
    return { lastCheck: saved.lastCheck ?? null, snoozed: saved.snoozed ?? null };
  } catch {
    return { lastCheck: null, snoozed: null };
  }
}

async function fetchLatest(): Promise<AppRelease | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    // 404 : aucune version publiée pour l'instant.
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseRelease(await response.json());
  } finally {
    clearTimeout(timer);
  }
}

/** Efface les APK téléchargés lors des mises à jour précédentes. */
function cleanDownloads() {
  try {
    for (const entry of new Directory(Paths.cache).list()) {
      if (entry instanceof File && entry.name.startsWith(APK_PREFIX) && entry.name.endsWith('.apk')) entry.delete();
    }
  } catch {
    // Rien de grave : le système vide lui-même le cache.
  }
}

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [proposed, setProposed] = useState<AppRelease | null>(null);
  const [install, setInstall] = useState<InstallState>({ step: 'idle' });
  const saved = useRef<Saved>({ lastCheck: null, snoozed: null });
  const checking = useRef(false);

  const persist = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved.current)).catch(() => {});
  }, []);

  const check = useCallback(
    async (manual: boolean): Promise<CheckResult> => {
      if (!SUPPORTED || INSTALLED_BUILD === null) return 'unsupported';
      if (checking.current) return 'up-to-date';
      checking.current = true;
      try {
        const latest = await fetchLatest();
        saved.current.lastCheck = Date.now();
        persist();
        if (!isNewer(latest, INSTALLED_BUILD)) return 'up-to-date';
        if (manual || shouldPropose(latest, saved.current.snoozed)) setProposed(latest);
        return 'available';
      } catch {
        return 'error';
      } finally {
        checking.current = false;
      }
    },
    [persist],
  );

  // Vérification à chaque lancement, puis au retour dans l'appli au plus toutes les 6 heures.
  useEffect(() => {
    if (!SUPPORTED) return;
    let active = true;
    const autoCheck = () => {
      const last = saved.current.lastCheck;
      if (last === null || Date.now() - last >= CHECK_INTERVAL_MS) check(false);
    };
    readSaved().then((value) => {
      if (!active) return;
      saved.current = value;
      cleanDownloads();
      check(false);
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') autoCheck();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [check]);

  const installUpdate = useCallback(async () => {
    const release = proposed;
    if (!release || install.step === 'downloading' || install.step === 'installing') return;
    setInstall({ step: 'downloading', progress: null });
    try {
      const target = new File(Paths.cache, `${APK_PREFIX}${release.build}.apk`);
      if (target.exists) target.delete();
      let shown = -1;
      const apk = await File.downloadFileAsync(release.apkUrl, target, {
        idempotent: true,
        onProgress: ({ bytesWritten, totalBytes }) => {
          const total = totalBytes > 0 ? totalBytes : release.sizeBytes;
          if (!total) return;
          // Un rafraîchissement par pour cent, pas un par paquet reçu.
          const percent = Math.min(100, Math.floor((bytesWritten / total) * 100));
          if (percent === shown) return;
          shown = percent;
          setInstall({ step: 'downloading', progress: percent / 100 });
        },
      });
      setInstall({ step: 'installing' });
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: apk.contentUri,
        flags: GRANT_READ_URI,
        type: 'application/vnd.android.package-archive',
      });
      // Retour dans l'appli sans avoir installé (annulation) : on laisse la fenêtre ouverte.
      setInstall({ step: 'idle' });
    } catch {
      setInstall({ step: 'error', message: 'Téléchargement impossible. Vérifiez votre connexion et réessayez.' });
    }
  }, [proposed, install.step]);

  const snooze = useCallback(() => {
    if (proposed) {
      saved.current.snoozed = { build: proposed.build, at: Date.now() };
      persist();
    }
    setProposed(null);
    setInstall({ step: 'idle' });
  }, [proposed, persist]);

  const checkNow = useCallback(() => check(true), [check]);

  const value = useMemo(
    () => ({
      installedVersion: SUPPORTED ? Application.nativeApplicationVersion : null,
      proposed,
      install,
      checkNow,
      installUpdate,
      snooze,
    }),
    [proposed, install, checkNow, installUpdate, snooze],
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdates(): UpdateContextValue {
  const ctx = useContext(UpdateContext);
  if (!ctx) throw new Error('useUpdates doit être utilisé dans un UpdateProvider');
  return ctx;
}
