import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { WalksScreen } from '@/screens/walks/WalksScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { MainTabParamList } from './types';

// The four main tabs from the proposal:
//   Home    — pet display, today's step progress, mood, quick stats
//   Walks   — start/stop a walk session, map of past walks, AR launch button
//   Goals   — streak calendar, daily/weekly targets, boss challenges
//   Profile — pet roster, settings, about

const Tab = createBottomTabNavigator<MainTabParamList>();

export function BottomTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarAccessibilityLabel: 'Home' }}
      />
      <Tab.Screen
        name="Walks"
        component={WalksScreen}
        options={{ tabBarAccessibilityLabel: 'Walks' }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ tabBarAccessibilityLabel: 'Goals' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarAccessibilityLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
