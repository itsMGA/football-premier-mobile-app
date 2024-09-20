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

const logSeparator = (message: string) => {
    const line = '-'.repeat(30);
    console.log(`\n${line}[${message}]${line}`);
};

axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const token = await getDecryptedToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                delete config.headers.Authorization;
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
        }

        if (debugMode) {
            logSeparator(`Request to ${config.baseURL}${config.url}`);
            // console.log(`Method: ${config.method?.toUpperCase()}`);
            // console.log(`URL: ${config.baseURL}${config.url}`);
            console.log('Headers:', JSON.stringify(config.headers, null, 2));
            console.log('Data:', JSON.stringify(config.data, null, 2));
            // console.log('cURL Command:', toCurlCommand(config));
        }

        return config;
    },
    (error) => {
        if (debugMode) {
            logSeparator('Request Error');
            console.error(error);
        }
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        if (debugMode) {
            logSeparator(`Response from ${response.config.url}`);
            console.log(`Status: ${response.status}`);
            console.log('Data:', JSON.stringify(response.data, null, 2));
            logSeparator('End of Response');
        }
        return response;
    },
    (error) => {
        if (debugMode) {
            logSeparator(`Error Response from ${error.config?.url || 'unknown endpoint'}`);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error('Error:', error.message);
            }
            logSeparator('End of Error Response');
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

export const removeEncryptedToken = async (): Promise<void> => {
    const encryptedKey = encryptUtils.encryptKey('AUTH_TOKEN');
    await AsyncStorage.removeItem(encryptedKey);
};

export default axiosInstance;