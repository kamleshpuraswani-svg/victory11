import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { saveAuthData } from '../utils/storage';

const API_URL = 'http://192.168.0.183:5001/api/auth';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !phone || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/register`, { name, email, phone, password });
            const { token, user } = response.data;

            // Store token safely (handles Web/Native)
            await saveAuthData(token, user);

            Alert.alert('Success', `Welcome, ${user.name}! Account created.`);
            router.replace('/');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Stack.Screen options={{ title: 'Create Account' }} />
            <Text style={styles.title}>Join the Game</Text>
            <Text style={styles.subtitle}>Create your fantasy profile</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
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
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>REGISTER</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
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
