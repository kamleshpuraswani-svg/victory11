import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { saveAuthData } from '../utils/storage';

const API_URL = 'http://192.168.0.183:5001/api/auth'; // Using local IP for mobile access

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            const { token, user } = response.data;

            // Store token safely (handles Web/Native)
            await saveAuthData(token, user);

            Alert.alert('Success', `Welcome back, ${user.name}!`);
            router.replace('/');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Login', headerLeft: () => null }} />
            <Text style={styles.title}>Welcome to Fantasy Cricket</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Email or Phone"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>LOGIN</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#333' },
    subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 30, marginTop: 5 },
    inputContainer: { marginBottom: 20 },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee'
    },
    button: {
        backgroundColor: '#4caf50',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2
    },
    buttonDisabled: { backgroundColor: '#a5d6a7' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    linkText: { textAlign: 'center', color: '#666' },
    linkHighlight: { color: '#4caf50', fontWeight: 'bold' }
});
