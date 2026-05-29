import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { RootNavigator } from '@/navigation/RootNavigator';
import { initDb } from '@/db/client';

export default function App() {
  // Apply pending Drizzle migrations on first mount, then no-ops on every subsequent launch.
  useEffect(() => {
    initDb().catch((err) => console.error('DB init failed:', err));
  }, []);

  // GestureHandlerRootView is required at the root by react-native-gesture-handler,
  // which React Navigation's native stack depends on.
  return (
    <GestureHandlerRootView style={styles.root}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
