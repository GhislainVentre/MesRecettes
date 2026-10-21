/** Dernière version publiée sur GitHub (dépôt public, sans clé). */
export const LATEST_RELEASE_URL = 'https://api.github.com/repos/GhislainVentre/MesRecettes/releases/latest';

/** Délai minimal entre deux vérifications automatiques. */
export const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
/** Après « Plus tard », on ne repropose pas la même version avant ce délai. */
export const SNOOZE_MS = 24 * 60 * 60 * 1000;

export interface AppRelease {
  /** Numéro de compilation (versionCode Android), tiré de l'étiquette « build-123 ». */
  build: number;
  version: string;
  notes: string;
  apkUrl: string;
  sizeBytes: number | null;
}

/** Lit la réponse de l'API GitHub ; null si ce n'est pas une version de l'appli avec son APK. */
export function parseRelease(json: unknown): AppRelease | null {
  const release = json as {
    tag_name?: unknown;
    name?: unknown;
    body?: unknown;
    draft?: unknown;
    prerelease?: unknown;
    assets?: { name?: unknown; browser_download_url?: unknown; size?: unknown }[];
  } | null;
  if (!release || release.draft || release.prerelease) return null;
  const tag = typeof release.tag_name === 'string' ? /^build-(\d+)$/.exec(release.tag_name) : null;
  if (!tag) return null;
  const apk = (Array.isArray(release.assets) ? release.assets : []).find(
    (asset) => typeof asset?.name === 'string' && asset.name.endsWith('.apk') && typeof asset.browser_download_url === 'string',
  );
  if (!apk) return null;
  const build = Number(tag[1]);
  return {
    build,
    version: typeof release.name === 'string' && release.name.trim() ? release.name.trim() : `Version ${build}`,
    notes: typeof release.body === 'string' ? release.body.trim() : '',
    apkUrl: apk.browser_download_url as string,
    sizeBytes: typeof apk.size === 'number' && apk.size > 0 ? apk.size : null,
  };
}

/** Numéro de compilation de l'appli installée ; null hors APK (web, développement). */
export function parseBuild(value: string | null | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const build = Number(value);
  return build > 0 ? build : null;
}

export function isNewer(release: AppRelease | null, installedBuild: number | null): release is AppRelease {
  return !!release && installedBuild !== null && release.build > installedBuild;
}

/** Faut-il proposer cette version maintenant (pas repoussée récemment par « Plus tard ») ? */
export function shouldPropose(
  release: AppRelease,
  snoozed: { build: number; at: number } | null,
  now: number = Date.now(),
): boolean {
  return !snoozed || snoozed.build !== release.build || now - snoozed.at >= SNOOZE_MS;
}

/** « 48 Mo » */
export function formatSize(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1_000_000))} Mo`;
}
