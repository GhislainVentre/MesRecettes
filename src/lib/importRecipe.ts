import type { Category } from '../types';
import { normalize, splitLines } from './recipes';

/** Ce qu'on a pu lire sur la page : de quoi pré-remplir le formulaire. */
export interface ImportedRecipe {
  title: string;
  category: Category | null;
  imageUrl: string | null;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredients: string[];
  steps: string[];
  sourceUrl: string;
}

export type ImportResult = { recipe: ImportedRecipe } | { error: string };

type Json = unknown;
type JsonObject = Record<string, Json>;

const isObject = (value: Json): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value);
const asArray = (value: Json): Json[] => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]);

/** Première adresse http(s) d'un texte : un partage contient souvent « Regarde ça https://… ». */
export function extractUrl(text: string): string | null {
  const match = /https?:\/\/[^\s<>"]+/i.exec(text);
  if (match) return match[0].replace(/[).,;!?»]+$/, '');
  const bare = text.trim();
  if (/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i.test(bare)) return `https://${bare}`;
  return null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  laquo: '«',
  raquo: '»',
  hellip: '…',
  deg: '°',
  oelig: 'œ',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  agrave: 'à',
  acirc: 'â',
  ccedil: 'ç',
  icirc: 'î',
  ocirc: 'ô',
  ucirc: 'û',
  ugrave: 'ù',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const value = code[1] === 'x' || code[1] === 'X' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(value) && value > 0 && value < 0x110000 ? String.fromCodePoint(value) : whole;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? whole;
  });
}

/** Texte lisible : sans balises, entités décodées, espaces resserrés. */
function cleanText(value: Json): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return decodeEntities(
    String(value)
      .replace(/<br\s*\/?>|<\/(?:p|li|div)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

/** « PT1H30M », « P0DT2H », « 45 » → minutes. */
export function parseDuration(value: Json): number | null {
  if (typeof value === 'number') return value > 0 ? Math.round(value) : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (/^\d+$/.test(text)) return Number(text) || null;
  const iso = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:\d+(?:\.\d+)?S)?)?$/i.exec(text);
  if (!iso) return null;
  const minutes = Number(iso[1] ?? 0) * 1440 + Number(iso[2] ?? 0) * 60 + Number(iso[3] ?? 0);
  return minutes > 0 ? Math.round(minutes) : null;
}

/** « 4 personnes », « 6 », ["4", "4 parts"] → 4. */
export function parseServings(value: Json): number | null {
  for (const item of asArray(value)) {
    if (typeof item === 'number' && item > 0) return Math.round(item);
    if (typeof item === 'string') {
      const match = /\d+/.exec(item);
      if (match && Number(match[0]) > 0) return Math.min(Number(match[0]), 9999);
    }
  }
  return null;
}

const CATEGORY_WORDS: [Category, RegExp][] = [
  ['aperitif', /aperitif|amuse|tapas|verrine/],
  ['entree', /entree|soupe|veloute|salade/],
  ['dessert', /dessert|gateau|patisserie|biscuit|cookie|confiserie|goute|viennoiserie|cake sucre|glace|sorbet/],
  ['boisson', /boisson|cocktail|smoothie|sirop|limonade/],
  ['sauce', /sauce|condiment|vinaigrette|marinade|pesto/],
  ['plat', /plat|accompagnement|pizza|quiche|tarte salee|gratin/],
];

export function guessCategory(value: Json): Category | null {
  const text = normalize(asArray(value).map(cleanText).join(' '));
  if (!text) return null;
  for (const [category, pattern] of CATEGORY_WORDS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function imageUrl(value: Json): string | null {
  for (const item of asArray(value)) {
    if (typeof item === 'string' && item.trim() && !item.startsWith('data:')) return item.trim();
    if (isObject(item)) {
      const url = imageUrl(item.url ?? item.contentUrl);
      if (url) return url;
    }
  }
  return null;
}

/** Les étapes : texte brut, liste de textes, HowToStep ou HowToSection (avec sous-étapes). */
function parseSteps(value: Json): string[] {
  const steps: string[] = [];
  for (const item of asArray(value)) {
    if (typeof item === 'string') {
      steps.push(...splitLines(cleanText(item)));
    } else if (isObject(item)) {
      if (item.itemListElement !== undefined) {
        steps.push(...parseSteps(item.itemListElement));
      } else {
        const text = cleanText(item.text ?? item.name ?? item.description);
        if (text) steps.push(...splitLines(text));
      }
    }
  }
  return steps;
}

function parseIngredients(value: Json): string[] {
  return asArray(value)
    .map((item) => cleanText(item).replace(/\s+/g, ' '))
    .filter((line) => line.length > 0);
}

function isRecipe(node: JsonObject): boolean {
  return asArray(node['@type']).some((t) => typeof t === 'string' && t.toLowerCase() === 'recipe');
}

/** Cherche un objet schema.org/Recipe, y compris dans @graph ou imbriqué (mainEntity…). */
function findRecipe(node: Json, depth = 0): JsonObject | null {
  if (depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (!isObject(node)) return null;
  if (isRecipe(node)) return node;
  for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item']) {
    if (node[key] !== undefined) {
      const found = findRecipe(node[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function jsonLdBlocks(html: string): Json[] {
  const blocks: Json[] = [];
  const pattern = /<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const raw = match[1].trim().replace(/^<!--|-->$/g, '');
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Certains sites laissent des retours à la ligne bruts dans les chaînes.
      try {
        blocks.push(JSON.parse(raw.replace(/[\r\n\t]+/g, ' ')));
      } catch {
        // Bloc illisible : on passe au suivant.
      }
    }
  }
  return blocks;
}

function metaContent(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const before = new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, 'i');
  const after = new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${escaped}["']`, 'i');
  const match = before.exec(html) ?? after.exec(html);
  return match ? cleanText(match[1]) || null : null;
}

function firstHeading(html: string): string | null {
  const match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return match ? cleanText(match[1]).replace(/\s+/g, ' ') || null : null;
}

/** Textes des éléments portant un itemprop donné (microdonnées, sites sans JSON-LD). */
function itemprops(html: string, name: string): string[] {
  const pattern = new RegExp(`<(\\w+)[^>]*itemprop\\s*=\\s*["']${name}["'][^>]*>([\\s\\S]*?)</\\1>`, 'gi');
  return [...html.matchAll(pattern)].map((m) => cleanText(m[2])).filter(Boolean);
}

/**
 * Le titre schema.org est parfois rallongé pour le référencement
 * (« Blanquette de veau : recette traditionnelle : la meilleure recette ») :
 * on garde le titre affiché sur la page s'il en est le début.
 */
function tidyTitle(name: string, heading: string | null): string {
  if (heading && heading.length < name.length && normalize(name).startsWith(normalize(heading))) return heading;
  return name;
}

function absoluteUrl(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    const resolved = new URL(url, base);
    return /^https?:$/.test(resolved.protocol) ? resolved.toString() : null;
  } catch {
    return null;
  }
}

/** Lit la recette d'une page HTML. Renvoie null si la page n'en contient pas. */
export function parseRecipeHtml(html: string, pageUrl: string): ImportedRecipe | null {
  const heading = firstHeading(html);
  let recipe: JsonObject | null = null;
  for (const block of jsonLdBlocks(html)) {
    recipe = findRecipe(block);
    if (recipe) break;
  }

  if (recipe) {
    const name = cleanText(recipe.name ?? recipe.headline) || heading || '';
    return {
      title: tidyTitle(name, heading),
      category: guessCategory([recipe.recipeCategory, recipe.recipeCourse].flat()),
      imageUrl: absoluteUrl(imageUrl(recipe.image) ?? metaContent(html, 'og:image'), pageUrl),
      servings: parseServings(recipe.recipeYield ?? recipe.yield),
      prepMinutes: parseDuration(recipe.prepTime),
      cookMinutes: parseDuration(recipe.cookTime),
      ingredients: parseIngredients(recipe.recipeIngredient ?? recipe.ingredients),
      steps: parseSteps(recipe.recipeInstructions),
      sourceUrl: pageUrl,
    };
  }

  // Repli : microdonnées, puis titre et image de la page.
  const ingredients = parseIngredients([...itemprops(html, 'recipeIngredient'), ...itemprops(html, 'ingredients')]);
  const steps = itemprops(html, 'recipeInstructions').flatMap((text) => splitLines(text));
  if (ingredients.length === 0 && steps.length === 0) return null;
  return {
    title: heading ?? metaContent(html, 'og:title') ?? '',
    category: null,
    imageUrl: absoluteUrl(metaContent(html, 'og:image'), pageUrl),
    servings: parseServings(itemprops(html, 'recipeYield')),
    prepMinutes: null,
    cookMinutes: null,
    ingredients,
    steps,
    sourceUrl: pageUrl,
  };
}

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';

/** Télécharge la page et en extrait la recette. */
export async function importRecipeFromUrl(input: string): Promise<ImportResult> {
  const url = extractUrl(input);
  if (!url) return { error: "Collez l'adresse complète de la recette, par exemple https://www.marmiton.org/recettes/…" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let html: string;
  let finalUrl = url;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'fr-FR,fr;q=0.9' },
      signal: controller.signal,
    });
    if (!response.ok) return { error: `Le site a répondu par une erreur (${response.status}). Vérifiez l'adresse.` };
    html = await response.text();
    if (response.url) finalUrl = response.url;
  } catch {
    return { error: "Impossible d'ouvrir la page. Vérifiez l'adresse et votre connexion internet." };
  } finally {
    clearTimeout(timeout);
  }

  const recipe = parseRecipeHtml(html, finalUrl);
  if (!recipe) return { error: "Aucune recette n'a été trouvée sur cette page. Le site n'est peut-être pas compatible." };
  return { recipe };
}
