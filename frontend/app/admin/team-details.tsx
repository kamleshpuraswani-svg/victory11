import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { getAuthToken } from '../../utils/storage';
import { API_URL } from '../../constants/Config';
import { Platform } from 'react-native';

export default function AdminTeamDetails() {
    const { teamId } = useLocalSearchParams();
    const router = useRouter();

    const [team, setTeam] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (teamId) fetchTeamDetails();
    }, [teamId]);

    const fetchTeamDetails = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            if (!token) {
                router.replace('/login');
                return;
            }

            // 1. Fetch team details
            const teamRes = await axios.get(`${API_URL}/admin/teams/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedTeam = teamRes.data.team;
            setTeam(fetchedTeam);

            // 2. Fetch all players for this match
            if (fetchedTeam?.matchId) {
                const playersRes = await axios.get(`${API_URL}/players/${fetchedTeam.matchId}`);
                setPlayers(playersRes.data.players || []);
            }

        } catch (err: any) {
            console.error("Fetch team error:", err);
            setError("Failed to load team details.");
        } finally {
            setLoading(false);
        }
    };

    const getPlayerDetails = (id: string) => {
        return players.find(p => p.id === id) || { name: id, role: 'Unknown', team: 'Unknown' };
    };

    const renderPlayer = ({ item }: { item: string }) => {
        const playerInfo = getPlayerDetails(item);
        const isCaptain = team?.captainId === item;
        const isViceCaptain = team?.viceCaptainId === item;

        return (
            <View style={styles.playerCard}>
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{playerInfo.name}</Text>
                    <Text style={styles.playerRole}>{playerInfo.role} • {playerInfo.team}</Text>
                </View>
                {isCaptain && <View style={styles.capBadge}><Text style={styles.badgeText}>C</Text></View>}
                {isViceCaptain && <View style={[styles.capBadge, { backgroundColor: '#94a3b8' }]}><Text style={styles.badgeText}>VC</Text></View>}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    if (error || !team) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error || "Team not found"}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Team Details',
                    headerStyle: { backgroundColor: '#1e293b' },
                    headerTintColor: '#fbbf24'
                }}
            />

            <View style={styles.headerCard}>
                <Text style={styles.matchTitle}>Match: {team.matchId}</Text>
                <View style={styles.statsRow}>
                    <Text style={styles.statText}>Players: {team.players?.length || 0}/11</Text>
                    <Text style={styles.statText}>Points: {team.totalPoints || 0}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Selected Players</Text>

            <FlatList
                data={team.players}
                renderItem={renderPlayer}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
    headerCard: {
        backgroundColor: '#fff',
        padding: 20,
        margin: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderBottomWidth: 4,
        borderBottomColor: '#1e293b'
    },
    matchTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 10
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748b',
        marginHorizontal: 15,
        marginBottom: 10,
        textTransform: 'uppercase'
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30
    },
    playerCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 3,
        borderLeftColor: '#fbbf24'
    },
    playerInfo: {
        flex: 1
    },
    playerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b'
    },
    playerRole: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2
    },
    capBadge: {
        backgroundColor: '#fbbf24',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10
    },
    badgeText: {
        color: '#1e293b',
        fontWeight: '800',
        fontSize: 12
    }
});
