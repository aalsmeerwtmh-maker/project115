import { TextStyle } from 'react-native';

/**
 * Typography scale based on Plus Jakarta Sans (Headlines) and Be Vietnam Pro (Body).
 * Using system fonts for simplicity in React Native, mapping styles to the design intent.
 */
export const typography = {
  heading1: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
    fontFamily: 'System', // Plus Jakarta Sans would be here
  } as TextStyle,
  heading2: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  } as TextStyle,
  heading3: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: 'System', // Be Vietnam Pro would be here
  } as TextStyle,
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  } as TextStyle,
  captionBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  } as TextStyle,
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 20,
    letterSpacing: 0.5,
  } as TextStyle,
  labelSmall: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  } as TextStyle,
} as const;
