import React, { useState, useRef, useEffect } from 'react';
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
import axiosInstance, { storeEncryptedToken, storeEncryptedUsername } from '../axiosConfig';

interface FieldError {
    [key: string]: string[];
}

interface AnimatedInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address';
    error?: boolean;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    error,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedIsFocused = useRef(new Animated.Value(value === '' ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(animatedIsFocused, {
            toValue: (isFocused || value !== '') ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [animatedIsFocused, isFocused, value]);

    const labelStyle = {
        position: 'absolute',
        left: 16,
        top: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [18, -10],
        }),
        fontSize: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255, 255, 255, 0.5)', '#ffffff'],
        }),
        backgroundColor: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', 'rgba(0, 100, 0, 0.8)'],
        }),
        paddingHorizontal: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 4],
        }),
        borderRadius: 4,
    };

    return (
        <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <Animated.Text style={labelStyle}>
                {placeholder}
            </Animated.Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                blurOnSubmit
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
        </View>
    );
};

interface ErrorMessageProps {
    errors: string[];
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ errors }) => {
    return (
        <View style={styles.errorContainer}>
            {errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                    {error}
                </Text>
            ))}
        </View>
    );
};

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
    const flashOpacity = useRef(new Animated.Value(0)).current;

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
                confirm_password: confirmPassword,
            });

            console.log('Create manager response:', response.data);

            if (response.data.token) {
                await storeEncryptedToken(response.data.token);
                await storeEncryptedUsername(response.data.username);
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

    const handleCreateManager = async () => {
        const success = await createNewManager(managerName, email, password, confirmPassword);
        if (success) {
            setManagerName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            animateBall();
            animateFlash();
        }
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
            <ScrollView contentContainerStyle={styles.scrollView}>
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
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'white',
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
    inputContainer: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    },
    inputContainerError: {
        borderBottomColor: '#ff3333',
    },
    input: {
        height: 40,
        fontSize: 16,
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
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
    errorContainer: {
        marginBottom: 10,
    },
    errorText: {
        color: '#FF6347',
        fontSize: 14,
        marginLeft: 16,
    },
});

export default ManagerCreationForm;