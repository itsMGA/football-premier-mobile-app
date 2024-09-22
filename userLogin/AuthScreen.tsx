import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import UserLoginComp from './UserLoginComp';
import ManagerCreation from './managerCreation';
import SelectClubPanel from './teamSelection'; // Import the SelectClubPanel

interface AuthScreenProps {
    onAuthSuccess: (hasTeam: boolean) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [needsTeamSelection, setNeedsTeamSelection] = useState(false);

    const switchToRegister = () => setIsLoginMode(false);
    const switchToLogin = () => setIsLoginMode(true);

    const handleAuthSuccess = (hasTeam: boolean) => {
        if (hasTeam) {
            onAuthSuccess(true);
        } else {
            setNeedsTeamSelection(true);
        }
    };

    const handleTeamSelection = (teamId: number) => {
        setNeedsTeamSelection(false);
        onAuthSuccess(true);
    };

    if (needsTeamSelection) {
        return (
            <SelectClubPanel
                onSelectTeam={handleTeamSelection}
                onClose={() => setNeedsTeamSelection(false)}
            />
        );
    }

    return (
        <View style={styles.container}>
            {isLoginMode ? (
                <UserLoginComp
                    onLoginSuccess={handleAuthSuccess}
                    switchToRegister={switchToRegister}
                />
            ) : (
                <ManagerCreation
                    onCreateSuccess={handleAuthSuccess}
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