import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import ManagerCreationForm from './userLogin/managerCreation';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ManagerCreationForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
});

export default App;