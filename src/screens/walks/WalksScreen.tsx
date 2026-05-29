import { View, Text, StyleSheet } from 'react-native';

export function WalksScreen() {
  return (
    <View style={styles.container}>
      <Text>Walks</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
