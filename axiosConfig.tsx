import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

// const baseURL = Config.BASE_URL || 'http://127.0.0.1:8000/';
const baseURL = 'https://football.eliptum.tech/';
const debugMode = true;  // Toggle this to true/false for enabling/disabling logs

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    async (config) => {
        // Try to get the token from AsyncStorage
        const token = await AsyncStorage.getItem('AUTH_TOKEN');

        // If a token is found, add it to the headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Debugging: Log request details if debugMode is true
        if (debugMode) {
            console.log('----- REQUEST METHOD: ' + config.method?.toUpperCase() + ' -----');
            console.log('----- REQUEST URL: ' + config.baseURL + config.url + ' -----');
            console.log('Request Headers:', JSON.stringify(config.headers, null, 2));
            console.log('Request Data:', JSON.stringify(config.data, null, 2));
        }

        return config;
    },
    (error) => {
        if (debugMode) {
            console.error('Request Error:', error);
        }
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Debugging: Log response details if debugMode is true
        if (debugMode) {
            console.log('----- RESPONSE STATUS: ' + response.status + ' -----');
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        }
        return response;
    },
    (error) => {
        if (debugMode) {
            if (error.response) {
                console.log('----- RESPONSE ERROR STATUS: ' + error.response.status + ' -----');
                console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.log('Request Error:', error.message);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
