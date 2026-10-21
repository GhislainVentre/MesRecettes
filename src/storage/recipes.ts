import AsyncStorage from '@react-native-async-storage/async-storage';

import { isCategory } from '../lib/categories';
import type { Recipe } from '../types';

const STORAGE_KEY = 'mesrecettes:recipes:v1';
const BACKUP_KEY = 'mesrecettes:recipes:corrupt';

export async function loadRecipes(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Format inattendu');
    const seen = new Set<string>();
    return parsed
      .filter(isRecipe)
      .filter((r) => !seen.has(r.id) && seen.add(r.id))
      .map(sanitize);
  } catch {
    // On garde une copie du contenu illisible plutôt que de l'écraser à la prochaine sauvegarde.
    await AsyncStorage.setItem(BACKUP_KEY, raw).catch(() => {});
    return [];
  }
}

function isRecipe(value: unknown): value is Recipe {
  return typeof value === 'object' && value !== null && typeof (value as Recipe).id === 'string';
}

function positive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Comble les champs manquants d'une entrée écrite par une ancienne version. */
function sanitize(recipe: Recipe): Recipe {
  const createdAt = typeof recipe.createdAt === 'string' ? recipe.createdAt : new Date().toISOString();
  return {
    id: recipe.id,
    title: typeof recipe.title === 'string' && recipe.title.trim() ? recipe.title : 'Ma recette',
    category: isCategory(recipe.category) ? recipe.category : 'autre',
    photoUri: typeof recipe.photoUri === 'string' ? recipe.photoUri : null,
    servings: positive(recipe.servings),
    prepMinutes: positive(recipe.prepMinutes),
    cookMinutes: positive(recipe.cookMinutes),
    ingredients: strings(recipe.ingredients),
    steps: strings(recipe.steps),
    notes: typeof recipe.notes === 'string' ? recipe.notes : '',
    favorite: recipe.favorite === true,
    createdAt,
    updatedAt: typeof recipe.updatedAt === 'string' ? recipe.updatedAt : createdAt,
  };
}

let pending: Promise<void> = Promise.resolve();

/** Les écritures sont enchaînées pour que la dernière version gagne toujours. */
export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  const write = pending.then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes)));
  pending = write.catch(() => {});
  await write;
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
