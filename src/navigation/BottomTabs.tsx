import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { WalksScreen } from '@/screens/walks/WalksScreen';
import { GoalsScreen } from '@/screens/goals/GoalsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { MainTabParamList } from './types';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabConfig {
  icon: string;
  label: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  Home:    { icon: '🏡', label: 'Home' },
  Walks:   { icon: '🐾', label: 'Walks' },
  Goals:   { icon: '🏆', label: 'Goals' },
  Profile: { icon: '👤', label: 'Profile' },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {/* Gold accent line along the top edge */}
      <View style={styles.topAccent} />

      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? { icon: '🐾', label: route.name };
          const a11yLabel =
            descriptors[route.key]?.options.tabBarAccessibilityLabel ?? config.label;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={a11yLabel}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {/* Pill container — gold fill when active, transparent otherwise */}
              <View style={[styles.pill, isFocused && styles.pillActive]}>
                <Text style={[styles.tabIcon, !isFocused && styles.tabIconInactive]}>
                  {config.icon}
                </Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {config.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
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
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    // Upward shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  topAccent: {
    height: 3,
    backgroundColor: colors.primaryContainer,
    marginHorizontal: spacing.xl,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginBottom: spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  pill: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    width: '100%',
    gap: 2,
  },
  pillActive: {
    backgroundColor: colors.primaryContainer,
    // Subtle inner glow via shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconInactive: {
    opacity: 0.45,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  tabLabelActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
