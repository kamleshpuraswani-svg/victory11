import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.183:5001/api';

export default function MyTeams() {
    const { matchId } = useLocalSearchParams();
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, [matchId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch teams and players in parallel
            const [teamsRes, playersRes] = await Promise.all([
                axios.get(`${API_URL}/teams/${matchId}`),
                axios.get(`${API_URL}/players/${matchId}`)
            ]);

            setTeams(teamsRes.data.teams);
            setPlayers(playersRes.data.players);
        } catch (err: any) {
            console.error("Fetch my teams error:", err);
            setError("Failed to load your teams.");
        } finally {
            setLoading(false);
        }
    };

    const getPlayerName = (id: string) => {
        const player = players.find(p => p.id === id);
        return player ? player.name : id;
    };

    const renderTeam = ({ item, index }: { item: any, index: number }) => {
        return (
            <View style={styles.teamCard}>
                <View style={styles.teamHeader}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.teamTitle}>Team {index + 1}</Text>
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: '/team-selection',
                                params: {
                                    matchId,
                                    teamId: item._id.toString(),
                                    editSelectedPlayers: JSON.stringify(item.players),
                                    editCaptainId: item.captainId,
                                    editViceCaptainId: item.viceCaptainId
                                }
                            })}
                        >
                            <Ionicons name="pencil" size={20} color="#4caf50" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.roleContainer}>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleLabel}>C: </Text>
                            <Text style={styles.roleValue}>{getPlayerName(item.captainId)}</Text>
                        </View>
                        <View style={[styles.roleBadge, { marginLeft: 10 }]}>
                            <Text style={styles.roleLabel}>VC: </Text>
                            <Text style={styles.roleValue}>{getPlayerName(item.viceCaptainId)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.playersGrid}>
                    {item.players.map((playerId: string) => (
                        <View key={playerId} style={styles.playerNameTag}>
                            <Text style={styles.playerName} numberOfLines={1}>
                                {getPlayerName(playerId)}
                            </Text>
                        </View>
                    ))}
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

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'My Teams' }} />

            {teams.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="people-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No teams created for this match yet.</Text>
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.createBtnText}>Create Team Now</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={teams}
                    renderItem={renderTeam}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={{ padding: 15 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    teamCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    teamHeader: {
        flexDirection: 'column', // Stack vertically for better layout with names
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        marginBottom: 10
    },
    teamTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    roleContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    roleBadge: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignItems: 'center'
    },
    roleLabel: { fontSize: 12, fontWeight: 'bold', color: '#666' },
    roleValue: { fontSize: 12, color: '#333' },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start'
    },
    playerNameTag: {
        backgroundColor: '#e8f5e9',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        margin: 3,
        width: '30%' // Fits ~3 in a row
    },
    playerName: { fontSize: 10, color: '#2e7d32', textAlign: 'center' },
    emptyText: { fontSize: 16, color: '#666', marginTop: 10, textAlign: 'center' },
    createBtn: {
        marginTop: 20,
        backgroundColor: '#4caf50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    createBtnText: { color: '#fff', fontWeight: 'bold' }
});
