import type { Ionicons } from '@expo/vector-icons';

import type { Category } from '../types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const CATEGORIES: { key: Category; label: string; icon: IconName }[] = [
  { key: 'aperitif', label: 'Apéritif', icon: 'wine-outline' },
  { key: 'entree', label: 'Entrée', icon: 'leaf-outline' },
  { key: 'plat', label: 'Plat', icon: 'restaurant-outline' },
  { key: 'dessert', label: 'Dessert', icon: 'ice-cream-outline' },
  { key: 'boisson', label: 'Boisson', icon: 'cafe-outline' },
  { key: 'sauce', label: 'Sauce', icon: 'flask-outline' },
  { key: 'autre', label: 'Autre', icon: 'ellipsis-horizontal-circle-outline' },
];

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((c) => c.key === value);
}

export function categoryInfo(category: Category) {
  return CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[CATEGORIES.length - 1];
}
