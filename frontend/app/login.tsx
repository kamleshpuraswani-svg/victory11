import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { saveAuthData } from '../utils/storage';
import { API_URL as BASE_URL } from '../constants/Config';

const API_URL = BASE_URL + '/auth';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        if (!identifier || !password) {
            setStatusMessage('Please enter your details');
            return;
        }

        setStatusMessage('Signing you in...');
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, { identifier, password }, { timeout: 10000 });
            const { token, user } = response.data;
            await saveAuthData(token, user);

            setStatusMessage('Success! Redirecting...');
            if (user?.role === 'ADMIN') {
                router.replace('/admin/users');
            } else {
                router.replace('/(tabs)');
            }

        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            setStatusMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Sign In' }} />

            <View style={styles.card}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Enter your details to play & win</Text>

                <Text style={styles.label}>Email or Mobile Number</Text>
                <TextInput
                    placeholder="Email or Mobile Number"
                    style={styles.input}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                />
                <Text style={styles.label}>Password</Text>
                <TextInput
                    placeholder="Password"
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {statusMessage ? (
                    <Text style={[
                        styles.statusMessage,
                        statusMessage.includes('Success') || statusMessage.includes('Redirecting') ? styles.successText : styles.errorText
                    ]}>
                        {statusMessage}
                    </Text>
                ) : null}

                <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPasswordLinkCenter}>
                    <Text style={styles.forgotPasswordLinkTextPrimary}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.loginBtnText}>SIGN IN</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>New user? </Text>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                        <Text style={styles.linkText}>Register Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', padding: 25 },
    card: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10
    },
    title: { fontSize: 24, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30, marginTop: 5 },
    label: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginLeft: 5 },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 15,
        borderRadius: 12,
        marginBottom: 18,
        fontSize: 16
    },
    loginBtn: {
        backgroundColor: '#fbbf24',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    loginBtnText: { color: '#1e293b', fontWeight: '900', fontSize: 16 },
    forgotPasswordLinkCenter: { alignSelf: 'center', marginBottom: 20 },
    forgotPasswordLinkTextPrimary: { color: '#ef4444', fontWeight: '800', textDecorationLine: 'underline', fontSize: 14 },
    statusMessage: {
        textAlign: 'center',
        marginBottom: 15,
        fontSize: 14,
        fontWeight: '700',
        padding: 5
    },
    errorText: { color: '#ef4444' },
    successText: { color: '#10b981' },
    footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
    footerText: { color: '#64748b', fontSize: 14 },
    linkText: { color: '#1e293b', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' }
});
