// app.config.ts
import { ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ config }: ConfigContext): any => ({
  ...config,
  name: IS_DEV ? 'PawStep (Dev)' : 'PawStep',
  slug: 'pawstep',
  owner: 'lagrange-040506',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'pawstep',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],

  ios: {
    bundleIdentifier: IS_DEV ? 'com.pawstep.app.dev' : 'com.pawstep.app',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        'PawStep uses the camera so your pet can appear in the world around you in AR.',
      NSLocationWhenInUseUsageDescription:
        'PawStep uses your location during walks so your pet can explore the real world with you.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'PawStep needs background location to keep tracking your walks when the screen is off.',
      NSMotionUsageDescription: 'PawStep uses motion data to count your steps and grow your pet.',
      UIBackgroundModes: ['location', 'fetch'],
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    package: IS_DEV ? 'com.pawstep.app.dev' : 'com.pawstep.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#FDF8E8',
    },
    permissions: [
      'CAMERA',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'ACTIVITY_RECOGNITION',
      'FOREGROUND_SERVICE',
      'POST_NOTIFICATIONS',
      'BILLING',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
      },
    },
  },

  plugins: [
    'expo-dev-client',
    'react-native-iap',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow PawStep to use your location for walks.',
        isAndroidBackgroundLocationEnabled: true,
        isIosBackgroundLocationEnabled: true,
      },
    ],
    [
      'expo-notifications',
      {
        // icon: replace with a white-on-transparent PNG when brand assets are ready
        color: '#F5A623',
      },
    ],
    [
      '@reactvision/react-viro',
      {
        // Triggers the config plugin that injects ARKit (iOS) + ARCore (Android)
        // entitlements and Gradle/Pod changes.
      },
    ],
  ],

  extra: {
    eas: {
      projectId: '6fe40df0-5b30-46fa-bf95-f564b867823d',
    },
  },
});
