import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, type Tone } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Pastille sélectionnable (filtres, choix rapides). */
export function Chip({ label, selected, onPress, icon, style }: ChipProps) {
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.8 }, style]}
    >
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

interface TagProps {
  label: string;
  tone: Tone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Étiquette colorée non interactive (catégorie, difficulté). */
export function Tag({ label, tone, icon, style }: TagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: tone.bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={tone.fg} /> : null}
      <Text style={[styles.tagText, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 12 },
});
