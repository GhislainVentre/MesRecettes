import { router } from 'expo-router';

import { RecipeForm } from '../../components/RecipeForm';
import { useRecipes } from '../../context/RecipesContext';

export default function NewRecipeScreen() {
  const { addRecipe } = useRecipes();
  return (
    <RecipeForm
      submitLabel="Enregistrer la recette"
      allowImport
      onSubmit={(recipe) => {
        const created = addRecipe(recipe);
        router.replace({ pathname: '/recipe/[id]', params: { id: created.id } });
      }}
    />
  );
}
