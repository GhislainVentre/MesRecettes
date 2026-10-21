import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button';
import { Tag } from '../../../components/Chip';
import { RecipePhoto } from '../../../components/RecipePhoto';
import { useRecipes } from '../../../context/RecipesContext';
import { categoryInfo } from '../../../lib/categories';
import { goBack } from '../../../lib/navigation';
import { formatDuration, scaleIngredient, totalMinutes } from '../../../lib/recipes';
import { CATEGORY_TONES, card, colors, fonts, radius, shadow, spacing, type } from '../../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function RoundButton({ icon, label, onPress, color = colors.text }: { icon: IconName; label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.factValue}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

function confirmDelete(title: string, onConfirm: () => void) {
  const message = `« ${title} » sera définitivement supprimée.`;
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Supprimer la recette ?', message, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function RecipeScreen() {
  // L'écran reste allumé pendant qu'on cuisine.
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes, loading, toggleFavorite, removeRecipe } = useRecipes();
  const insets = useSafeAreaInsets();
  const recipe = recipes.find((r) => r.id === id);
  const [servings, setServings] = useState<number | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text style={type.body}>Cette recette n’existe plus.</Text>
        <Button label="Retour aux recettes" icon="arrow-back" variant="secondary" onPress={goBack} />
      </View>
    );
  }

  const base = recipe.servings;
  const current = servings ?? base;
  const factor = base && current ? current / base : 1;
  const total = totalMinutes(recipe);
  const info = categoryInfo(recipe.category);

  function toggle(set: Set<number>, index: number, update: (next: Set<number>) => void) {
    const next = new Set(set);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    update(next);
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <RecipePhoto uri={recipe.photoUri} category={recipe.category} height={280 + insets.top} rounded={0} />
        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <RoundButton icon="arrow-back" label="Retour" onPress={goBack} />
          <View style={styles.topActions}>
            <RoundButton
              icon={recipe.favorite ? 'heart' : 'heart-outline'}
              label={recipe.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              color={recipe.favorite ? colors.primary : colors.text}
              onPress={() => toggleFavorite(recipe.id)}
            />
            <RoundButton
              icon="create-outline"
              label="Modifier"
              onPress={() => router.push({ pathname: '/recipe/[id]/edit', params: { id: recipe.id } })}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.heading}>
            <Tag label={info.label} icon={info.icon} tone={CATEGORY_TONES[recipe.category]} />
            <Text style={type.hero}>{recipe.title}</Text>
          </View>

          {recipe.prepMinutes || recipe.cookMinutes || total ? (
            <View style={styles.facts}>
              {recipe.prepMinutes ? <Fact icon="timer-outline" label="Préparation" value={formatDuration(recipe.prepMinutes)} /> : null}
              {recipe.cookMinutes ? <Fact icon="flame-outline" label="Cuisson" value={formatDuration(recipe.cookMinutes)} /> : null}
              {total && recipe.prepMinutes && recipe.cookMinutes ? <Fact icon="time-outline" label="Total" value={formatDuration(total)} /> : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={type.title}>Ingrédients</Text>
              {base && current ? (
                <View style={styles.stepper}>
                  <Pressable accessibilityLabel="Une personne de moins" hitSlop={8} disabled={current <= 1} onPress={() => setServings(current - 1)}>
                    <Ionicons name="remove-circle" size={28} color={current <= 1 ? colors.border : colors.primary} />
                  </Pressable>
                  <Text style={styles.stepperText}>
                    {current} pers.
                  </Text>
                  <Pressable accessibilityLabel="Une personne de plus" hitSlop={8} onPress={() => setServings(current + 1)}>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </Pressable>
                </View>
              ) : null}
            </View>
            {recipe.ingredients.length === 0 ? (
              <Text style={type.caption}>Aucun ingrédient noté.</Text>
            ) : (
              <View style={styles.listCard}>
                {recipe.ingredients.map((line, index) => {
                  const done = checked.has(index);
                  return (
                    <Pressable
                      key={index}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: done }}
                      onPress={() => toggle(checked, index, setChecked)}
                      style={[styles.ingredient, index > 0 && styles.separator]}
                    >
                      <Ionicons name={done ? 'checkbox' : 'square-outline'} size={22} color={done ? colors.herb : colors.muted} />
                      <Text style={[type.body, styles.flex, done && styles.done]}>{scaleIngredient(line, factor)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {factor !== 1 ? <Text style={type.caption}>Quantités adaptées pour {current} personnes (recette pour {base}).</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={type.title}>Préparation</Text>
            {recipe.steps.length === 0 ? <Text style={type.caption}>Aucune étape notée.</Text> : null}
            {recipe.steps.map((step, index) => {
              const done = doneSteps.has(index);
              return (
                <Pressable key={index} onPress={() => toggle(doneSteps, index, setDoneSteps)} style={[styles.step, done && styles.stepDone]}>
                  <View style={[styles.stepNumber, done && styles.stepNumberDone]}>
                    {done ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : <Text style={styles.stepNumberText}>{index + 1}</Text>}
                  </View>
                  <Text style={[type.body, styles.flex, done && styles.done]}>{step}</Text>
                </Pressable>
              );
            })}
          </View>

          {recipe.notes ? (
            <View style={styles.section}>
              <Text style={type.title}>Notes</Text>
              <View style={[styles.listCard, styles.notes]}>
                <Text style={type.body}>{recipe.notes}</Text>
              </View>
            </View>
          ) : null}

          <Button
            label="Supprimer la recette"
            icon="trash-outline"
            variant="danger"
            onPress={() =>
              confirmDelete(recipe.title, () => {
                removeRecipe(recipe.id);
                goBack();
              })
            }
            style={styles.delete}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  topBar: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pressed: { opacity: 0.8 },
  body: {
    marginTop: -radius.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  heading: { gap: spacing.sm },
  facts: { ...card, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg },
  fact: { alignItems: 'center', gap: 2 },
  factValue: { fontFamily: fonts.bodyBlack, fontSize: 16, color: colors.text },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, minWidth: 54, textAlign: 'center' },
  listCard: { ...card, paddingHorizontal: spacing.lg },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  done: { color: colors.muted, textDecorationLine: 'line-through' },
  step: { ...card, flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  stepDone: { opacity: 0.7 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberDone: { backgroundColor: colors.herb },
  stepNumberText: { fontFamily: fonts.bodyBlack, fontSize: 14, color: colors.primaryDark },
  notes: { paddingVertical: spacing.lg },
  delete: { marginTop: spacing.md },
});
