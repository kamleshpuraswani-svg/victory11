import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { saveAuthData } from '../utils/storage';
import { API_URL as BASE_URL } from '../constants/Config';

const API_URL = BASE_URL + '/auth';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !phone || !email || !password) {
            setStatusMessage('Please fill in all details');
            return;
        }

        setStatusMessage('Creating your account...');
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/register`, { name, email, phone, password }, { timeout: 10000 });
            console.log("[Register] Success:", response.data);

            const { token, user } = response.data;
            await saveAuthData(token, user);

            setStatusMessage('Success! Redirecting...');
            router.replace('/(tabs)');

        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error("[Register] Error:", errorMsg);

            if (errorMsg.includes('exists')) {
                setStatusMessage('Account exists! Signing you in...');
                // Attempt auto-login if it already exists (common for testing)
                try {
                    const loginRes = await axios.post(`${API_URL}/login`, { identifier: email, password });
                    await saveAuthData(loginRes.data.token, loginRes.data.user);
                    router.replace('/(tabs)');
                    return;
                } catch (lErr) {
                    setStatusMessage('Account exists. Please Sign In below.');
                }
            } else {
                setStatusMessage(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Create Account' }} />

            <View style={styles.card}>
                <Text style={styles.title}>Join MICL 2026</Text>
                <Text style={styles.subtitle}>Start winning cash today!</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    placeholder="Enter your Full Name"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                    placeholder="Enter your mobile number"
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    placeholder="Enter your company email address"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                    placeholder="Enter your password."
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

                <TouchableOpacity
                    style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text style={styles.registerBtnText}>{loading ? 'PROCESSING...' : 'REGISTER'}</Text>
                </TouchableOpacity>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={styles.linkText}>Sign In</Text>
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
    registerBtn: {
        backgroundColor: '#fbbf24',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    registerBtnText: { color: '#1e293b', fontWeight: '900', fontSize: 16 },
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
