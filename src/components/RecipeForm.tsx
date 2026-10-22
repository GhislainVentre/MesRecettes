import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES } from '../lib/categories';
import type { ImportedRecipe } from '../lib/importRecipe';
import { deletePhoto, downloadPhoto, pickPhoto, type PhotoSource } from '../lib/photos';
import { notify } from '../lib/notify';
import { splitLines } from '../lib/recipes';
import { colors, fonts, radius, spacing, type } from '../theme';
import type { Category, NewRecipe } from '../types';
import { Button } from './Button';
import { Chip } from './Chip';
import { ImportCard } from './ImportCard';
import { RecipePhoto } from './RecipePhoto';

interface Props {
  initial?: NewRecipe;
  submitLabel: string;
  /** Affiche « Importer depuis un site » (création uniquement). */
  allowImport?: boolean;
  onSubmit: (recipe: NewRecipe) => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={type.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function NumberField({
  icon,
  value,
  onChange,
  suffix,
  placeholder = '–',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  onChange: (text: string) => void;
  suffix: string;
  placeholder?: string;
}) {
  return (
    <View style={[styles.inputRow, styles.flex]}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 4))}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.inputInner}
      />
      <Text style={styles.suffix}>{suffix}</Text>
    </View>
  );
}

function toNumber(text: string): number | null {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

const toText = (value: number | null | undefined) => (value ? String(value) : '');

export function RecipeForm({ initial, submitLabel, allowImport, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'plat');
  const [servings, setServings] = useState(toText(initial?.servings ?? 4));
  const [prep, setPrep] = useState(toText(initial?.prepMinutes));
  const [cook, setCook] = useState(toText(initial?.cookMinutes));
  const [ingredients, setIngredients] = useState((initial?.ingredients ?? []).join('\n'));
  const [steps, setSteps] = useState((initial?.steps ?? []).join('\n'));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const draftPhoto = useRef<string | null>(photoUri);
  const submitted = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    draftPhoto.current = photoUri;
  }, [photoUri]);

  // Photo copiée puis formulaire abandonné : on efface la copie.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (!submitted.current && draftPhoto.current !== (initial?.photoUri ?? null)) deletePhoto(draftPhoto.current);
    };
  }, [initial?.photoUri]);

  /** Efface une photo copiée pendant la saisie mais finalement non retenue. */
  function discardDraftPhoto(uri: string | null) {
    if (uri && uri !== initial?.photoUri) deletePhoto(uri);
  }

  async function choosePhoto(source: PhotoSource) {
    const result = await pickPhoto(source);
    if (!result) return;
    if ('error' in result) {
      notify('Photo', result.error);
      return;
    }
    discardDraftPhoto(photoUri);
    setPhotoUri(result.uri);
  }

  /** Remplit le formulaire avec la recette lue sur un site. */
  async function applyImport(recipe: ImportedRecipe) {
    if (recipe.title) setTitle(recipe.title);
    if (recipe.category) setCategory(recipe.category);
    if (recipe.servings) setServings(toText(recipe.servings));
    setPrep(toText(recipe.prepMinutes));
    setCook(toText(recipe.cookMinutes));
    if (recipe.ingredients.length > 0) setIngredients(recipe.ingredients.join('\n'));
    if (recipe.steps.length > 0) setSteps(recipe.steps.join('\n'));
    const source = `Source : ${recipe.sourceUrl}`;
    setNotes((current) => (current.trim() ? `${current.trim()}\n${source}` : source));
    if (!recipe.imageUrl) return;
    const result = await downloadPhoto(recipe.imageUrl);
    if (!result || 'error' in result) return; // Pas de photo : la recette reste utilisable.
    if (!mounted.current) {
      deletePhoto(result.uri);
      return;
    }
    discardDraftPhoto(draftPhoto.current);
    draftPhoto.current = result.uri;
    setPhotoUri(result.uri);
  }

  function removePhoto() {
    discardDraftPhoto(photoUri);
    setPhotoUri(null);
  }

  function submit() {
    if (submitting) return;
    const name = title.trim();
    if (!name) {
      notify('Nom manquant', 'Donnez un nom à votre recette.');
      return;
    }
    setSubmitting(true);
    submitted.current = true;
    onSubmit({
      title: name,
      category,
      photoUri,
      servings: toNumber(servings),
      prepMinutes: toNumber(prep),
      cookMinutes: toNumber(cook),
      ingredients: splitLines(ingredients),
      steps: splitLines(steps),
      notes: notes.trim(),
      favorite: initial?.favorite ?? false,
    });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {allowImport && <ImportCard onImported={applyImport} />}

        <View style={styles.photoBlock}>
          <View>
            <RecipePhoto uri={photoUri} category={category} height={200} rounded={radius.xl} />
            {photoUri && (
              <Pressable accessibilityLabel="Retirer la photo" onPress={removePhoto} hitSlop={8} style={styles.removePhoto}>
                <Ionicons name="close" size={16} color={colors.onPrimary} />
              </Pressable>
            )}
          </View>
          <View style={styles.row}>
            {Platform.OS !== 'web' && (
              <Button label="Photo" icon="camera-outline" variant="secondary" onPress={() => choosePhoto('camera')} style={styles.flex} />
            )}
            <Button label="Galerie" icon="images-outline" variant="secondary" onPress={() => choosePhoto('library')} style={styles.flex} />
          </View>
        </View>

        <Field label="Nom de la recette">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="ex. Blanquette de veau"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="sentences"
          />
        </Field>

        <Field label="Catégorie">
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c.key} label={c.label} icon={c.icon} selected={category === c.key} onPress={() => setCategory(c.key)} />
            ))}
          </View>
        </Field>

        <Field label="Pour combien de personnes ?">
          <NumberField icon="people-outline" value={servings} onChange={setServings} suffix="pers." />
        </Field>

        <Field label="Temps">
          <View style={styles.row}>
            <NumberField icon="timer-outline" value={prep} onChange={setPrep} suffix="min" placeholder="Prépa" />
            <NumberField icon="flame-outline" value={cook} onChange={setCook} suffix="min" placeholder="Cuisson" />
          </View>
        </Field>

        <Field label="Ingrédients" hint="Un ingrédient par ligne, la quantité en premier : « 200 g de farine ».">
          <TextInput
            value={ingredients}
            onChangeText={setIngredients}
            placeholder={'200 g de farine\n3 œufs\n50 cl de lait'}
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.multiline]}
            multiline
          />
        </Field>

        <Field label="Préparation" hint="Une étape par ligne.">
          <TextInput
            value={steps}
            onChangeText={setSteps}
            placeholder={'Mélanger la farine et les œufs.\nAjouter le lait petit à petit.'}
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.multiline, styles.tall]}
            multiline
          />
        </Field>

        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Astuces, variantes, origine de la recette…"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.multiline]}
            multiline
          />
        </Field>

        <Button label={submitLabel} icon="checkmark" size="lg" onPress={submit} disabled={submitting} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputBase = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.lg,
  minHeight: 52,
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.lg },
  photoBlock: { gap: spacing.lg },
  removePhoto: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  field: { gap: spacing.sm },
  hint: { ...type.caption, paddingHorizontal: spacing.xs },
  input: { ...inputBase, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text, paddingVertical: 14 },
  inputRow: { ...inputBase, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  inputInner: { flex: 1, minWidth: 0, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text, paddingVertical: 14 },
  suffix: { ...type.caption, color: colors.text },
  multiline: { minHeight: 130, textAlignVertical: 'top', lineHeight: 24 },
  tall: { minHeight: 180 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  submit: { marginTop: spacing.sm },
});
