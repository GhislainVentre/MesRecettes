import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { resolvePhotoUri } from '../lib/photos';
import { CATEGORY_TONES, radius } from '../theme';
import type { Category } from '../types';
import { categoryInfo } from '../lib/categories';

interface Props {
  uri: string | null;
  category: Category;
  width?: number | `${number}%`;
  height: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}

/** Photo du plat, ou l'icône de sa catégorie sur un fond doux quand il n'y en a pas. */
export function RecipePhoto({ uri, category, width = '100%', height, rounded = radius.md, style }: Props) {
  const box = { width, height, borderRadius: rounded };
  const source = resolvePhotoUri(uri);
  const tone = CATEGORY_TONES[category];
  if (source) {
    return (
      <View style={[box, styles.frame, { backgroundColor: tone.bg }, style]}>
        <Image source={{ uri: source }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={[box, styles.frame, style]}>
      <LinearGradient
        colors={[tone.bg, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.placeholder]}
      >
        <Ionicons name={categoryInfo(category).icon} size={Math.round(Math.min(height * 0.4, 64))} color={tone.fg} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
