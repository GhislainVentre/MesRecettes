import { SNOOZE_MS, formatSize, isNewer, parseBuild, parseRelease, shouldPropose } from '../updates';

const github = {
  tag_name: 'build-42',
  name: 'MesRecettes 1.0.42',
  body: 'Choix « en pot » ou « en pleine terre ».',
  draft: false,
  prerelease: false,
  assets: [
    { name: 'notes.txt', browser_download_url: 'https://example.test/notes.txt', size: 10 },
    { name: 'MesRecettes.apk', browser_download_url: 'https://example.test/MesRecettes.apk', size: 51_300_000 },
  ],
};

describe('parseRelease', () => {
  it('lit le numéro de compilation et l’APK', () => {
    expect(parseRelease(github)).toEqual({
      build: 42,
      version: 'MesRecettes 1.0.42',
      notes: 'Choix « en pot » ou « en pleine terre ».',
      apkUrl: 'https://example.test/MesRecettes.apk',
      sizeBytes: 51_300_000,
    });
  });

  it('ignore les versions sans APK, mal étiquetées, brouillons ou préversions', () => {
    expect(parseRelease({ ...github, assets: [] })).toBeNull();
    expect(parseRelease({ ...github, tag_name: 'v1.0' })).toBeNull();
    expect(parseRelease({ ...github, draft: true })).toBeNull();
    expect(parseRelease({ ...github, prerelease: true })).toBeNull();
    expect(parseRelease(null)).toBeNull();
    expect(parseRelease({ message: 'Not Found' })).toBeNull();
  });

  it('donne un nom par défaut', () => {
    expect(parseRelease({ ...github, name: '', body: null })).toMatchObject({ version: 'Version 42', notes: '' });
  });
});

describe('isNewer', () => {
  const release = parseRelease(github);
  it('compare les numéros de compilation', () => {
    expect(isNewer(release, 41)).toBe(true);
    expect(isNewer(release, 42)).toBe(false);
    expect(isNewer(release, 50)).toBe(false);
  });
  it('ne propose rien hors APK ou sans version publiée', () => {
    expect(isNewer(release, null)).toBe(false);
    expect(isNewer(null, 1)).toBe(false);
  });
});

it('parseBuild', () => {
  expect(parseBuild('31')).toBe(31);
  expect(parseBuild(null)).toBeNull();
  expect(parseBuild('')).toBeNull();
  expect(parseBuild('1.0')).toBeNull();
});

it('shouldPropose respecte « Plus tard » pendant un jour pour la même version', () => {
  const release = parseRelease(github)!;
  const now = 1_000_000_000_000;
  expect(shouldPropose(release, null, now)).toBe(true);
  expect(shouldPropose(release, { build: 42, at: now - 1000 }, now)).toBe(false);
  expect(shouldPropose(release, { build: 42, at: now - SNOOZE_MS }, now)).toBe(true);
  expect(shouldPropose(release, { build: 41, at: now - 1000 }, now)).toBe(true);
});

it('formatSize', () => {
  expect(formatSize(51_300_000)).toBe('51 Mo');
  expect(formatSize(200)).toBe('1 Mo');
});
