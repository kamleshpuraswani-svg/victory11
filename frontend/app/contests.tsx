import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.183:5001/api';

export default function Contests() {
    const { matchId, teamA, teamB } = useLocalSearchParams();
    const router = useRouter();
    const [contests, setContests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContests();
    }, [matchId]);

    const fetchContests = async () => {
        try {
            const response = await axios.get(`${API_URL}/contests/${matchId}`);
            setContests(response.data.contests);
        } catch (err) {
            console.error("Fetch contests error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = (contest: any) => {
        // Navigate directly to team selection for this match
        router.push({
            pathname: '/team-selection',
            params: { matchId, teamA, teamB }
        });
    };

    const renderContest = ({ item }: { item: any }) => (
        <View style={styles.contestCard}>
            <View style={styles.contestInfo}>
                <Text style={styles.contestName}>{item.name}</Text>
                <Text style={styles.contestDesc}>Join the ultimate challenge and win big!</Text>
            </View>
            <TouchableOpacity
                style={styles.entryBtn}
                onPress={() => handleJoin(item)}
            >
                <Text style={styles.entryBtnText}>Join</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4caf50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Contests' }} />

            <View style={styles.matchSummary}>
                <Text style={styles.matchTeams}>{teamA} vs {teamB}</Text>
            </View>

            <FlatList
                data={contests}
                renderItem={renderContest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 15 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    matchSummary: {
        backgroundColor: '#fff',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center'
    },
    matchTeams: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    contestCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    contestInfo: { flex: 1 },
    contestName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    contestDesc: { fontSize: 13, color: '#666', marginTop: 4 },
    entryBtn: {
        backgroundColor: '#4caf50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center'
    },
    entryBtnText: { color: '#fff', fontWeight: 'bold' }
});
