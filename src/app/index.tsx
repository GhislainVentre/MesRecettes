import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFooter } from '../components/AppFooter';
import { Button } from '../components/Button';
import { Chip, Tag } from '../components/Chip';
import { RecipePhoto } from '../components/RecipePhoto';
import { SearchField } from '../components/SearchField';
import { useRecipes } from '../context/RecipesContext';
import { CATEGORIES, categoryInfo } from '../lib/categories';
import { compareRecipes, formatDuration, matchesSearch, totalMinutes } from '../lib/recipes';
import { CATEGORY_TONES, card, colors, fonts, radius, shadow, spacing, type } from '../theme';
import type { Category, Recipe } from '../types';

type Filter = 'all' | 'favorites' | Category;

function RecipeCard({ recipe, onToggleFavorite }: { recipe: Recipe; onToggleFavorite: () => void }) {
  const info = categoryInfo(recipe.category);
  const total = totalMinutes(recipe);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <RecipePhoto uri={recipe.photoUri} category={recipe.category} width={96} height={96} rounded={radius.md} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.meta}>
          <Tag label={info.label} tone={CATEGORY_TONES[recipe.category]} />
          {total ? (
            <View style={styles.time}>
              <Ionicons name="time-outline" size={14} color={colors.muted} />
              <Text style={type.caption}>{formatDuration(total)}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityLabel={recipe.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        hitSlop={10}
        onPress={onToggleFavorite}
        style={styles.heart}
      >
        <Ionicons name={recipe.favorite ? 'heart' : 'heart-outline'} size={22} color={recipe.favorite ? colors.primary : colors.muted} />
      </Pressable>
    </Pressable>
  );
}

export default function RecipesScreen() {
  const { recipes, loading, toggleFavorite } = useRecipes();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () =>
      recipes
        .filter((r) => (filter === 'all' ? true : filter === 'favorites' ? r.favorite : r.category === filter))
        .filter((r) => matchesSearch(r, query))
        .sort(compareRecipes),
    [recipes, filter, query],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Seules les catégories utilisées apparaissent dans les filtres.
  const used = CATEGORIES.filter((c) => recipes.some((r) => r.category === c.key));
  const hasFavorites = recipes.some((r) => r.favorite);
  const empty = recipes.length === 0;

  return (
    <View style={styles.flex}>
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RecipeCard recipe={item} onToggleFavorite={() => toggleFavorite(item.id)} />}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={type.caption}>
                {empty ? 'Votre carnet est vide' : `${recipes.length} recette${recipes.length > 1 ? 's' : ''}`}
              </Text>
              <Text style={type.hero}>Mes recettes</Text>
            </View>
            {!empty ? (
              <>
                <SearchField value={query} onChangeText={setQuery} placeholder="Chercher un plat, un ingrédient…" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                  <Chip label="Toutes" selected={filter === 'all'} onPress={() => setFilter('all')} />
                  {hasFavorites ? (
                    <Chip label="Favoris" icon="heart" selected={filter === 'favorites'} onPress={() => setFilter('favorites')} />
                  ) : null}
                  {used.map((c) => (
                    <Chip key={c.key} label={c.label} icon={c.icon} selected={filter === c.key} onPress={() => setFilter(c.key)} />
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          empty ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[type.title, styles.centerText]}>Notez votre première recette</Text>
              <Text style={[type.body, styles.centerText, { color: colors.muted }]}>
                Ingrédients, étapes, temps de cuisson et une photo du plat : tout reste sur votre téléphone.
              </Text>
            </View>
          ) : (
            <Text style={[type.body, styles.centerText, styles.noResult]}>Aucune recette ne correspond.</Text>
          )
        }
        ListFooterComponent={<AppFooter />}
      />
      <View style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}>
        <Button label="Ajouter une recette" icon="add" size="lg" onPress={() => router.push('/recipe/new')} style={shadow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  header: { gap: spacing.lg, marginBottom: spacing.xs },
  filters: { gap: spacing.sm, paddingRight: spacing.lg },
  card: { ...card, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, paddingRight: spacing.md },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  cardBody: { flex: 1, gap: spacing.sm },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 23, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heart: { padding: spacing.xs },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { textAlign: 'center' },
  noResult: { color: colors.muted, paddingVertical: spacing.xl },
  fab: { position: 'absolute', left: spacing.xl, right: spacing.xl },
});
