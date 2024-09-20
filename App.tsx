import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SelectClubPanel from './userLogin/teamSelection';
import Dashboard from './Dashboard';
import { getDecryptedToken, removeEncryptedToken } from './axiosConfig';
import { jwtDecode } from "jwt-decode";
import axiosInstance from './axiosConfig';
import AuthScreen from './userLogin/AuthScreen';

function App(): React.JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [hasTeam, setHasTeam] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getDecryptedToken();
      if (token) {
        const decodedToken: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp > currentTime) {
          setIsLoggedIn(true);
          await checkUserTeam();
        } else {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const checkUserTeam = async () => {
    try {
      const response = await axiosInstance.get('/accounts/user-progress/check-team/');
      setHasTeam(true);
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.detail === "User does not have a team") {
        setHasTeam(false);
      } else {
        console.error('Error checking user team:', error);
        setHasTeam(false);
      }
    }
  };

  const logout = async () => {
    await removeEncryptedToken();
    setIsLoggedIn(false);
    setHasTeam(false);
  };

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    await checkUserTeam();
  };

  const handleTeamSelection = useCallback(async (teamId: string) => {
    try {
      console.log('Team selected in App.tsx:', teamId);
      setHasTeam(true);
      // No need to make an API call here, as it's already done in SelectClubPanel
    } catch (error) {
      console.error('Error handling team selection:', error);
      setHasTeam(false);
    }
  }, []);

  const handleCloseTeamSelection = () => {
    setIsLoggedIn(false);
    setHasTeam(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      );
    }
    if (!isLoggedIn) {
      return <AuthScreen onAuthSuccess={handleLoginSuccess} />;
    }
    if (!hasTeam) {
      return <SelectClubPanel onSelectTeam={handleTeamSelection} onClose={handleCloseTeamSelection} />;
    }
    return <Dashboard onLogout={logout} />;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          {renderContent()}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;