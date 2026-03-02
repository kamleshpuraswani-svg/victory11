import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL as BASE_URL } from '../constants/Config';

const API_URL = BASE_URL + '/auth';

export default function ForgotPasswordScreen() {
    const [identifier, setIdentifier] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const router = useRouter();

    const handleReset = async () => {
        if (!identifier || !newPassword || !confirmPassword) {
            setStatusMessage('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatusMessage('Passwords do not match');
            return;
        }

        setStatusMessage('Resetting password...');
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/reset-password`, { identifier, newPassword }, { timeout: 10000 });
            setStatusMessage('Success! Redirecting to Sign In...');

            Alert.alert('Success', 'Password reset successfully. Please sign in with your new password.', [
                { text: 'OK', onPress: () => router.replace('/login') }
            ]);

            // Fallback for web
            setTimeout(() => {
                router.replace('/login');
            }, 2000);

        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            setStatusMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Stack.Screen options={{ title: 'Reset Password', headerTransparent: true, headerTintColor: '#fff' }} />

            <View style={styles.card}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your details to set a new password</Text>

                <Text style={styles.label}>Email or Mobile Number</Text>
                <TextInput
                    placeholder="Enter registered Email or Mobile"
                    style={styles.input}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                />

                <Text style={styles.label}>New Password</Text>
                <TextInput
                    placeholder="Enter new password"
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                />

                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                    placeholder="Confirm new password"
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                {statusMessage ? (
                    <Text style={[
                        styles.statusMessage,
                        statusMessage.includes('Success') ? styles.successText : styles.errorText
                    ]}>
                        {statusMessage}
                    </Text>
                ) : null}

                <TouchableOpacity
                    style={[styles.resetBtn, loading && { opacity: 0.7 }]}
                    onPress={handleReset}
                    disabled={loading}
                >
                    <Text style={styles.resetBtnText}>{loading ? 'RESETTING...' : 'RESET PASSWORD'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Back to Sign In</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    card: {
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10
    },
    title: { fontSize: 28, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30 },
    label: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginTop: 10 },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 10
    },
    statusMessage: {
        textAlign: 'center',
        marginVertical: 15,
        fontSize: 14,
        fontWeight: '700'
    },
    errorText: { color: '#ef4444' },
    successText: { color: '#10b981' },
    resetBtn: {
        backgroundColor: '#fbbf24',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 10
    },
    resetBtnText: { color: '#1e293b', fontWeight: '900', fontSize: 16 },
    backLink: { marginTop: 25, alignItems: 'center' },
    backLinkText: { color: '#1e293b', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' }
});
