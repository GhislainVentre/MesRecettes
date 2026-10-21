import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, shadow } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchField({ value, onChangeText, ...rest }: Props) {
  return (
    <View style={styles.field}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
        {...rest}
      />
      {value.length > 0 && (
        <Pressable accessibilityLabel="Effacer" onPress={() => onChangeText('')} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    paddingHorizontal: 16,
    paddingVertical: 2,
    minHeight: 48,
    ...shadow,
  },
  input: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text, paddingVertical: 10 },
});
