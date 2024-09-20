// UserLoginComp.tsx

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
import axiosInstance, { storeEncryptedToken, getDecryptedToken } from '../axiosConfig';
import jwtDecode from 'jwt-decode';
import { AnimatedInput, ErrorMessage } from './SharedComponents';

interface FieldError {
    [key: string]: string[];
}

interface UserLoginCompProps {
    onLoginSuccess: () => void;
    switchToRegister: () => void;
}

const UserLoginComp: React.FC<UserLoginCompProps> = ({ onLoginSuccess, switchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldError>({});

    const ballPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const ballOpacity = useRef(new Animated.Value(0)).current;
    const flashOpacity = useRef(new Animated.Value(0)).current;

    const loginManager = async (email: string, password: string): Promise<boolean> => {
        setFieldErrors({});
        setMessage('');

        try {
            console.log('Attempting to login...');
            const response = await axiosInstance.post('accounts/login/', {
                email,
                password,
            });

            if (response.data && response.data.access) {
                console.log('Access token received. Calling handleLoginSuccess...');
                await handleLoginSuccess(response.data.access);
                return true;
            } else {
                console.error('Login response does not contain access token:', response.data);
                setMessage('Login failed. Please try again.');
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
                    setMessage('An error occurred while logging in. Please try again.');
                }
            } else {
                setMessage('An error occurred. Please check your internet connection and try again.');
            }
        }
        return false;
    };

    const handleLoginSuccess = async (token: string) => {
        try {
            await storeEncryptedToken(token);
            const storedToken = await getDecryptedToken();

            if (storedToken) {
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                console.log('Set Authorization header in axios instance');
            } else {
                console.error('Failed to retrieve stored token');
                throw new Error('Token storage verification failed');
            }

            setMessage('Logged in successfully');
            setIsSuccess(true);
            animateBall();
            animateFlash();
            onLoginSuccess();
        } catch (error) {
            console.error('Error in handleLoginSuccess:', error);
            setMessage('Login failed. Please try again.');
            setIsSuccess(false);
        }
    };

    const handleSubmit = async () => {
        await loginManager(email, password);
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
                <Text style={styles.title}>Login</Text>
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
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.switchButton} onPress={switchToRegister}>
                    <Text style={styles.switchButtonText}>
                        Need to create an account?
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

export default UserLoginComp;