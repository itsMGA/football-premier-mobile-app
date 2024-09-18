import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import axiosInstance from '../axiosConfig';

const ManagerCreationForm: React.FC = () => {
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const createNewManager = async (
        managerName: string,
        email: string,
        password: string,
        confirmPassword: string
    ): Promise<boolean> => {
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

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
                    console.error('Response Status:', error.response.status);
                    console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
                    setMessage(`Error: ${JSON.stringify(error.response.data)}`);
                } else if (error.request) {
                    console.error('Request Error: No response received from the server');
                    setMessage('Error: No response received from the server');
                } else {
                    console.error('Request Setup Error:', error.message);
                    setMessage(`Error: ${error.message}`);
                }
            } else if (error instanceof Error) {
                console.error('Error Message:', error.message);
                setMessage(`Error: ${error.message}`);
            } else {
                console.error('Unknown Error:', error);
                setMessage('An unknown error occurred');
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

    return (
        <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.container}>
                <Text style={styles.title}>Create New Manager</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Manager Name"
                    value={managerName}
                    onChangeText={setManagerName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TextInput
                    style={styles.input}
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