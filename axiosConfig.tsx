import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import * as encryptUtils from './encryptUtils';

const baseURL = Config.BASE_URL || 'https://football.eliptum.tech/';
const debugMode = true;

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000,
});

const toCurlCommand = (config: any) => {
    const headers = Object.entries(config.headers)
        .map(([key, value]) => `-H "${key}: ${value}"`)
        .join(' ');

    const data = config.data ? `-d '${JSON.stringify(config.data)}'` : '';

    return `curl -X ${config.method?.toUpperCase()} ${headers} ${data} "${config.baseURL}${config.url}"`;
};

axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const token = await getDecryptedToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                // If there's no token, remove the Authorization header
                delete config.headers.Authorization;
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
        }

        if (debugMode) {
            console.log('----- REQUEST METHOD: ' + config.method?.toUpperCase() + ' -----');
            console.log('----- REQUEST URL: ' + config.baseURL + config.url + ' -----');
            console.log('Request Headers:', JSON.stringify(config.headers, null, 2));
            console.log('Request Data:', JSON.stringify(config.data, null, 2));
            console.log('cURL Command:', toCurlCommand(config));
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

axiosInstance.interceptors.response.use(
    (response) => {
        if (debugMode) {
            console.log('----- RESPONSE STATUS: ' + response.status + ' -----');
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        }
        return response;
    },
    (error) => {
        if (debugMode) {
            if (error.response) {
                console.error('----- RESPONSE ERROR STATUS: ' + error.response.status + ' -----');
                console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error('Request Error:', error.message);
            }
        }
        return Promise.reject(error);
    }
);

export const storeEncryptedToken = async (token: string) => {
    await encryptUtils.encryptAndStore('AUTH_TOKEN', token);
};

export const storeEncryptedUsername = async (username: string) => {
    await encryptUtils.encryptAndStore('username', username);
};

export const getDecryptedToken = async () => {
    return await encryptUtils.retrieveAndDecrypt('AUTH_TOKEN');
};

export const getDecryptedUsername = async () => {
    return await encryptUtils.retrieveAndDecrypt('username');
};

export default axiosInstance;