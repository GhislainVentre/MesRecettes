export type Category = 'aperitif' | 'entree' | 'plat' | 'dessert' | 'boisson' | 'sauce' | 'autre';

export interface Recipe {
  id: string;
  title: string;
  category: Category;
  /** Chemin relatif `photos/<nom>` dans le dossier de l'app, ou null. */
  photoUri: string | null;
  /** Nombre de personnes pour lequel les quantités sont écrites. */
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  /** Une ligne par ingrédient : « 200 g de farine ». */
  ingredients: string[];
  /** Une entrée par étape. */
  steps: string[];
  notes: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewRecipe = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
