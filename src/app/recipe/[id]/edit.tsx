import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { RecipeForm } from '../../../components/RecipeForm';
import { useRecipes } from '../../../context/RecipesContext';
import { goBack } from '../../../lib/navigation';
import { colors, spacing, type } from '../../../theme';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes, loading, updateRecipe } = useRecipes();
  const recipe = recipes.find((r) => r.id === id);

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

  return (
    <RecipeForm
      initial={recipe}
      submitLabel="Enregistrer les modifications"
      onSubmit={(changes) => {
        updateRecipe(recipe.id, changes);
        goBack();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
});
