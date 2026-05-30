import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { ARWalkScreen } from '@/screens/walks/ARWalkScreen';
import { BossScreen } from '@/screens/boss/BossScreen';
import { ShopScreen } from '@/screens/shop/ShopScreen';
import { ExplorationMapScreen } from '@/screens/walks/ExplorationMapScreen';
import { PrivacyPolicyScreen } from '@/screens/legal/PrivacyPolicyScreen';
import { TermsScreen } from '@/screens/legal/TermsScreen';
import type { RootStackParamList } from './types';

// The root navigator is a native stack that sits above the tab bar.
// This lets screens like ARWalk slide over the tabs as a full-screen modal.
//
// Structure:
//   RootStack
//   ├── Onboarding    (shown on first launch, then never again)
//   ├── Main          (the four-tab layout — see BottomTabs)
//   ├── ARWalk        (full-screen modal, launched from the Walks tab)
//   ├── Boss          (full-screen boss challenge list)
//   ├── Shop          (equipment shop)
//   ├── ExplorationMap (full-screen map of visited cells)
//   ├── PrivacyPolicy (legal screen, linked from Profile → About)
//   └── Terms         (legal screen, linked from Profile → About)

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  initialRoute?: 'Onboarding' | 'Main';
}

export function RootNavigator({ initialRoute = 'Main' }: RootNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        {/* ARWalk slides up over the tabs as a full-screen camera view */}
        <Stack.Screen
          name="ARWalk"
          component={ARWalkScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="Boss" component={BossScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="ExplorationMap" component={ExplorationMapScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
