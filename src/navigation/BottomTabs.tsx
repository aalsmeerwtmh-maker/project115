import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { WalksScreen } from '@/screens/walks/WalksScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { MainTabParamList } from './types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: colors.onBackground,
        tabBarInactiveTintColor: colors.outlineVariant,
        tabBarButton: undefined, // default
        tabBarIcon: ({ focused }) => {
          let icon = '🐾';
          if (route.name === 'Home') icon = '🏃';
          else if (route.name === 'Walks') icon = '🐾';
          else if (route.name === 'Goals') icon = '📊';
          else if (route.name === 'Profile') icon = '👤';

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Text style={[styles.iconText, focused && styles.iconTextActive]}>{icon}</Text>
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          let label = route.name;
          if (route.name === 'Home') label = 'Activity';
          return (
            <Text style={[
              styles.tabBarLabel, 
              { color }, 
              focused && { fontWeight: '900', color: colors.onBackground }
            ]}>
              {label}
            </Text>
          );
        }
      })}
    >
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 0,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    // shadow
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBarLabel: {
    ...typography.labelSmall,
    fontSize: 10,
    marginTop: 4,
  },
  iconContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.primaryContainer,
    transform: [{ scale: 1.1 }],
  },
  iconText: {
    fontSize: 20,
  },
  iconTextActive: {
    // any specific active styles
  },
});

