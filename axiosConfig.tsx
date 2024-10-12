import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import * as encryptUtils from './encryptUtils';
import RNFS from 'react-native-fs';

const baseURL = Config.BASE_URL || 'https://football.eliptum.tech/';
const debugMode = true;
const noAuthEndpoints = [
    'accounts/create/',
    'accounts/login/'
    // Add any other endpoints that don't require authentication
];

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
    return `\n${line}[${message}]${line}`;
};

const logToFile = async (message: string) => {
    const logFilePath = `${RNFS.DocumentDirectoryPath}/api_logs.txt`;
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;

    try {
        await RNFS.appendFile(logFilePath, logMessage, 'utf8');
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
};

axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const isNoAuthEndpoint = noAuthEndpoints.some(endpoint => config.url?.includes(endpoint));

            if (!isNoAuthEndpoint) {
                const token = await getDecryptedToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } else {
                delete config.headers.Authorization;
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
            await logToFile(`Error retrieving token: ${error}`);
        }

        if (debugMode) {
            const requestLog = `
${logSeparator(`Request to ${config.baseURL}${config.url}`)}
Headers: ${JSON.stringify(config.headers, null, 2)}
Data: ${JSON.stringify(config.data, null, 2)}
${logSeparator('End of Request')}`;

            console.log(requestLog);
            await logToFile(requestLog);
        }
        return config;
    },
    async (error) => {
        if (debugMode) {
            const errorLog = `
${logSeparator('Request Error')}
${error}
${logSeparator('End of Request Error')}`;

            console.error(errorLog);
            await logToFile(errorLog);
        }
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    async (response) => {
        if (debugMode) {
            const responseLog = `
${logSeparator(`Response from ${response.config.url}`)}
Status: ${response.status}
Data: ${JSON.stringify(response.data, null, 2)}
${logSeparator('End of Response')}`;

            console.log(responseLog);
            await logToFile(responseLog);
        }
        return response;
    },
    async (error) => {
        if (debugMode) {
            const errorLog = `
${logSeparator(`Error Response from ${error.config?.url || 'unknown endpoint'}`)}
${error.response ? `Status: ${error.response.status}
Data: ${JSON.stringify(error.response.data, null, 2)}` : `Error: ${error.message}`}
${logSeparator('End of Error Response')}`;

            console.error(errorLog);
            await logToFile(errorLog);
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