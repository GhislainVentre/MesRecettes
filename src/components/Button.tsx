import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, shadow } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: Variant;
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string; elevated: boolean }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary, elevated: true },
  secondary: { bg: colors.surface, fg: colors.primary, border: colors.border, elevated: true },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent', elevated: false },
  danger: { bg: colors.dangerLight, fg: colors.danger, border: colors.dangerLight, elevated: false },
};

export function Button({ label, onPress, icon, variant = 'primary', size = 'md', disabled, style }: Props) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.large,
        v.elevated && shadow,
        { backgroundColor: v.bg, borderColor: v.border },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={v.fg} /> : null}
      <Text style={[styles.label, size === 'lg' && styles.labelLarge, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  large: { paddingVertical: 15, paddingHorizontal: 22 },
  label: { fontFamily: fonts.bodyBold, fontSize: 15 },
  labelLarge: { fontSize: 16 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
