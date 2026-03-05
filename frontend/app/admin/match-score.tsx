import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { getAuthToken } from '../../utils/storage';
import { Ionicons } from '@expo/vector-icons';

export default function AdminMatchScore() {
    const { matchId, teamA, teamB } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [score, setScore] = useState({
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        target: '',
        battingTeam: teamA as string,
        lastEvent: ''
    });

    useEffect(() => {
        const fetchCurrentScore = async () => {
            try {
                const response = await axios.get(`${API_URL}/matches/upcoming`);
                const match = response.data.matches.find((m: any) => m.id === matchId);
                if (match && match.liveScore) {
                    setScore({
                        ...match.liveScore,
                        target: match.liveScore.target ? match.liveScore.target.toString() : ''
                    });
                }
            } catch (err) {
                console.error("Fetch score error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentScore();
    }, [matchId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getAuthToken();
            await axios.put(`${API_URL}/admin/matches/${matchId}/score`,
                {
                    liveScore: {
                        ...score,
                        runs: Number(score.runs),
                        wickets: Number(score.wickets),
                        overs: Number(score.overs),
                        balls: Number(score.balls),
                        target: score.target === '' ? undefined : Number(score.target)
                    }
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert("Success", "Live score updated & broadcasted!");
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to update score");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4caf50" /></View>;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{
                title: 'Update Live Score',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                )
            }} />

            <View style={styles.card}>
                <Text style={styles.label}>Batting Team</Text>
                <View style={styles.pickerRow}>
                    <TouchableOpacity
                        style={[styles.pickerBtn, score.battingTeam === teamA && styles.pickerBtnActive]}
                        onPress={() => setScore({ ...score, battingTeam: teamA as string })}
                    >
                        <Text style={[styles.pickerText, score.battingTeam === teamA && styles.pickerTextActive]}>{teamA}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.pickerBtn, score.battingTeam === teamB && styles.pickerBtnActive]}
                        onPress={() => setScore({ ...score, battingTeam: teamB as string })}
                    >
                        <Text style={[styles.pickerText, score.battingTeam === teamB && styles.pickerTextActive]}>{teamB}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Runs</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={score.runs.toString()}
                            onChangeText={(val) => setScore({ ...score, runs: parseInt(val) || 0 })}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Wickets</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={score.wickets.toString()}
                            onChangeText={(val) => setScore({ ...score, wickets: parseInt(val) || 0 })}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Overs</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={score.overs.toString()}
                            onChangeText={(val) => setScore({ ...score, overs: parseInt(val) || 0 })}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Balls</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={score.balls.toString()}
                            onChangeText={(val) => setScore({ ...score, balls: parseInt(val) || 0 })}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Target (Optional)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="e.g. 150"
                    value={score.target}
                    onChangeText={(val) => setScore({ ...score, target: val })}
                />

                <Text style={styles.label}>Last Action / Commentary</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="e.g. 6 runs by Sanskar Mehta"
                    multiline
                    value={score.lastEvent}
                    onChangeText={(val) => setScore({ ...score, lastEvent: val })}
                />

                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveBtnText}>{saving ? 'UPDATING...' : 'UPDATE LIVE SCORE'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 3 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8, marginTop: 15 },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1e293b'
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    inputGroup: { width: '48%' },
    pickerRow: { flexDirection: 'row', gap: 10 },
    pickerBtn: {
        flex: 1,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        alignItems: 'center'
    },
    pickerBtnActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
    pickerText: { fontWeight: 'bold', color: '#64748b' },
    pickerTextActive: { color: '#fbbf24' },
    saveBtn: {
        backgroundColor: '#4caf50',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30
    },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
