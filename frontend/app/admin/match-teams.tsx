import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { getAuthToken } from '../../utils/storage';
import { Platform } from 'react-native';
import { API_URL } from '../../constants/Config';
import { Ionicons } from '@expo/vector-icons';

export default function MatchTeamsScreen() {
    const { matchId, matchTitle } = useLocalSearchParams();
    const router = useRouter();

    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (matchId) fetchMatchTeams();
    }, [matchId]);

    const fetchMatchTeams = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await axios.get(`${API_URL}/admin/matches/${matchId}/teams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(response.data.teams);
        } catch (err: any) {
            console.error("Fetch match teams error:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Failed to load users for this match.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const renderTeam = ({ item, index }: { item: any, index: number }) => (
        <TouchableOpacity
            style={styles.teamCard}
            onPress={() => router.push({
                pathname: '/admin/team-details',
                params: { teamId: item._id }
            })}
        >
            <View style={styles.teamInfo}>
                <Text style={styles.userName}>{index + 1}. {item.userId?.name || 'Unknown User'}</Text>
                <Text style={styles.userDetail}>📧 {item.userId?.email || 'N/A'}</Text>
                <Text style={styles.userDetail}>📱 {item.userId?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.teamMeta}>
                <Text style={styles.pointsText}>{item.totalPoints || 0} pts</Text>
                <Text style={styles.viewLink}>View Draft ➡️</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Contest Entry',
                    headerStyle: { backgroundColor: '#1e293b' },
                    headerTintColor: '#fbbf24',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => {
                                if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace('/admin/users');
                                }
                            }}
                            style={{ padding: 10, marginLeft: -5 }}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fbbf24" />
                        </TouchableOpacity>
                    )
                }}
            />

            <View style={styles.header}>
                <Text style={styles.matchName}>{matchTitle || 'Match Details'}</Text>
                <Text style={styles.matchSub}>Users Joined: {teams.length}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1e293b" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : teams.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No users have created teams for this match yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={teams}
                    renderItem={renderTeam}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    matchName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b'
    },
    matchSub: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '600'
    },
    listContainer: {
        padding: 15,
        paddingBottom: 40
    },
    teamCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981'
    },
    teamInfo: {
        flex: 1
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4
    },
    userDetail: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 2
    },
    teamMeta: {
        alignItems: 'flex-end',
        marginLeft: 10
    },
    pointsText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1e293b'
    },
    viewLink: {
        fontSize: 11,
        color: '#10b981',
        fontWeight: '700',
        marginTop: 5
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        fontWeight: '600'
    },
    emptyText: {
        color: '#64748b',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '500'
    }
});
