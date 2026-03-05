import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, Platform, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { getAuthToken } from '../utils/storage';
import { API_URL } from '../constants/Config';

export default function UserTeamDetails() {
    const { teamId, readonly } = useLocalSearchParams();
    const router = useRouter();

    const [team, setTeam] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [matchStats, setMatchStats] = useState<any[]>([]);
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

            // 1. Fetch team details using the appropriate API
            let fetchedTeam;
            if (readonly === 'true') {
                // For viewing others, we use an admin or public read-only route if one exists,
                // or just use admin details API which is currently accessible with a token
                // Wait, the admin API requires ADMIN role. Let's add a quick public or user-accessible details route.
                // Actually, the current API /teams/details/:teamId filters by userId.
                console.log("Readonly mode requested")
            }

            // To make things simple and secure without massive backend refactoring, 
            // the /teams/details/:teamId currently restricts to the token owner.
            // Let's create a specific public view route in the backend api.js first or update it here.

            // Wait, we need to update the backend route /api/teams/public/:teamId or similar
            // Let's assume we'll just hit the regular route and if it fails, fallback to a new one we create.
            // For now, let's fetch using a generic fetch if readonly.
            let url = readonly === 'true' ? `${API_URL}/team-public/${teamId}` : `${API_URL}/teams/details/${teamId}`;

            const teamRes = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchedTeam = teamRes.data.team;
            setTeam(fetchedTeam);

            // 2. Fetch all players for this match to get player names/roles
            if (fetchedTeam?.matchId) {
                const playersRes = await axios.get(`${API_URL}/players/${fetchedTeam.matchId}`);
                setPlayers(playersRes.data.players || []);

                // 3. Fetch match details to get playerStats if available
                try {
                    const matchRes = await axios.get(`${API_URL}/matches/upcoming`); // Using existing generic list for simplicity
                    const match = matchRes.data.matches.find((m: any) => m.id === fetchedTeam.matchId);
                    if (match && match.playerStats) {
                        setMatchStats(match.playerStats);
                    }
                } catch (e) {
                    console.error("Could not fetch match stats", e);
                }
            }

        } catch (err: any) {
            console.error("Fetch team error:", err);
            setError("Failed to load team details.");
        } finally {
            setLoading(false);
        }
    };

    const getPlayerDetails = (id: string) => {
        return players.find(p => p.id === id) || { name: 'Player ' + id, role: 'Unknown', team: 'Unknown' };
    };

    const renderPlayer = ({ item }: { item: string }) => {
        const playerInfo = getPlayerDetails(item);
        const isCaptain = team?.captainId === item;
        const isViceCaptain = team?.viceCaptainId === item;

        // Find if this player has points
        const stat = matchStats.find(s => s.playerId === item);
        let pts = stat ? stat.fantasyPoints : 0;

        if (isCaptain) pts *= 2;
        else if (isViceCaptain) pts *= 1.5;

        return (
            <View style={styles.playerCard}>
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{playerInfo.name}</Text>
                    <Text style={styles.playerRole}>{playerInfo.role} • {playerInfo.team}</Text>
                </View>
                {stat && (
                    <View style={styles.pointsPill}>
                        <Text style={styles.pointsPillText}>{pts} pts</Text>
                    </View>
                )}
                <View style={styles.badgeRow}>
                    {isCaptain && (
                        <View style={styles.capBadge}>
                            <Text style={styles.badgeText}>C</Text>
                        </View>
                    )}
                    {isViceCaptain && (
                        <View style={[styles.capBadge, { backgroundColor: '#475569' }]}>
                            <Text style={styles.badgeText}>VC</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4caf50" />
            </View>
        );
    }

    if (error || !team) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error || "Team not found"}</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Team Preview',
                    headerStyle: { backgroundColor: '#4caf50' },
                    headerTintColor: '#fff',
                }}
            />

            <View style={styles.headerCard}>
                <View style={styles.matchInfoHeader}>
                    <Text style={styles.matchTitle}>{readonly === 'true' ? 'Team Preview' : 'My Selection'}</Text>
                    <Ionicons name="football" size={24} color="#4caf50" />
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{team.players?.length || 0}/11</Text>
                        <Text style={styles.statLabel}>PLAYERS</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{team.totalPoints || 0}</Text>
                        <Text style={styles.statLabel}>POINTS</Text>
                    </View>
                    {readonly !== 'true' && (
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => router.push({
                                pathname: '/team-selection',
                                params: {
                                    matchId: team.matchId,
                                    isEdit: 'true',
                                    teamId: team._id
                                }
                            })}
                        >
                            <Ionicons name="create-outline" size={16} color="#4caf50" />
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Text style={styles.sectionTitle}>Drafted Players</Text>

            <FlatList
                data={team.players}
                renderItem={renderPlayer}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 16, fontWeight: '600', marginBottom: 20 },
    backBtn: { padding: 10, backgroundColor: '#4caf50', borderRadius: 8 },
    backBtnText: { color: '#fff', fontWeight: 'bold' },
    headerCard: {
        backgroundColor: '#fff',
        padding: 20,
        margin: 15,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderLeftWidth: 6,
        borderLeftColor: '#4caf50'
    },
    matchInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    matchTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1e293b',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statBox: {
        alignItems: 'flex-start'
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b'
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        marginTop: 2
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#dcfce7'
    },
    editBtnText: {
        marginLeft: 4,
        fontSize: 13,
        fontWeight: '700',
        color: '#4caf50'
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#94a3b8',
        marginHorizontal: 15,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30
    },
    playerCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#f1f5f9'
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
    pointsPill: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0'
    },
    pointsPillText: {
        color: '#16a34a',
        fontSize: 11,
        fontWeight: '800'
    },
    badgeRow: {
        flexDirection: 'row'
    },
    capBadge: {
        backgroundColor: '#fbbf24',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        elevation: 2
    },
    badgeText: {
        color: '#1e293b',
        fontWeight: '900',
        fontSize: 11
    }
});
