import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

const createApi = async () => {
    const baseURL = Config.BASE_URL || 'http://127.0.0.1:8000/';

    const api = axios.create({
        baseURL,
    });

    api.interceptors.request.use(async (config) => {
        const token = await AsyncStorage.getItem('AUTH_TOKEN');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    return api;
};

export default createApi;