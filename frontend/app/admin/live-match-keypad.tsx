import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { getAuthToken } from '../../utils/storage';

export default function LiveMatchKeypadScreen() {
    const { matchId } = useLocalSearchParams();
    const router = useRouter();

    const [match, setMatch] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Initial setup state if innings not started
    const [setupMode, setSetupMode] = useState(false);
    const [selectedBattingTeam, setSelectedBattingTeam] = useState<string | null>(null);
    const [selectedStriker, setSelectedStriker] = useState<string | null>(null);
    const [selectedNonStriker, setSelectedNonStriker] = useState<string | null>(null);
    const [selectedBowler, setSelectedBowler] = useState<string | null>(null);

    // Modals state for mid-innings (Wicket or Over End)
    const [selectingNewBatter, setSelectingNewBatter] = useState<string | null>(null); // outPlayerId
    const [selectingNewBowler, setSelectingNewBowler] = useState(false);

    useEffect(() => {
        fetchMatchData();
    }, [matchId]);

    const fetchMatchData = async () => {
        try {
            const token = await getAuthToken();
            const res = await axios.get(`${API_URL}/matches/upcoming`);
            const allMatches = res.data.matches;
            const m = allMatches.find((m: any) => m.id === matchId);

            if (m) {
                setMatch(m);
                if (!m.liveSettings || !m.liveSettings.strikerId) {
                    setSetupMode(true);
                }
            }

            const playersRes = await axios.get(`${API_URL}/players/${matchId}`);
            setPlayers(playersRes.data.players || []);
        } catch (error) {
            console.error("Fetch data error:", error);
            Alert.alert("Error", "Could not fetch match data.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartInnings = async () => {
        if (!selectedBattingTeam || !selectedStriker || !selectedNonStriker || !selectedBowler) {
            Alert.alert("Incomplete", "Please select all opening players.");
            return;
        }

        const bowlingTeam = match.teams.find((t: string) => t !== selectedBattingTeam);

        try {
            setProcessing(true);
            const token = await getAuthToken();
            const res = await axios.post(`${API_URL}/admin/matches/${matchId}/start-innings`, {
                battingTeamId: selectedBattingTeam,
                bowlingTeamId: bowlingTeam,
                strikerId: selectedStriker,
                nonStrikerId: selectedNonStriker,
                bowlerId: selectedBowler
            }, { headers: { Authorization: `Bearer ${token}` } });

            setMatch(res.data.match);
            setSetupMode(false);
        } catch (error) {
            console.error("Start innings API err:", error);
            Alert.alert("Error", "Failed to start innings");
        } finally {
            setProcessing(false);
        }
    };

    const processBall = async (action: string, extraArgs: any = {}) => {
        try {
            setProcessing(true);
            const token = await getAuthToken();
            const payload = { action, ...extraArgs };

            const res = await axios.post(
                `${API_URL}/admin/matches/${matchId}/process-ball`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMatch(res.data.match);

            if (res.data.overCompleted) {
                setSelectingNewBowler(true);
            }
            if (selectingNewBatter) {
                setSelectingNewBatter(null);
            }

        } catch (error: any) {
            console.error("Process ball err:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to process ball");
        } finally {
            setProcessing(false);
        }
    };

    // --- RENDER HELPERS ---

    const getPlayerName = (id: string) => {
        const p = players.find(p => p.playerId === id || p.id === id);
        return p ? p.name : 'Unknown';
    };

    const getPlayerStat = (playerId: string) => {
        if (!match || !match.playerStats) return null;
        return match.playerStats.find((ps: any) => ps.playerId === playerId) || {
            runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
            overs: 0, bowledBalls: 0, runsConceded: 0, wickets: 0, maidens: 0
        };
    };

    // --- VIEWS ---

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#fbbf24" />
            </View>
        );
    }

    if (!match) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>Match not found.</Text>
            </View>
        );
    }

    // SETUP VIEW
    if (setupMode) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Stack.Screen options={{ title: 'Start Innings', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }} />

                <Text style={styles.sectionTitle}>Select Batting Team</Text>
                <View style={styles.row}>
                    {match.teams.map((t: string) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.chip, selectedBattingTeam === t && styles.chipActive]}
                            onPress={() => setSelectedBattingTeam(t)}
                        >
                            <Text style={[styles.chipText, selectedBattingTeam === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedBattingTeam && (
                    <>
                        <Text style={styles.sectionTitle}>Select Striker</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                            {players.filter(p => p.team === selectedBattingTeam).map(p => (
                                <TouchableOpacity
                                    key={p.playerId || p.id}
                                    style={[styles.playerChip, selectedStriker === (p.playerId || p.id) && styles.playerChipActive]}
                                    onPress={() => setSelectedStriker(p.playerId || p.id)}
                                >
                                    <Text style={[styles.playerChipText, selectedStriker === (p.playerId || p.id) && styles.playerChipTextActive]}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.sectionTitle}>Select Non-Striker</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                            {players.filter(p => p.team === selectedBattingTeam && (p.playerId || p.id) !== selectedStriker).map(p => (
                                <TouchableOpacity
                                    key={p.playerId || p.id}
                                    style={[styles.playerChip, selectedNonStriker === (p.playerId || p.id) && styles.playerChipActive]}
                                    onPress={() => setSelectedNonStriker(p.playerId || p.id)}
                                >
                                    <Text style={[styles.playerChipText, selectedNonStriker === (p.playerId || p.id) && styles.playerChipTextActive]}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.sectionTitle}>Select Opening Bowler</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                            {players.filter(p => p.team !== selectedBattingTeam).map(p => (
                                <TouchableOpacity
                                    key={p.playerId || p.id}
                                    style={[styles.playerChip, selectedBowler === (p.playerId || p.id) && styles.playerChipActive]}
                                    onPress={() => setSelectedBowler(p.playerId || p.id)}
                                >
                                    <Text style={[styles.playerChipText, selectedBowler === (p.playerId || p.id) && styles.playerChipTextActive]}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.primaryBtn, processing && styles.disabledBtn]}
                            onPress={handleStartInnings}
                            disabled={processing}
                        >
                            {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>START INNINGS</Text>}
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        );
    }

    const { liveScore, liveSettings } = match;
    const strikerStat = getPlayerStat(liveSettings.strikerId);
    const nonStrikerStat = getPlayerStat(liveSettings.nonStrikerId);
    const bowlerStat = getPlayerStat(liveSettings.bowlerId);

    // SELECTION VIEWS (WICKET / OVER END)
    if (selectingNewBatter) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Select Next Batter' }} />
                <Text style={styles.selectPrompt}>Who is the next batter in?</Text>
                <ScrollView>
                    {players.filter(p => p.team === liveSettings.battingTeamId && p.playerId !== liveSettings.strikerId && p.playerId !== liveSettings.nonStrikerId).map(p => (
                        <TouchableOpacity
                            key={p.playerId}
                            style={styles.listCard}
                            onPress={() => processBall('WICKET', { outPlayerId: selectingNewBatter, newBatterId: p.playerId })}
                        >
                            <Text style={styles.listCardName}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (selectingNewBowler) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Select Next Bowler' }} />
                <Text style={styles.selectPrompt}>Over completed. Who is bowling next?</Text>
                <ScrollView>
                    {players.filter(p => p.team === liveSettings.bowlingTeamId && p.playerId !== liveSettings.bowlerId).map(p => (
                        <TouchableOpacity
                            key={p.playerId}
                            style={styles.listCard}
                            onPress={() => {
                                // Since over is already processed, we just update the match setting locally and save
                                setProcessing(true);
                                getAuthToken().then(token => {
                                    axios.post(`${API_URL}/admin/matches/${matchId}/start-innings`, {
                                        battingTeamId: liveSettings.battingTeamId,
                                        bowlingTeamId: liveSettings.bowlingTeamId,
                                        strikerId: liveSettings.strikerId,
                                        nonStrikerId: liveSettings.nonStrikerId,
                                        bowlerId: p.playerId // set the new bowler
                                    }, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
                                        setMatch(res.data.match);
                                        setSelectingNewBowler(false);
                                        setProcessing(false);
                                    })
                                });
                            }}
                        >
                            <Text style={styles.listCardName}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    }

    // MAIN KEYPAD VIEW
    return (
        <View style={styles.keypadContainer}>
            <Stack.Screen options={{ title: 'Live Scoring', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fbbf24' }} />

            {/* Scoreboard Header */}
            <View style={styles.scoreboard}>
                <View style={styles.scoreRow}>
                    <Text style={styles.teamName}>{liveScore.battingTeam}</Text>
                    <Text style={styles.scoreText}>{liveScore.runs}/{liveScore.wickets}</Text>
                </View>
                <Text style={styles.oversText}>Overs: {liveScore.overs}.{liveScore.balls}</Text>
                {liveScore.target && <Text style={styles.targetText}>Target: {liveScore.target}</Text>}
            </View>

            {/* Batters */}
            <View style={styles.statsCard}>
                <View style={styles.statsHeaderRow}>
                    <Text style={[styles.statsHeaderCell, { flex: 2, textAlign: 'left' }]}>Batsman</Text>
                    <Text style={styles.statsHeaderCell}>R</Text>
                    <Text style={styles.statsHeaderCell}>B</Text>
                    <Text style={styles.statsHeaderCell}>4s</Text>
                    <Text style={styles.statsHeaderCell}>6s</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={[styles.statsCellName, { color: '#0284c7', fontWeight: '800' }]}>{getPlayerName(liveSettings.strikerId)} *</Text>
                    <Text style={[styles.statsCell, { fontWeight: '700' }]}>{strikerStat.runs}</Text>
                    <Text style={styles.statsCell}>{strikerStat.ballsFaced}</Text>
                    <Text style={styles.statsCell}>{strikerStat.fours}</Text>
                    <Text style={styles.statsCell}>{strikerStat.sixes}</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={styles.statsCellName}>{getPlayerName(liveSettings.nonStrikerId)}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.runs}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.ballsFaced}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.fours}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.sixes}</Text>
                </View>
            </View>

            {/* Bowler */}
            <View style={styles.statsCard}>
                <View style={styles.statsHeaderRow}>
                    <Text style={[styles.statsHeaderCell, { flex: 2, textAlign: 'left' }]}>Bowler</Text>
                    <Text style={styles.statsHeaderCell}>O</Text>
                    <Text style={styles.statsHeaderCell}>M</Text>
                    <Text style={styles.statsHeaderCell}>R</Text>
                    <Text style={styles.statsHeaderCell}>W</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={[styles.statsCellName, { color: '#e11d48', fontWeight: '800' }]}>{getPlayerName(liveSettings.bowlerId)} *</Text>
                    <Text style={styles.statsCell}>{bowlerStat.overs}.{bowlerStat.bowledBalls}</Text>
                    <Text style={styles.statsCell}>{bowlerStat.maidens}</Text>
                    <Text style={styles.statsCell}>{bowlerStat.runsConceded}</Text>
                    <Text style={[styles.statsCell, { fontWeight: '700' }]}>{bowlerStat.wickets}</Text>
                </View>
            </View>

            {/* Current Over Timeline */}
            <View style={styles.overTimelineInfo}>
                <Text style={styles.overTimelineLabel}>This Over:</Text>
                <View style={styles.ballsRow}>
                    {liveSettings.currentOverBalls.length === 0 ? <Text style={styles.emptyOverText}>0 balls bowled.</Text> : null}
                    {liveSettings.currentOverBalls.map((b: string, i: number) => (
                        <View key={i} style={[styles.ballBubble, b === 'W' && styles.ballBubbleW, b === '6' && styles.ballBubble6, b === '4' && styles.ballBubble4]}>
                            <Text style={[styles.ballBubbleText, (b === 'W' || b === '6' || b === '4') && styles.ballBubbleTextWhite]}>{b}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Keypad */}
            {processing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#0284c7" />
                </View>
            )}

            <View style={styles.keypadArea}>
                {/* Runs Row */}
                <View style={styles.keypadRow}>
                    {['0', '1', '2', '3', '4', '6'].map((r) => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.keyRun, r === '4' && styles.key4, r === '6' && styles.key6]}
                            onPress={() => processBall('RUN', { runs: r })}
                            disabled={processing}
                        >
                            <Text style={[styles.keyRunText, (r === '4' || r === '6') && styles.keyRunTextWhite]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Extras Row */}
                <View style={styles.keypadRow}>
                    <TouchableOpacity style={styles.keyExtra} onPress={() => processBall('EXTRAS', { extraType: 'WD', runs: 0 })} disabled={processing}>
                        <Text style={styles.keyExtraText}>WD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.keyExtra} onPress={() => processBall('EXTRAS', { extraType: 'NB', runs: 0 })} disabled={processing}>
                        <Text style={styles.keyExtraText}>NB</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.keyExtra} onPress={() => processBall('EXTRAS', { extraType: 'LB', runs: 1 })} disabled={processing}>
                        <Text style={styles.keyExtraText}>1LB</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.keyExtra} onPress={() => processBall('EXTRAS', { extraType: 'B', runs: 1 })} disabled={processing}>
                        <Text style={styles.keyExtraText}>1B</Text>
                    </TouchableOpacity>
                </View>

                {/* Big Actions */}
                <View style={[styles.keypadRow, { marginTop: 15 }]}>
                    <TouchableOpacity style={styles.keyWicket} onPress={() => setSelectingNewBatter(liveSettings.strikerId)} disabled={processing}>
                        <Text style={styles.keyWicketText}>OUT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
    scrollContent: { padding: 20, paddingBottom: 60 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    hScroll: { paddingVertical: 5 },

    chip: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
    chipActive: { backgroundColor: '#0284c7' },
    chipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
    chipTextActive: { color: '#fff' },

    playerChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
    playerChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    playerChipText: { fontSize: 13, fontWeight: '600', color: '#334155' },
    playerChipTextActive: { color: '#fbbf24' },

    primaryBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 40 },
    disabledBtn: { opacity: 0.7 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    // Keypad UI Styles
    keypadContainer: { flex: 1, backgroundColor: '#f8fafc' },
    scoreboard: { backgroundColor: '#1e293b', padding: 20, alignItems: 'center' },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
    teamName: { color: '#94a3b8', fontSize: 24, fontWeight: '800', marginRight: 15 },
    scoreText: { color: '#fbbf24', fontSize: 48, fontWeight: '900' },
    oversText: { color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginTop: 5 },
    targetText: { color: '#38bdf8', fontSize: 14, fontWeight: '700', marginTop: 2 },

    statsCard: { backgroundColor: '#fff', marginHorizontal: 10, marginTop: 10, borderRadius: 10, padding: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    statsHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 5, marginBottom: 5 },
    statsHeaderCell: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#94a3b8' },
    statsRow: { flexDirection: 'row', paddingVertical: 4, alignItems: 'center' },
    statsCellName: { flex: 2, fontSize: 14, color: '#334155', fontWeight: '600' },
    statsCell: { flex: 1, textAlign: 'center', fontSize: 14, color: '#475569' },

    overTimelineInfo: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginTop: 10 },
    overTimelineLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8 },
    ballsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    ballBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
    ballBubbleW: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    ballBubble4: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
    ballBubble6: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
    ballBubbleText: { fontSize: 12, fontWeight: '800', color: '#475569' },
    ballBubbleTextWhite: { color: '#fff' },
    emptyOverText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic' },

    keypadArea: { flex: 1, padding: 15, justifyContent: 'flex-end', paddingBottom: 30 },
    keypadRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
    keyRun: { flex: 1, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
    key4: { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
    key6: { backgroundColor: '#ede9fe', borderColor: '#ddd6fe' },
    keyRunText: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
    keyRunTextWhite: { color: '#0369a1' },

    keyExtra: { flex: 1, height: 60, backgroundColor: '#f8fafc', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
    keyExtraText: { fontSize: 16, fontWeight: '700', color: '#475569' },

    keyWicket: { flex: 1, height: 75, backgroundColor: '#ef4444', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    keyWicketText: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 2 },

    processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' },

    selectPrompt: { fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginVertical: 20 },
    listCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    listCardName: { fontSize: 16, fontWeight: '700', color: '#0f172a' }
});
