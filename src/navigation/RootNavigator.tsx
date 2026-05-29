import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { ARWalkScreen } from '@/screens/walks/ARWalkScreen';
import type { RootStackParamList } from './types';

// The root navigator is a native stack that sits above the tab bar.
// This lets screens like ARWalk slide over the tabs as a full-screen modal.
//
// Structure:
//   RootStack
//   ├── Onboarding   (shown on first launch, then never again)
//   ├── Main         (the four-tab layout — see BottomTabs)
//   └── ARWalk       (full-screen modal, launched from the Walks tab)

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        {/* ARWalk slides up over the tabs as a full-screen camera view */}
        <Stack.Screen
          name="ARWalk"
          component={ARWalkScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
