import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const saveAuthData = async (token: string, userData: any) => {
    if (Platform.OS === 'web') {
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
    } else {
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    }
};

export const getAuthToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('userToken');
    } else {
        return await SecureStore.getItemAsync('userToken');
    }
};

export const getAuthUser = async () => {
    if (Platform.OS === 'web') {
        const data = localStorage.getItem('userData');
        return data ? JSON.parse(data) : null;
    } else {
        const data = await SecureStore.getItemAsync('userData');
        return data ? JSON.parse(data) : null;
    }
};

export const clearAuthData = async () => {
    if (Platform.OS === 'web') {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
    } else {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
    }
};
