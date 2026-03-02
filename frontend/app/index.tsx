import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { getAuthToken } from '../utils/storage';

export default function SplashScreen() {
    const router = useRouter();

    const handleProceed = async () => {
        // Directing to Register as requested to test the new UI
        router.replace('/register');
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.mainContent}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/logo_micl.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.appName}>MICL 2026</Text>
                    <Text style={styles.tagline}>MINDINVENTORY CRICKET LEAGUE</Text>
                    <Text style={styles.subTagline}>Play & Win Fantasy Cricket</Text>
                </View>

                <View style={styles.bottomSection}>
                    <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                        <Text style={styles.proceedBtnText}>PROCEED</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerText}>Official Fantasy Partner</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e293b', // Professional Dark Navy/Slate
    },
    mainContent: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    logo: {
        width: 250,
        height: 250,
        marginBottom: 20,
    },
    appName: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 18,
        color: '#fbbf24', // Gold highlight
        fontWeight: '800',
        marginTop: 5,
        letterSpacing: 2,
    },
    subTagline: {
        fontSize: 14,
        color: '#cbd5e1',
        fontWeight: '500',
        marginTop: 5,
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    proceedBtn: {
        backgroundColor: '#fbbf24', // Gold button
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    proceedBtnText: {
        color: '#1e293b',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 20,
        fontWeight: '600',
        textTransform: 'uppercase',
    }
});
