import React, { useState, useEffect } from 'react';
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
import { AxiosInstance } from 'axios';
import createApi from '../axiosConfig';

const ManagerCreationForm: React.FC = () => {
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [api, setApi] = useState<AxiosInstance | null>(null);

    useEffect(() => {
        const initializeApi = async () => {
            const createdApi = await createApi();
            setApi(createdApi);
        };
        initializeApi();
    }, []);

    const createNewManager = async (
        managerName: string,
        email: string,
        password: string,
        confirmPassword: string
    ): Promise<boolean> => {
        if (password !== confirmPassword) {
            Alert.alert('Error', "Passwords don't match");
            return false;
        }

        if (!api) {
            Alert.alert('Error', 'API not initialized');
            return false;
        }

        try {
            const response = await api.post('/create/', {
                username: managerName,
                email,
                password,
                confirm_password: confirmPassword,
            });

            if (response.data.token) {
                await AsyncStorage.setItem('AUTH_TOKEN', response.data.token);
                await AsyncStorage.setItem('username', response.data.username);
                return true;
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message || 'An error occurred while creating the manager');
            } else {
                Alert.alert('Error', 'An unexpected error occurred');
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
            Alert.alert('Success', 'Manager created successfully');
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
});

export default ManagerCreationForm;