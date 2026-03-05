import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { getAuthToken } from '../../utils/storage';

type Player = {
    playerId: string;
    name: string;
    team: string;
    role: string;
};

type PlayerStat = {
    playerId: string;
    runs: string;
    wickets: string;
    catches: string;
    stumpings: string;
};

export default function AdminScorecardScreen() {
    const { matchId } = useLocalSearchParams();
    const router = useRouter();

    const [players, setPlayers] = useState<Player[]>([]);
    const [stats, setStats] = useState<{ [key: string]: PlayerStat }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [matchId]);

    const fetchData = async () => {
        try {
            // Fetch match players
            const playersRes = await axios.get(`${API_URL}/players/${matchId}`);

            // Fetch existing match stats if any
            const token = await getAuthToken();
            const matchRes = await axios.get(`${API_URL}/matches/upcoming`); // Assuming there's a way to get this match. 
            // We'll actually fetch the specific match from the upcoming list manually here for simplicity
            const allMatches = matchRes.data.matches;
            const matchData = allMatches.find((m: any) => m.id === matchId) || { playerStats: [] };

            const fetchedPlayers: Player[] = playersRes.data.players || [];

            // Initialize stats state
            const initialStats: { [key: string]: PlayerStat } = {};
            fetchedPlayers.forEach(p => {
                const existingStat = matchData.playerStats?.find((ps: any) => ps.playerId === p.playerId);

                initialStats[p.playerId] = {
                    playerId: p.playerId,
                    runs: existingStat?.runs?.toString() || '',
                    wickets: existingStat?.wickets?.toString() || '',
                    catches: existingStat?.catches?.toString() || '',
                    stumpings: existingStat?.stumpings?.toString() || ''
                };
            });

            setPlayers(fetchedPlayers);
            setStats(initialStats);
        } catch (error) {
            console.error("Error fetching scorecard data:", error);
            Alert.alert("Error", "Could not fetch players data.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatChange = (playerId: string, field: keyof PlayerStat, value: string) => {
        // Only allow numbers
        const numValue = value.replace(/[^0-9]/g, '');

        setStats(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [field]: numValue
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await getAuthToken();

            // Convert state map to array
            const playerStatsArray = Object.values(stats).map(s => ({
                playerId: s.playerId,
                runs: Number(s.runs) || 0,
                wickets: Number(s.wickets) || 0,
                catches: Number(s.catches) || 0,
                stumpings: Number(s.stumpings) || 0
            }));

            await axios.put(
                `${API_URL}/admin/matches/${matchId}/player-stats`,
                { playerStats: playerStatsArray },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert("Success", "Player stats updated and fantasy points calculated!", [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error("Save stats error:", error);
            Alert.alert("Error", "Failed to save player stats.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            <Stack.Screen options={{
                title: 'Player Scorecard',
                headerStyle: { backgroundColor: '#1e293b' },
                headerTintColor: '#fff'
            }} />

            <View style={styles.infoBanner}>
                <Text style={styles.infoText}>Enter actual match stats below.</Text>
                <Text style={styles.infoSubtext}>Fantasy points are auto-calculated on save.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, styles.nameCell]}>Player</Text>
                    <Text style={styles.headerCell}>R</Text>
                    <Text style={styles.headerCell}>W</Text>
                    <Text style={styles.headerCell}>C</Text>
                    <Text style={styles.headerCell}>S</Text>
                </View>

                {players.map((player) => (
                    <View key={player.playerId} style={styles.playerRow}>
                        <View style={styles.nameCell}>
                            <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                            <Text style={styles.playerRole}>{player.team} • {player.role}</Text>
                        </View>

                        <TextInput
                            style={styles.inputField}
                            value={stats[player.playerId]?.runs}
                            onChangeText={(val) => handleStatChange(player.playerId, 'runs', val)}
                            keyboardType="number-pad"
                            maxLength={3}
                            placeholder="0"
                        />
                        <TextInput
                            style={styles.inputField}
                            value={stats[player.playerId]?.wickets}
                            onChangeText={(val) => handleStatChange(player.playerId, 'wickets', val)}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="0"
                        />
                        <TextInput
                            style={styles.inputField}
                            value={stats[player.playerId]?.catches}
                            onChangeText={(val) => handleStatChange(player.playerId, 'catches', val)}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="0"
                        />
                        <TextInput
                            style={styles.inputField}
                            value={stats[player.playerId]?.stumpings}
                            onChangeText={(val) => handleStatChange(player.playerId, 'stumpings', val)}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="0"
                        />
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>CALCULATE & UPDATE POINTS</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoBanner: {
        backgroundColor: '#e0f2fe',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#bae6fd'
    },
    infoText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0369a1'
    },
    infoSubtext: {
        fontSize: 12,
        color: '#0284c7',
        marginTop: 2
    },
    scrollContent: {
        paddingBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1'
    },
    headerCell: {
        width: 45,
        textAlign: 'center',
        fontWeight: '800',
        color: '#64748b',
        fontSize: 13
    },
    nameCell: {
        flex: 1,
        textAlign: 'left'
    },
    playerRow: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        alignItems: 'center'
    },
    playerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b'
    },
    playerRole: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2
    },
    inputField: {
        width: 40,
        height: 36,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        textAlign: 'center',
        marginHorizontal: 2,
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a'
    },
    footer: {
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    saveBtn: {
        backgroundColor: '#16a34a',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3
    },
    saveBtnDisabled: {
        backgroundColor: '#86efac'
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1
    }
});
