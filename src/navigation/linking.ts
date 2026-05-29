// Deep-link / universal-link configuration for React Navigation
// Scheme: pawstep://
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['pawstep://'],
  config: {
    screens: {
      Main: 'home',
      ARWalk: 'ar-walk/:sessionId',
      Onboarding: 'onboarding',
    },
  },
};
