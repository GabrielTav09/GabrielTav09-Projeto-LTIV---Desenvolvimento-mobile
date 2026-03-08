import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>helo word! {"\n"} teste
      </Text>
      <Text>Descrição detalhada logo abaixo.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b36322',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
