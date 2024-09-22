// managerCreation.tsx

import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Easing,
    ImageBackground,
} from 'react-native';
import axios from 'axios';
import axiosInstance, { storeEncryptedToken, storeEncryptedUsername } from '../axiosConfig';
import { AnimatedInput, ErrorMessage } from './SharedComponents';

interface FieldError {
    [key: string]: string[];
}

interface ManagerCreationProps {
    onCreateSuccess: () => void;
    switchToLogin: () => void;
}

const ManagerCreation: React.FC<ManagerCreationProps> = ({ onCreateSuccess, switchToLogin }) => {
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldError>({});

    const ballPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const ballOpacity = useRef(new Animated.Value(0)).current;
    const flashOpacity = useRef(new Animated.Value(0)).current;
    const [hasTeam, setHasTeam] = useState<boolean>(false);

    const checkManagerTeam = async () => {
        try {
            await axiosInstance.get('accounts/user-progress/check-team/');
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                return false;
            }
            console.error('Error checking manager team:', error);
            return false;
        }
    };

    const createNewManager = async (
        managerName: string,
        email: string,
        password: string,
        confirmPassword: string
    ): Promise<boolean> => {
        setFieldErrors({});
        setMessage('');

        if (password !== confirmPassword) {
            setFieldErrors({ confirm_password: ["Passwords don't match"] });
            return false;
        }

        try {
            console.log('Attempting to create manager...');
            const response = await axiosInstance.post('accounts/create/', {
                username: managerName,
                email,
                password,
                confirm_password: confirmPassword
            });

            console.log('Create manager response:', response.data);

            if (response.data.access) {
                await storeEncryptedToken(response.data.access);
                await storeEncryptedUsername(response.data.username);
                setMessage('Manager created successfully');
                setIsSuccess(true);
                animateBall();
                animateFlash();

                // Update the axiosInstance with the new token
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

                // Check if the manager has a team
                const hasTeam = await checkManagerTeam();
                onCreateSuccess(hasTeam);
                return true;
            } else {
                setMessage('Failed to create manager account. Please try again.');
                return false;
            }
        } catch (error) {
            console.error('API Error:', error);
            setIsSuccess(false);

            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                if (typeof responseData === 'object') {
                    setFieldErrors(responseData);
                } else {
                    setMessage('An error occurred while creating the account. Please try again.');
                }
            } else {
                setMessage('An error occurred. Please check your internet connection and try again.');
            }
        }
        return false;
    };

    const handleSubmit = async () => {
        await createNewManager(managerName, email, password, confirmPassword);
    };

    const animateFlash = () => {
        flashOpacity.setValue(0);
        Animated.sequence([
            Animated.timing(flashOpacity, {
                toValue: 0.7,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(flashOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateBall = () => {
        ballPosition.setValue({ x: 0, y: 0 });
        ballOpacity.setValue(1);

        Animated.parallel([
            Animated.sequence([
                Animated.timing(ballPosition.y, {
                    toValue: -200,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(ballPosition.y, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.bounce,
                }),
            ]),
            Animated.timing(ballPosition.x, {
                toValue: 150,
                duration: 2000,
                useNativeDriver: true,
            }),
            Animated.timing(ballOpacity, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <ImageBackground
            source={require('../images/field.jpg')}
            style={styles.backgroundImage}
        >
            <Animated.View style={[styles.flashOverlay, { opacity: flashOpacity }]} />
            <View style={styles.container}>
                <Text style={styles.title}>Create New Manager</Text>
                <AnimatedInput
                    value={managerName}
                    onChangeText={setManagerName}
                    placeholder="Manager Name"
                    error={!!fieldErrors['username']}
                />
                {fieldErrors['username'] && <ErrorMessage errors={fieldErrors['username']} />}
                <AnimatedInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    keyboardType="email-address"
                    error={!!fieldErrors['email']}
                />
                {fieldErrors['email'] && <ErrorMessage errors={fieldErrors['email']} />}
                <AnimatedInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                    error={!!fieldErrors['password']}
                />
                {fieldErrors['password'] && <ErrorMessage errors={fieldErrors['password']} />}
                <AnimatedInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm Password"
                    secureTextEntry
                    error={!!fieldErrors['confirm_password']}
                />
                {fieldErrors['confirm_password'] && <ErrorMessage errors={fieldErrors['confirm_password']} />}
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Create Account</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.switchButton} onPress={switchToLogin}>
                    <Text style={styles.switchButtonText}>
                        Already have an account?
                    </Text>
                </TouchableOpacity>
                {message ? (
                    <Text style={[styles.message, isSuccess ? styles.successMessage : styles.errorMessage]}>
                        {message}
                    </Text>
                ) : null}
                <Animated.Image
                    source={require('../images/football.png')}
                    style={[
                        styles.footballBall,
                        {
                            transform: [
                                { translateX: ballPosition.x },
                                { translateY: ballPosition.y },
                            ],
                            opacity: ballOpacity,
                        },
                    ]}
                />
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        resizeMode: 'cover',
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 100, 0, 0.7)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 25,
        marginTop: 20,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    message: {
        marginTop: 15,
        textAlign: 'center',
        fontSize: 16,
    },
    successMessage: {
        color: '#4CAF50',
    },
    errorMessage: {
        color: '#FF6347',
    },
    footballBall: {
        width: 40,
        height: 40,
        position: 'absolute',
        top: 20,
        left: 20,
    },
    switchButton: {
        marginTop: 10,
    },
    switchButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

export default ManagerCreation;