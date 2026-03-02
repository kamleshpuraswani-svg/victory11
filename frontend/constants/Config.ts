import { Platform } from 'react-native';

const getApiUrl = () => {
    // 1. Check if an environmental variable is provided (Vercel/Production)
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

    // 2. Fallback logic for local development
    if (Platform.OS === 'web') {
        const hostname = (typeof window !== 'undefined' && window.location)
            ? window.location.hostname
            : 'localhost';
        return `http://${hostname}:5001/api`;
    }

    // Replace this with your machine's local IP for mobile testing if needed
    // or use a tunneling service like Ngrok
    return 'http://192.168.0.183:5001/api';
};

export const API_URL = getApiUrl();
