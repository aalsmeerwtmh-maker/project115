/**
 * PawStep brand palette based on Material 3 / codehp.html design.
 */
export const colors = {
  // Brand / Material 3 - codehp.html
  primary: '#785500',
  onPrimary: '#fff1de',
  primaryContainer: '#feb700',
  onPrimaryContainer: '#533a00',
  primaryDim: '#694a00',
  primaryFixed: '#feb700',
  primaryFixedDim: '#ecaa00',

  secondary: '#9b3e20',
  onSecondary: '#ffefeb',
  secondaryContainer: '#ffc4b3',
  onSecondaryContainer: '#802b0d',
  secondaryDim: '#8b3315',

  tertiary: '#006859',
  onTertiary: '#c2ffef',
  tertiaryContainer: '#6bfde0',
  onTertiaryContainer: '#005f51',

  error: '#b02500',
  onError: '#ffefec',
  errorContainer: '#f95630',
  onErrorContainer: '#520c00',

  background: '#fdf6e3',
  onBackground: '#322f22',

  surface: '#fdf6e3',
  onSurface: '#322f22',
  surfaceVariant: '#e4ddc5',
  onSurfaceVariant: '#5f5b4d',
  surfaceDim: '#dcd4bb',
  surfaceBright: '#fdf6e3',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f8f0dc',
  surfaceContainer: '#efe8d2',
  surfaceContainerHigh: '#eae2cb',
  surfaceContainerHighest: '#e4ddc5',

  outline: '#7b7767',
  outlineVariant: '#b2ad9c',
  inverseSurface: '#100e05',
  inverseOnSurface: '#a29d8c',
  inversePrimary: '#feb700',

  // Legacy/Semantic mapping (keeping some for compatibility if needed)
  success: '#006859', // tertiary
  warning: '#feb700', // primary container
  info: '#6bfde0', // tertiary container
  border: '#b2ad9c', // outline variant

  // Compatibility aliases
  textPrimary: '#322f22', // onBackground
  textSecondary: '#5f5b4d', // onSurfaceVariant
  textDisabled: '#7b7767', // outline
  surfaceAlt: '#efe8d2', // surfaceContainer
  primaryLight: '#feb700', // primaryContainer
  primaryDark: '#694a00', // primaryDim
  overlay: 'rgba(50, 47, 34, 0.4)', // onBackground with alpha
} as const;
