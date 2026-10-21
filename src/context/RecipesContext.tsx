import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { deletePhoto } from '../lib/photos';
import { createId, loadRecipes, saveRecipes } from '../storage/recipes';
import type { NewRecipe, Recipe } from '../types';

interface RecipesContextValue {
  recipes: Recipe[];
  loading: boolean;
  addRecipe: (recipe: NewRecipe) => Recipe;
  updateRecipe: (id: string, changes: Partial<NewRecipe>) => void;
  removeRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const recipesRef = useRef<Recipe[]>([]);
  const loadedRef = useRef(false);
  // Modifications faites avant la fin du chargement.
  const earlyUpdates = useRef<((current: Recipe[]) => Recipe[])[]>([]);

  useEffect(() => {
    let active = true;
    loadRecipes()
      .catch(() => [] as Recipe[])
      .then((loaded) => {
        if (!active) return;
        const merged = earlyUpdates.current.reduce((current, update) => update(current), loaded);
        loadedRef.current = true;
        recipesRef.current = merged;
        setRecipes(merged);
        if (earlyUpdates.current.length > 0) saveRecipes(merged).catch(() => {});
        earlyUpdates.current = [];
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((update: (current: Recipe[]) => Recipe[]) => {
    const next = update(recipesRef.current);
    recipesRef.current = next;
    setRecipes(next);
    if (!loadedRef.current) {
      // On rejouera la modification sur les données chargées, sans écraser le stockage.
      earlyUpdates.current.push(update);
      return;
    }
    saveRecipes(next).catch(() => {});
  }, []);

  const addRecipe = useCallback(
    (recipe: NewRecipe) => {
      const now = new Date().toISOString();
      const created: Recipe = { ...recipe, id: createId(), createdAt: now, updatedAt: now };
      commit((current) => [created, ...current]);
      return created;
    },
    [commit],
  );

  const updateRecipe = useCallback(
    (id: string, changes: Partial<NewRecipe>) => {
      commit((current) =>
        current.map((r) => {
          if (r.id !== id) return r;
          if ('photoUri' in changes && changes.photoUri !== r.photoUri) deletePhoto(r.photoUri);
          return { ...r, ...changes, updatedAt: new Date().toISOString() };
        }),
      );
    },
    [commit],
  );

  const removeRecipe = useCallback(
    (id: string) => {
      commit((current) => {
        deletePhoto(current.find((r) => r.id === id)?.photoUri ?? null);
        return current.filter((r) => r.id !== id);
      });
    },
    [commit],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      commit((current) => current.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)));
    },
    [commit],
  );

  const value = useMemo(
    () => ({ recipes, loading, addRecipe, updateRecipe, removeRecipe, toggleFavorite }),
    [recipes, loading, addRecipe, updateRecipe, removeRecipe, toggleFavorite],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes(): RecipesContextValue {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes doit être utilisé dans un RecipesProvider');
  return ctx;
}
