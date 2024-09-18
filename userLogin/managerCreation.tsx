import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
            // Navigate to the main app screen here
        }
    };

    const getInputStyle = (fieldName: string) => {
        return fieldErrors[fieldName] ? [styles.input, styles.inputError] : styles.input;
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.container}>
                <Text style={styles.title}>Create New Manager</Text>
                <TextInput
                    style={getInputStyle('username')}
                    placeholder="Manager Name"
                    value={managerName}
                    onChangeText={setManagerName}
                />
                <TextInput
                    style={getInputStyle('email')}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                <TextInput
                    style={getInputStyle('password')}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TextInput
                    style={getInputStyle('confirm_password')}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={handleCreateManager}>
                    <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
                {message ? (
                    <Text style={[styles.message, isSuccess ? styles.successMessage : styles.errorMessage]}>
                        {message}
                    </Text>
                ) : null}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    inputError: {
        borderColor: 'red',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    message: {
        marginTop: 10,
        textAlign: 'center',
    },
    successMessage: {
        color: 'green',
    },
    errorMessage: {
        color: 'red',
    },
});

export default ManagerCreationForm;