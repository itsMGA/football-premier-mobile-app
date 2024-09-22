import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import UserLoginComp from './UserLoginComp';
import ManagerCreation from './managerCreation';
import SelectClubPanel from './teamSelection';
import axiosInstance from '../axiosConfig';

interface AuthScreenProps {
    onAuthSuccess: (hasTeam: boolean) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [needsTeamSelection, setNeedsTeamSelection] = useState(false);

    const switchToRegister = () => setIsLoginMode(false);
    const switchToLogin = () => setIsLoginMode(true);

    const checkUserTeam = async () => {
        try {
            await axiosInstance.get('accounts/user-progress/check-team/');
            return true;
        } catch (error) {
            if (error.response?.status === 404 && error.response?.data?.detail === "User does not have a team") {
                return false;
            }
            console.error('Error checking user team:', error);
            return false;
        }
    };

    const handleAuthSuccess = async () => {
        const hasTeam = await checkUserTeam();
        if (hasTeam) {
            onAuthSuccess(true);
        } else {
            setNeedsTeamSelection(true);
        }
    };

    const handleTeamSelection = async (teamId: number) => {
        try {
            await axiosInstance.post('accounts/user-progress/assign-team/', { team_id: teamId });
            setNeedsTeamSelection(false);
            onAuthSuccess(true);
        } catch (error) {
            console.error('Error assigning team:', error);
            // Handle error (e.g., show an error message to the user)
        }
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