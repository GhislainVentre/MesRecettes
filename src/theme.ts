import { Platform, type TextStyle, type ViewStyle } from 'react-native';

import type { Category } from './types';

/** Palette « cuisine » : crème, terre cuite, touches d'herbes et de safran. */
export const colors = {
  background: '#FBF5EC',
  surface: '#FFFFFF',
  surfaceAlt: '#F5EBDD',
  primary: '#B4532A',
  primaryDark: '#8A3B1B',
  primaryLight: '#F6DFD2',
  herb: '#5E8B4E',
  herbLight: '#E2EEDB',
  saffron: '#D99A2B',
  saffronLight: '#FBEFD5',
  text: '#2A211C',
  muted: '#7A6C62',
  border: '#EADFD1',
  danger: '#B3372F',
  dangerLight: '#F8E1DE',
  overlay: 'rgba(42, 33, 28, 0.55)',
  onPrimary: '#FFFFFF',
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyBlack: 'Nunito_800ExtraBold',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, round: 999 };

/** Styles de texte réutilisables. */
export const type = {
  hero: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38, color: colors.text } as TextStyle,
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.text } as TextStyle,
  heading: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24, color: colors.text } as TextStyle,
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  } as TextStyle,
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.text } as TextStyle,
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 23, color: colors.text } as TextStyle,
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.muted } as TextStyle,
};

/** Ombre douce, identique sur iOS, Android et web. */
export const shadow: ViewStyle = Platform.select({
  web: { boxShadow: '0 6px 18px rgba(42, 33, 28, 0.08)' } as ViewStyle,
  default: {
    shadowColor: '#2A211C',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
}) as ViewStyle;

export const card: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  ...shadow,
};

export interface Tone {
  bg: string;
  fg: string;
}

export const CATEGORY_TONES: Record<Category, Tone> = {
  aperitif: { bg: colors.saffronLight, fg: '#86600F' },
  entree: { bg: colors.herbLight, fg: '#3C6430' },
  plat: { bg: colors.primaryLight, fg: colors.primaryDark },
  dessert: { bg: '#F4E1EA', fg: '#7E3B5C' },
  boisson: { bg: '#E0ECF4', fg: '#2F5E85' },
  sauce: { bg: '#F1E6D8', fg: '#74512D' },
  autre: { bg: colors.surfaceAlt, fg: colors.muted },
};
