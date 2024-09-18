import React, { useState, useRef } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    Easing,
    ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import axiosInstance from '../axiosConfig';

interface FieldError {
    [key: string]: string[];
}

const ManagerCreationForm: React.FC = () => {
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldError>({});

    const ballPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const ballOpacity = useRef(new Animated.Value(0)).current;

    const createNewManager = async (
        managerName: string,
        email: string,
        password: string,
        confirmPassword: string
    ): Promise<boolean> => {
        setFieldErrors({});

        if (password !== confirmPassword) {
            setMessage("Passwords don't match");
            setIsSuccess(false);
            return false;
        }

        try {
            console.log('Attempting to create manager...');
            const response = await axiosInstance.post('accounts/create/', {
                username: managerName,
                email,
                password,
                confirm_password: confirmPassword,
            });

            console.log('Create manager response:', response.data);

            if (response.data.token) {
                await AsyncStorage.setItem('AUTH_TOKEN', response.data.token);
                await AsyncStorage.setItem('username', response.data.username);
                setMessage('Manager created successfully');
                setIsSuccess(true);
                return true;
            }
        } catch (error) {
            console.error('API Error:', error);
            setIsSuccess(false);

            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                if (typeof responseData === 'object') {
                    const errors: FieldError = {};
                    for (const [key, value] of Object.entries(responseData)) {
                        if (Array.isArray(value)) {
                            errors[key] = value;
                        }
                    }
                    setFieldErrors(errors);

                    // Set a generic error message for the user
                    setMessage('Please fill in all required fields correctly.');
                } else {
                    setMessage('An error occurred while creating the account. Please try again.');
                }
            } else {
                setMessage('An error occurred. Please check your internet connection and try again.');
            }
        }
        return false;
    };

    const handleCreateManager = async () => {
        const success = await createNewManager(managerName, email, password, confirmPassword);
        if (success) {
            setManagerName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            animateBall();
        }
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

    const getInputStyle = (fieldName: string) => {
        return fieldErrors[fieldName] ? [styles.input, styles.inputError] : styles.input;
    };

    return (
        <ImageBackground
            source={require('../images/field.jpg')}
            style={styles.backgroundImage}
        >
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.container}>
                    <Text style={styles.title}>Create New Manager</Text>
                    <TextInput
                        style={getInputStyle('username')}
                        placeholder="Manager Name"
                        value={managerName}
                        onChangeText={setManagerName}
                        placeholderTextColor="#a0a0a0"
                    />
                    <TextInput
                        style={getInputStyle('email')}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholderTextColor="#a0a0a0"
                    />
                    <TextInput
                        style={getInputStyle('password')}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#a0a0a0"
                    />
                    <TextInput
                        style={getInputStyle('confirm_password')}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholderTextColor="#a0a0a0"
                    />
                    <TouchableOpacity style={styles.button} onPress={handleCreateManager}>
                        <Text style={styles.buttonText}>Create</Text>
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
            </ScrollView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        resizeMode: 'cover',
    },
    scrollView: {
        flexGrow: 1,
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
    input: {
        height: 40,
        borderColor: '#ffffff',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#ffffff',
    },
    inputError: {
        borderColor: 'red',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 5,
        marginTop: 15,
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
});

export default ManagerCreationForm;