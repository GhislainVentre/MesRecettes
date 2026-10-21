import type { Recipe } from '../../types';
import { compareRecipes, formatDuration, formatQuantity, matchesSearch, scaleIngredient, splitLines, totalMinutes } from '../recipes';

const recipe: Recipe = {
  id: '1',
  title: 'Crème brûlée',
  category: 'dessert',
  photoUri: null,
  servings: 4,
  prepMinutes: 20,
  cookMinutes: 45,
  ingredients: ['50 cl de crème liquide', '6 jaunes d’œufs', '100 g de sucre'],
  steps: ['Chauffer la crème.'],
  notes: 'Recette de mamie',
  favorite: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

it('formatDuration', () => {
  expect(formatDuration(45)).toBe('45 min');
  expect(formatDuration(60)).toBe('1 h');
  expect(formatDuration(75)).toBe('1 h 15');
  expect(formatDuration(125)).toBe('2 h 05');
});

it('totalMinutes', () => {
  expect(totalMinutes(recipe)).toBe(65);
  expect(totalMinutes({ prepMinutes: 10, cookMinutes: null })).toBe(10);
  expect(totalMinutes({ prepMinutes: null, cookMinutes: null })).toBeNull();
});

it('splitLines retire les lignes vides et les puces', () => {
  expect(splitLines('- 200 g de farine\n\n• 2 œufs\n1. Mélanger\n  sel  ')).toEqual(['200 g de farine', '2 œufs', 'Mélanger', 'sel']);
});

it('matchesSearch ignore accents et casse, cherche aussi dans les ingrédients', () => {
  expect(matchesSearch(recipe, 'creme')).toBe(true);
  expect(matchesSearch(recipe, 'SUCRE brulee')).toBe(true);
  expect(matchesSearch(recipe, 'mamie')).toBe(true);
  expect(matchesSearch(recipe, 'chocolat')).toBe(false);
  expect(matchesSearch(recipe, '  ')).toBe(true);
});

describe('scaleIngredient', () => {
  it('multiplie la quantité en tête de ligne', () => {
    expect(scaleIngredient('200 g de farine', 1.5)).toBe('300 g de farine');
    expect(scaleIngredient('2 œufs', 0.5)).toBe('1 œufs');
    expect(scaleIngredient('1,5 L de lait', 2)).toBe('3 L de lait');
    expect(scaleIngredient('1/2 citron', 2)).toBe('1 citron');
    expect(scaleIngredient('½ citron', 3)).toBe('1 ½ citron');
    expect(scaleIngredient('1 1/2 tasse de riz', 2)).toBe('3 tasse de riz');
    expect(scaleIngredient('250g de beurre', 2)).toBe('500g de beurre');
  });
  it('laisse les lignes sans quantité', () => {
    expect(scaleIngredient('Sel, poivre', 2)).toBe('Sel, poivre');
    expect(scaleIngredient('200 g de farine', 1)).toBe('200 g de farine');
  });
});

it('formatQuantity', () => {
  expect(formatQuantity(0.5)).toBe('½');
  expect(formatQuantity(2.75)).toBe('2 ¾');
  expect(formatQuantity(1.2)).toBe('1,2');
  expect(formatQuantity(12.4)).toBe('12');
});

it('compareRecipes : favoris puis ordre alphabétique', () => {
  const a = { ...recipe, title: 'Tarte', favorite: false };
  const b = { ...recipe, title: 'Blanquette', favorite: false };
  const c = { ...recipe, title: 'Zébra', favorite: true };
  expect([a, b, c].sort(compareRecipes).map((r) => r.title)).toEqual(['Zébra', 'Blanquette', 'Tarte']);
});
