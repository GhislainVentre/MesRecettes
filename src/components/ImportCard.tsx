import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { importRecipeFromUrl, type ImportedRecipe } from '../lib/importRecipe';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Button } from './Button';

interface Props {
  onImported: (recipe: ImportedRecipe) => Promise<void>;
}

/** Champ « Importer depuis un site » en tête du formulaire de création. */
export function ImportCard({ onImported }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function run() {
    if (loading || !url.trim()) return;
    setLoading(true);
    setMessage(null);
    const result = await importRecipeFromUrl(url);
    if ('error' in result) {
      setMessage({ text: result.error, error: true });
    } else {
      await onImported(result.recipe);
      setMessage({ text: 'Recette importée. Vérifiez-la puis enregistrez.', error: false });
      setUrl('');
    }
    setLoading(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="globe-outline" size={18} color={colors.primary} />
        <Text style={styles.title}>Importer depuis un site</Text>
      </View>
      <Text style={styles.hint}>Collez l&apos;adresse d&apos;une recette (Marmiton, 750g, Cuisine AZ…) pour remplir le formulaire.</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        onSubmitEditing={run}
        placeholder="https://www.marmiton.org/recettes/…"
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="go"
        editable={!loading}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.hint}>Lecture de la recette…</Text>
        </View>
      ) : (
        <Button label="Importer" icon="download-outline" variant="secondary" onPress={run} disabled={!url.trim()} />
      )}
      {message && <Text style={[styles.message, message.error && styles.error]}>{message.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...type.bodyStrong },
  hint: { ...type.caption },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 48 },
  message: { ...type.caption, color: colors.herb },
  error: { color: colors.danger },
});
