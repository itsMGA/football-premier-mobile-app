// AuthScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import UserLoginComp from './UserLoginComp';
import ManagerCreation from './managerCreation';

interface AuthScreenProps {
    onAuthSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);

    const switchToRegister = () => setIsLoginMode(false);
    const switchToLogin = () => setIsLoginMode(true);

    return (
        <View style={styles.container}>
            {isLoginMode ? (
                <UserLoginComp
                    onLoginSuccess={onAuthSuccess}
                    switchToRegister={switchToRegister}
                />
            ) : (
                <ManagerCreation
                    onCreateSuccess={onAuthSuccess}
                    switchToLogin={switchToLogin}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default AuthScreen;