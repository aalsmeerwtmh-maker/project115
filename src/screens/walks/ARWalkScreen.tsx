import { View, Text, StyleSheet } from 'react-native';

export function ARWalkScreen() {
  return (
    <View style={styles.container}>
      <Text>AR Walk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
