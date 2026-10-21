import type { Recipe } from '../types';

/** « 1 h 15 », « 45 min » */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** Temps total (préparation + cuisson), ou null si aucun n'est renseigné. */
export function totalMinutes(recipe: Pick<Recipe, 'prepMinutes' | 'cookMinutes'>): number | null {
  if (recipe.prepMinutes === null && recipe.cookMinutes === null) return null;
  return (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
}

/** Une ligne par élément, sans lignes vides ni puces recopiées (« - », « • », « 1. »). */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^(?:[-•*·]|\d+[.)])\s+/, '').trim())
    .filter((line) => line.length > 0);
}

/** Minuscules sans accents, pour chercher « creme » et trouver « Crème brûlée ». */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Tous les mots cherchés apparaissent dans le titre, les ingrédients ou les notes. */
export function matchesSearch(recipe: Recipe, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize([recipe.title, ...recipe.ingredients, recipe.notes].join(' '));
  return words.every((word) => haystack.includes(word));
}

const UNICODE_FRACTIONS: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
const NICE_FRACTIONS: [number, string][] = [
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.5, '½'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
];

// Quantité en début de ligne : « 1 1/2 », « 3/4 », « 1,5 », « 200 », « ½ », « 1½ ».
const LEADING_QUANTITY = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?(?:\s*[¼½¾⅓⅔])?|[¼½¾⅓⅔])/;

function parseQuantity(text: string): number | null {
  const t = text.trim();
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(t);
  if (mixed) return Number(mixed[3]) ? Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]) : null;
  const fraction = /^(\d+)\/(\d+)$/.exec(t);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : null;
  const unicode = /^(\d+(?:[.,]\d+)?)?\s*([¼½¾⅓⅔])$/.exec(t);
  if (unicode) return (unicode[1] ? Number(unicode[1].replace(',', '.')) : 0) + UNICODE_FRACTIONS[unicode[2]];
  const value = Number(t.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** « 1,5 », « ½ », « 2 ¾ », « 250 » : arrondi à ce qui se mesure en cuisine. */
export function formatQuantity(value: number): string {
  if (value >= 10) return String(Math.round(value));
  const whole = Math.floor(value);
  const rest = value - whole;
  for (const [fraction, symbol] of NICE_FRACTIONS) {
    if (Math.abs(rest - fraction) < 0.04) return whole === 0 ? symbol : `${whole} ${symbol}`;
  }
  const rounded = Math.round(value * 10) / 10;
  return String(rounded).replace('.', ',');
}

/** Adapte la quantité en tête de ligne : « 200 g de farine » × 1,5 → « 300 g de farine ». */
export function scaleIngredient(line: string, factor: number): string {
  if (factor === 1) return line;
  const match = LEADING_QUANTITY.exec(line);
  if (!match) return line;
  const quantity = parseQuantity(match[1]);
  if (quantity === null || quantity === 0) return line;
  return formatQuantity(quantity * factor) + line.slice(match[1].length);
}

/** Ordre d'affichage : favoris d'abord, puis alphabétique. */
export function compareRecipes(a: Recipe, b: Recipe): number {
  if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
  return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
}
