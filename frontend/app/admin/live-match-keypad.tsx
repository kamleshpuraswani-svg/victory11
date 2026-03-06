import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
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
    const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1); // 1=Config, 2=Toss, 3=Players

    // Step 1 - Match Config
    const [matchType, setMatchType] = useState<'LIMITED_OVERS' | 'BOX_TURF' | 'PAIR' | 'TEST' | 'HUNDRED'>('LIMITED_OVERS');
    const [totalOvers, setTotalOvers] = useState('20');
    const [oversPerBowler, setOversPerBowler] = useState('4');
    const [city, setCity] = useState('');
    const [ground, setGround] = useState('');
    const [ballType, setBallType] = useState<'TENNIS' | 'LEATHER' | 'OTHER'>('LEATHER');
    const [pitchType, setPitchType] = useState<'ROUGH' | 'CEMENT' | 'TURF' | 'ASTROTURF' | 'MATTING'>('TURF');
    const [wagonWheel, setWagonWheel] = useState(true);
    const [wideRuns, setWideRuns] = useState(1);
    const [noBallRuns, setNoBallRuns] = useState(1);
    const [wideAsLegal, setWideAsLegal] = useState(false);
    const [noBallAsLegal, setNoBallAsLegal] = useState(false);
    const [powerPlay1End, setPowerPlay1End] = useState(6);
    const [powerPlay2Start, setPowerPlay2Start] = useState<number | null>(null);
    const [powerPlay2End, setPowerPlay2End] = useState<number | null>(null);
    const [powerPlay3Start, setPowerPlay3Start] = useState<number | null>(null);
    const [powerPlay3End, setPowerPlay3End] = useState<number | null>(null);
    const [showPowerPlaySelection, setShowPowerPlaySelection] = useState(false);
    const [showMatchRules, setShowMatchRules] = useState(false);

    // Step 2 - Toss
    const [tossWinner, setTossWinner] = useState<string | null>(null);
    const [tossChoice, setTossChoice] = useState<'BAT' | 'BOWL'>('BAT');

    // Step 3 - Players
    const [selectedBattingTeam, setSelectedBattingTeam] = useState<string | null>(null);
    const [selectedStriker, setSelectedStriker] = useState<string | null>(null);
    const [selectedNonStriker, setSelectedNonStriker] = useState<string | null>(null);
    const [selectedBowler, setSelectedBowler] = useState<string | null>(null);


    // Modals state for mid-innings (Wicket or Over End)
    const [wicketSequence, setWicketSequence] = useState<{
        active: boolean;
        step: 'DELIVERY_TYPE' | 'TYPE' | 'OUT_PLAYER' | 'FIELDER' | 'RUNS_COMPLETED' | 'BATTER';
        type?: string;
        deliveryType?: string; // 'LEGAL', 'WD', 'NB'
        fielderId?: string;
        outPlayerId?: string;
        runsCompleted?: number;
    } | null>(null);
    // NO local selectingNewBowler state! It is derived from match.liveSettings.awaitingNewBowler
    // so it survives navigation and page refreshes.
    const [selectingExtra, setSelectingExtra] = useState<string | null>(null); // 'WD', 'NB', 'LB', 'B'

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
            Alert.alert('Incomplete', 'Please select batting team, striker, non-striker, and opening bowler.');
            return;
        }
        const bowlingTeam = match.teams.find((t: string) => t !== selectedBattingTeam);
        try {
            setProcessing(true);
            const token = await getAuthToken();
            const res = await axios.post(
                `${API_URL}/admin/matches/${matchId}/start-innings`,
                {
                    battingTeamId: selectedBattingTeam,
                    bowlingTeamId: bowlingTeam,
                    strikerId: selectedStriker,
                    nonStrikerId: selectedNonStriker,
                    bowlerId: selectedBowler,
                    // Full match config
                    matchType,
                    totalOvers: Number(totalOvers) || 20,
                    oversPerBowler: Number(oversPerBowler) || 4,
                    city, ground,
                    ballType, pitchType,
                    wagonWheel, wideRuns, noBallRuns, wideAsLegal, noBallAsLegal,
                    powerPlay1End,
                    powerPlay2Start: powerPlay2Start || undefined,
                    powerPlay2End: powerPlay2End || undefined,
                    powerPlay3Start: powerPlay3Start || undefined,
                    powerPlay3End: powerPlay3End || undefined,
                    tossWinner: tossWinner || '',
                    tossChoice
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMatch(res.data.match);
            setSetupMode(false);
        } catch (error) {
            console.error('Start innings API err:', error);
            Alert.alert('Error', 'Failed to start innings');
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

            if (wicketSequence) {
                setWicketSequence(null);
            }
            // awaitingNewBowler is derived from match.liveSettings.awaitingNewBowler
            // so no local state to set here

        } catch (error: any) {
            console.error("Process ball err:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to process ball");
        } finally {
            setProcessing(false);
        }
    };

    const handleExtraPress = (type: string) => {
        setSelectingExtra(type);
    };

    const submitExtra = (runs: number) => {
        if (!selectingExtra) return;
        processBall('EXTRAS', { extraType: selectingExtra, runs });
        setSelectingExtra(null);
    };

    const handleUndo = () => {
        Alert.alert("Undo Last Ball", "Are you sure you want to revert the last delivery?", [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Undo', style: 'destructive', onPress: async () => {
                    try {
                        setProcessing(true);
                        const token = await getAuthToken();
                        const res = await axios.post(`${API_URL}/admin/matches/${matchId}/undo-ball`, {}, { headers: { Authorization: `Bearer ${token}` } });
                        setMatch(res.data.match);
                        setWicketSequence(null);
                    } catch (err: any) {
                        Alert.alert("Error", err.response?.data?.message || "Could not undo ball");
                    } finally {
                        setProcessing(false);
                    }
                }
            }
        ]);
    };

    const handleSwapStrike = async () => {
        try {
            setProcessing(true);
            const token = await getAuthToken();
            const res = await axios.post(`${API_URL}/admin/matches/${matchId}/swap-strike`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setMatch(res.data.match);
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Could not swap strike");
        } finally {
            setProcessing(false);
        }
    };

    const startWicketSequence = () => {
        // In CricHeroes, first ask the delivery type (Legal, Wide, NB)
        setWicketSequence({ active: true, step: 'DELIVERY_TYPE' });
    };

    const handleDeliveryTypeSelect = (deliveryType: string) => {
        setWicketSequence(prev => ({ ...prev!, step: 'TYPE', deliveryType }));
    };

    const handleWicketTypeSelect = (type: string) => {
        const current = wicketSequence!;
        if (type === 'RUN_OUT') {
            // Run out: need to select which batsman, then fielder, then runs, then new batter
            setWicketSequence({ ...current, step: 'OUT_PLAYER', type });
        } else if (type === 'BOWLED' || type === 'LBW' || type === 'HIT_WICKET') {
            setWicketSequence({ ...current, step: 'BATTER', type, outPlayerId: match.liveSettings.strikerId });
        } else {
            // CAUGHT, STUMPED — need fielder selection
            setWicketSequence({ ...current, step: 'FIELDER', type, outPlayerId: match.liveSettings.strikerId });
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

    // SETUP VIEW - 3 Step CricHeroes-style
    if (setupMode) {

        // --- MATCH RULES MODAL ---
        if (showMatchRules) {
            return (
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                    <Stack.Screen options={{
                        title: 'Match Rules (wd, nb)', headerStyle: { backgroundColor: '#00897b' }, headerTintColor: '#fff',
                        headerLeft: () => <TouchableOpacity onPress={() => setShowMatchRules(false)} style={{ paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontSize: 16 }}>← Back</Text></TouchableOpacity>
                    }} />

                    <Text style={[styles.sectionTitle, { color: '#fbbf24' }]}>Wagon wheel</Text>
                    <View style={setupStyles.ruleRow}>
                        <Text style={setupStyles.ruleLabel}>Show wagon wheel for 1s, 2s, &amp; 3s</Text>
                        <TouchableOpacity onPress={() => setWagonWheel(v => !v)} style={[setupStyles.toggle, wagonWheel && setupStyles.toggleOn]}>
                            <View style={[setupStyles.toggleThumb, wagonWheel && setupStyles.toggleThumbOn]} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.sectionTitle, { color: '#fbbf24', marginTop: 20 }]}>Wide / No Ball Rules</Text>

                    <View style={setupStyles.ruleCard}>
                        <View style={setupStyles.ruleRow}>
                            <View style={setupStyles.ruleCircle}><Text style={setupStyles.ruleCircleText}>A</Text></View>
                            <Text style={[setupStyles.ruleLabel, { flex: 1 }]}>Count wide as a legal delivery</Text>
                            <TouchableOpacity onPress={() => setWideAsLegal(v => !v)} style={[setupStyles.toggle, wideAsLegal && setupStyles.toggleOn]}>
                                <View style={[setupStyles.toggleThumb, wideAsLegal && setupStyles.toggleThumbOn]} />
                            </TouchableOpacity>
                        </View>

                        <View style={setupStyles.ruleRow}>
                            <View style={setupStyles.ruleCircle}><Text style={setupStyles.ruleCircleText}>B</Text></View>
                            <Text style={[setupStyles.ruleLabel, { flex: 1 }]}>Wide runs</Text>
                            <View style={setupStyles.counter}>
                                <TouchableOpacity onPress={() => setWideRuns(v => Math.max(1, v - 1))} style={setupStyles.counterBtn}><Text style={setupStyles.counterBtnText}>−</Text></TouchableOpacity>
                                <Text style={setupStyles.counterValue}>{wideRuns}</Text>
                                <TouchableOpacity onPress={() => setWideRuns(v => v + 1)} style={setupStyles.counterBtn}><Text style={setupStyles.counterBtnText}>+</Text></TouchableOpacity>
                            </View>
                        </View>

                        <View style={setupStyles.ruleRow}>
                            <View style={setupStyles.ruleCircle}><Text style={setupStyles.ruleCircleText}>C</Text></View>
                            <Text style={[setupStyles.ruleLabel, { flex: 1 }]}>Count no ball as a legal delivery</Text>
                            <TouchableOpacity onPress={() => setNoBallAsLegal(v => !v)} style={[setupStyles.toggle, noBallAsLegal && setupStyles.toggleOn]}>
                                <View style={[setupStyles.toggleThumb, noBallAsLegal && setupStyles.toggleThumbOn]} />
                            </TouchableOpacity>
                        </View>

                        <View style={setupStyles.ruleRow}>
                            <View style={setupStyles.ruleCircle}><Text style={setupStyles.ruleCircleText}>D</Text></View>
                            <Text style={[setupStyles.ruleLabel, { flex: 1 }]}>No ball runs</Text>
                            <View style={setupStyles.counter}>
                                <TouchableOpacity onPress={() => setNoBallRuns(v => Math.max(1, v - 1))} style={setupStyles.counterBtn}><Text style={setupStyles.counterBtnText}>−</Text></TouchableOpacity>
                                <Text style={setupStyles.counterValue}>{noBallRuns}</Text>
                                <TouchableOpacity onPress={() => setNoBallRuns(v => v + 1)} style={setupStyles.counterBtn}><Text style={setupStyles.counterBtnText}>+</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#00897b', marginTop: 24 }]} onPress={() => setShowMatchRules(false)}>
                        <Text style={styles.primaryBtnText}>Done</Text>
                    </TouchableOpacity>
                </ScrollView>
            );
        }

        // --- POWER PLAY SELECTION MODAL ---
        if (showPowerPlaySelection) {
            const oversArr = Array.from({ length: Number(totalOvers) || 20 }, (_, i) => i + 1);

            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Stack.Screen options={{
                            title: 'Select power play overs', headerStyle: { backgroundColor: '#dc2626' }, headerTintColor: '#fff',
                            headerLeft: () => <TouchableOpacity onPress={() => setShowPowerPlaySelection(false)} style={{ paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontSize: 16 }}>← Back</Text></TouchableOpacity>
                        }} />

                        {/* Power play 1 */}
                        <Text style={setupStyles.sectionHead}>Power play 1</Text>
                        <View style={[styles.row, { flexWrap: 'wrap', gap: 8, marginBottom: 20 }]}>
                            {oversArr.map(num => (
                                <TouchableOpacity
                                    key={`pp1-${num}`}
                                    style={[setupStyles.pitchChip, powerPlay1End === num && setupStyles.pitchChipActive]}
                                    onPress={() => {
                                        setPowerPlay1End(num);
                                        // Reset others if তারা PP1 এর আগে
                                        if (powerPlay2End && powerPlay2End <= num) setPowerPlay2End(null);
                                        if (powerPlay3End && powerPlay3End <= (powerPlay2End || num)) setPowerPlay3End(null);
                                    }}
                                >
                                    <Text style={[setupStyles.pitchChipText, powerPlay1End === num && { color: '#00897b', fontWeight: '700' }]}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Power play 2 */}
                        <Text style={setupStyles.sectionHead}>Power play 2</Text>
                        <View style={[styles.row, { flexWrap: 'wrap', gap: 8, marginBottom: 20 }]}>
                            {oversArr.map(num => (
                                <TouchableOpacity
                                    key={`pp2-${num}`}
                                    style={[
                                        setupStyles.pitchChip,
                                        powerPlay2End === num && setupStyles.pitchChipActive,
                                        num <= powerPlay1End && { opacity: 0.3 }
                                    ]}
                                    disabled={num <= powerPlay1End}
                                    onPress={() => {
                                        setPowerPlay2End(num);
                                        setPowerPlay2Start(powerPlay1End);
                                        if (powerPlay3End && powerPlay3End <= num) setPowerPlay3End(null);
                                    }}
                                >
                                    <Text style={[setupStyles.pitchChipText, powerPlay2End === num && { color: '#00897b', fontWeight: '700' }]}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Power play 3 */}
                        <Text style={setupStyles.sectionHead}>Power play 3</Text>
                        <View style={[styles.row, { flexWrap: 'wrap', gap: 8, marginBottom: 20 }]}>
                            {oversArr.map(num => (
                                <TouchableOpacity
                                    key={`pp3-${num}`}
                                    style={[
                                        setupStyles.pitchChip,
                                        powerPlay3End === num && setupStyles.pitchChipActive,
                                        num <= (powerPlay2End || powerPlay1End) && { opacity: 0.3 }
                                    ]}
                                    disabled={num <= (powerPlay2End || powerPlay1End)}
                                    onPress={() => {
                                        setPowerPlay3End(num);
                                        setPowerPlay3Start(powerPlay2End || powerPlay1End);
                                    }}
                                >
                                    <Text style={[setupStyles.pitchChipText, powerPlay3End === num && { color: '#00897b', fontWeight: '700' }]}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 10 }}>
                            *batting power play overs can be selected later during scoring from the settings.
                        </Text>
                    </ScrollView>
                    <View style={{ padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' }}>
                        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#00897b' }]} onPress={() => setShowPowerPlaySelection(false)}>
                            <Text style={styles.primaryBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // --- STEP 1 : MATCH CONFIGURATION ---
        if (setupStep === 1) {
            return (
                <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
                    <Stack.Screen options={{ title: 'Start a Match', headerStyle: { backgroundColor: '#00897b' }, headerTintColor: '#fff' }} />

                    {/* Teams header */}
                    <View style={setupStyles.teamsHeader}>
                        <View style={setupStyles.teamBlock}>
                            <View style={setupStyles.teamAvatar}><Text style={setupStyles.teamAvatarText}>{match.teams[0]?.charAt(0)}</Text></View>
                            <Text style={setupStyles.teamHeaderName} numberOfLines={1}>{match.teams[0]}</Text>
                        </View>
                        <Text style={setupStyles.vsText}>vs</Text>
                        <View style={setupStyles.teamBlock}>
                            <View style={setupStyles.teamAvatar}><Text style={setupStyles.teamAvatarText}>{match.teams[1]?.charAt(0)}</Text></View>
                            <Text style={setupStyles.teamHeaderName} numberOfLines={1}>{match.teams[1]}</Text>
                        </View>
                    </View>

                    {/* Match type */}
                    <Text style={setupStyles.label}>Match type <Text style={{ color: '#ef4444' }}>*</Text></Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {[
                            { key: 'LIMITED_OVERS', label: 'Limited Overs' },
                            { key: 'BOX_TURF', label: 'Box/Turf Cricket' },
                            { key: 'PAIR', label: 'Pair Cricket' },
                            { key: 'TEST', label: 'Test Match' },
                            { key: 'HUNDRED', label: 'The Hundred' }
                        ].map(t => (
                            <TouchableOpacity key={t.key} style={[setupStyles.typeChip, matchType === t.key && setupStyles.typeChipActive]}
                                onPress={() => setMatchType(t.key as any)}>
                                <Text style={[setupStyles.typeChipText, matchType === t.key && setupStyles.typeChipTextActive]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Overs row */}
                    <View style={setupStyles.inputRow}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={setupStyles.label}>No. of overs <Text style={{ color: '#ef4444' }}>*</Text></Text>
                            <TextInput
                                style={setupStyles.input}
                                value={totalOvers}
                                onChangeText={setTotalOvers}
                                keyboardType="number-pad"
                                placeholder="e.g. 20"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={setupStyles.label}>Overs per bowler</Text>
                            <TextInput
                                style={setupStyles.input}
                                value={oversPerBowler}
                                onChangeText={setOversPerBowler}
                                keyboardType="number-pad"
                                placeholder="e.g. 4"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>

                    {/* Power Play */}
                    <TouchableOpacity style={setupStyles.ppRow} onPress={() => setShowPowerPlaySelection(true)}>
                        <Text style={[setupStyles.label, { color: '#00897b', fontWeight: '700' }]}>Power play  {'>'}</Text>
                        <Text style={setupStyles.ppSub}>
                            {powerPlay3End ? `PP1: 1-${powerPlay1End}, PP2: ${powerPlay1End + 1}-${powerPlay2End}, PP3: ${powerPlay2End! + 1}-${powerPlay3End}` :
                                powerPlay2End ? `PP1: 1-${powerPlay1End}, PP2: ${powerPlay1End + 1}-${powerPlay2End}` :
                                    `First ${powerPlay1End} overs`}
                        </Text>
                    </TouchableOpacity>

                    {/* City */}
                    <Text style={setupStyles.label}>City / town <Text style={{ color: '#ef4444' }}>*</Text></Text>
                    <TextInput style={setupStyles.input} value={city} onChangeText={setCity} placeholder="e.g. Mumbai" placeholderTextColor="#9ca3af" />

                    {/* Ground */}
                    <Text style={setupStyles.label}>Ground <Text style={{ color: '#ef4444' }}>*</Text></Text>
                    <TextInput style={setupStyles.input} value={ground} onChangeText={setGround} placeholder="e.g. Wankhede Stadium" placeholderTextColor="#9ca3af" />

                    {/* Ball type */}
                    <Text style={setupStyles.label}>Ball type <Text style={{ color: '#ef4444' }}>*</Text></Text>
                    <View style={setupStyles.ballRow}>
                        {[
                            { key: 'TENNIS', label: 'Tennis', color: '#84cc16', emoji: '🎾' },
                            { key: 'LEATHER', label: 'Leather', color: '#dc2626', emoji: '🏏' },
                            { key: 'OTHER', label: 'Other', color: '#f59e0b', emoji: '🔵' }
                        ].map(b => (
                            <TouchableOpacity key={b.key} style={[setupStyles.ballBtn, ballType === b.key && { borderColor: '#00897b', borderWidth: 2 }]}
                                onPress={() => setBallType(b.key as any)}>
                                <Text style={{ fontSize: 36 }}>{b.emoji}</Text>
                                <Text style={[setupStyles.ballLabel, ballType === b.key && { color: '#00897b', fontWeight: '700' }]}>{b.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Wagon wheel toggle */}
                    <View style={[setupStyles.ruleRow, { marginVertical: 8 }]}>
                        <View>
                            <Text style={setupStyles.sectionHead}>Wagon wheel</Text>
                            <Text style={setupStyles.ruleLabel}>Show wagon wheel for 1s, 2s, &amp; 3s</Text>
                        </View>
                        <TouchableOpacity onPress={() => setWagonWheel(v => !v)} style={[setupStyles.toggle, wagonWheel && setupStyles.toggleOn]}>
                            <View style={[setupStyles.toggleThumb, wagonWheel && setupStyles.toggleThumbOn]} />
                        </TouchableOpacity>
                    </View>

                    {/* Pitch type */}
                    <Text style={setupStyles.sectionHead}>Pitch type</Text>
                    <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
                        {(['ROUGH', 'CEMENT', 'TURF', 'ASTROTURF', 'MATTING'] as const).map(p => (
                            <TouchableOpacity key={p} style={[setupStyles.pitchChip, pitchType === p && setupStyles.pitchChipActive]}
                                onPress={() => setPitchType(p)}>
                                <Text style={[setupStyles.pitchChipText, pitchType === p && { color: '#1e293b', fontWeight: '700' }]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Match officials */}
                    <Text style={[setupStyles.sectionHead, { marginTop: 20 }]}>Match officials</Text>
                    <View style={setupStyles.ballRow}>
                        {[
                            { label: 'Umpires', emoji: '🎩' },
                            { label: 'Scorers', emoji: '📋' },
                            { label: 'Live streamer', emoji: '📷' },
                            { label: 'Others', emoji: '👤' }
                        ].map(o => (
                            <View key={o.label} style={setupStyles.officialBtn}>
                                <View style={setupStyles.officialCircle}><Text style={{ fontSize: 22 }}>{o.emoji}</Text></View>
                                <Text style={setupStyles.ballLabel}>{o.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Match rules link */}
                    <TouchableOpacity style={setupStyles.rulesLink} onPress={() => setShowMatchRules(true)}>
                        <Text style={{ fontSize: 18 }}>⚙️</Text>
                        <Text style={[setupStyles.ruleLabel, { color: '#00897b', fontWeight: '700', marginLeft: 8 }]}>Match rules</Text>
                        <Text style={{ color: '#9ca3af', marginLeft: 'auto' }}>{'>'}</Text>
                    </TouchableOpacity>

                    {/* Bottom buttons */}
                    <View style={setupStyles.bottomBtns}>
                        <TouchableOpacity style={setupStyles.scheduleBtnGrey}>
                            <Text style={setupStyles.scheduleBtnText}>Schedule match</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={setupStyles.nextBtn} onPress={() => setSetupStep(2)}>
                            <Text style={setupStyles.nextBtnText}>Next (toss)</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            );
        }

        // --- STEP 2 : TOSS ---
        if (setupStep === 2) {
            return (
                <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
                    <Stack.Screen options={{
                        title: 'Toss', headerStyle: { backgroundColor: '#00897b' }, headerTintColor: '#fff',
                        headerLeft: () => <TouchableOpacity onPress={() => setSetupStep(1)} style={{ paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontSize: 16 }}>← Back</Text></TouchableOpacity>
                    }} />

                    <Text style={[setupStyles.sectionHead, { marginTop: 24, fontSize: 20, textAlign: 'center', color: '#fbbf24' }]}>🪙 Toss</Text>

                    <Text style={setupStyles.label}>Who won the toss?</Text>
                    <View style={[styles.row, { marginBottom: 16 }]}>
                        {match.teams.map((t: string) => (
                            <TouchableOpacity key={t} style={[setupStyles.typeChip, tossWinner === t && setupStyles.typeChipActive]}
                                onPress={() => { setTossWinner(t); setSelectedBattingTeam(null); }}>
                                <Text style={[setupStyles.typeChipText, tossWinner === t && setupStyles.typeChipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {tossWinner && (
                        <>
                            <Text style={setupStyles.label}>{tossWinner} elected to</Text>
                            <View style={styles.row}>
                                {[{ label: '🏏 Bat first', value: 'BAT' }, { label: '🎳 Bowl first', value: 'BOWL' }].map(c => (
                                    <TouchableOpacity key={c.value} style={[setupStyles.typeChip, tossChoice === c.value && setupStyles.typeChipActive]}
                                        onPress={() => { setTossChoice(c.value as 'BAT' | 'BOWL'); setSelectedBattingTeam(tossChoice === 'BAT' ? tossWinner : match.teams.find((t: string) => t !== tossWinner)); }}>
                                        <Text style={[setupStyles.typeChipText, tossChoice === c.value && setupStyles.typeChipTextActive]}>{c.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    <View style={setupStyles.bottomBtns}>
                        <TouchableOpacity style={setupStyles.scheduleBtnGrey} onPress={() => setSetupStep(1)}>
                            <Text style={setupStyles.scheduleBtnText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[setupStyles.nextBtn, !tossWinner && { opacity: 0.4 }]}
                            onPress={() => { if (tossWinner) setSetupStep(3); }}>
                            <Text style={setupStyles.nextBtnText}>Next (players)</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            );
        }

        // --- STEP 3 : OPENING PLAYERS ---
        return (
            <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
                <Stack.Screen options={{
                    title: 'Opening Players', headerStyle: { backgroundColor: '#00897b' }, headerTintColor: '#fff',
                    headerLeft: () => <TouchableOpacity onPress={() => setSetupStep(2)} style={{ paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontSize: 16 }}>← Back</Text></TouchableOpacity>
                }} />

                <Text style={[setupStyles.sectionHead, { marginTop: 16, color: '#fbbf24' }]}>🏏 Select Batting Team</Text>
                <View style={styles.row}>
                    {match.teams.map((t: string) => (
                        <TouchableOpacity key={t} style={[setupStyles.typeChip, selectedBattingTeam === t && setupStyles.typeChipActive]}
                            onPress={() => setSelectedBattingTeam(t)}>
                            <Text style={[setupStyles.typeChipText, selectedBattingTeam === t && setupStyles.typeChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedBattingTeam && (
                    <>
                        <Text style={setupStyles.label}>Striker (on strike)</Text>
                        {players.filter(p => p.team === selectedBattingTeam).map(p => (
                            <TouchableOpacity key={p.playerId} style={[styles.listCard, selectedStriker === p.playerId && { borderColor: '#00897b', borderWidth: 2 }]}
                                onPress={() => setSelectedStriker(p.playerId)}>
                                <Text style={[styles.listCardName, selectedStriker === p.playerId && { color: '#00897b' }]}>{p.name}</Text>
                                {selectedStriker === p.playerId && <Text style={{ color: '#00897b', fontWeight: '700' }}>✓ ON STRIKE</Text>}
                            </TouchableOpacity>
                        ))}

                        <Text style={[setupStyles.label, { marginTop: 12 }]}>Non-Striker</Text>
                        {players.filter(p => p.team === selectedBattingTeam && p.playerId !== selectedStriker).map(p => (
                            <TouchableOpacity key={p.playerId} style={[styles.listCard, selectedNonStriker === p.playerId && { borderColor: '#0284c7', borderWidth: 2 }]}
                                onPress={() => setSelectedNonStriker(p.playerId)}>
                                <Text style={[styles.listCardName, selectedNonStriker === p.playerId && { color: '#0284c7' }]}>{p.name}</Text>
                                {selectedNonStriker === p.playerId && <Text style={{ color: '#0284c7', fontWeight: '700' }}>✓ NON-STRIKER</Text>}
                            </TouchableOpacity>
                        ))}

                        <Text style={[setupStyles.label, { marginTop: 12 }]}>Opening Bowler</Text>
                        {players.filter(p => p.team !== selectedBattingTeam).map(p => (
                            <TouchableOpacity key={p.playerId} style={[styles.listCard, selectedBowler === p.playerId && { borderColor: '#dc2626', borderWidth: 2 }]}
                                onPress={() => setSelectedBowler(p.playerId)}>
                                <Text style={[styles.listCardName, selectedBowler === p.playerId && { color: '#dc2626' }]}>{p.name}</Text>
                                {selectedBowler === p.playerId && <Text style={{ color: '#dc2626', fontWeight: '700' }}>✓ OPENING BOWLER</Text>}
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                <View style={setupStyles.bottomBtns}>
                    <TouchableOpacity style={setupStyles.scheduleBtnGrey} onPress={() => setSetupStep(2)}>
                        <Text style={setupStyles.scheduleBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[setupStyles.nextBtn, processing && { opacity: 0.5 }]}
                        onPress={handleStartInnings}
                        disabled={processing}
                    >
                        {processing ? <ActivityIndicator color="#fff" /> : <Text style={setupStyles.nextBtnText}>Start Innings</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }


    const { liveScore, liveSettings } = match;
    const strikerStat = getPlayerStat(liveSettings.strikerId);
    const nonStrikerStat = getPlayerStat(liveSettings.nonStrikerId);
    const bowlerStat = getPlayerStat(liveSettings.bowlerId);

    // SELECTION VIEWS (WICKET / OVER END)
    if (wicketSequence?.active) {
        if (wicketSequence.step === 'DELIVERY_TYPE') {
            return (
                <View style={styles.container}>
                    <Stack.Screen options={{ title: 'Wicket: Delivery Type' }} />
                    <Text style={styles.selectPrompt}>Was the delivery a...</Text>
                    {[
                        { label: '⚡ Legal Delivery', value: 'LEGAL' },
                        { label: '🔇 Wide', value: 'WD' },
                        { label: '🔂 No Ball', value: 'NB' },
                    ].map(d => (
                        <TouchableOpacity key={d.value} style={styles.listCard} onPress={() => handleDeliveryTypeSelect(d.value)}>
                            <Text style={styles.listCardName}>{d.label}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setWicketSequence(null)}>
                        <Text style={styles.cancelModalBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (wicketSequence.step === 'TYPE') {
            const delivStr = wicketSequence.deliveryType === 'WD' ? ' (Wide)' : wicketSequence.deliveryType === 'NB' ? ' (No Ball)' : '';
            // Filter wicket types based on delivery type  
            // Off Wide: only Stumped, Run Out, Hit Wicket
            // Off NB: only Run Out
            // Legal: all types
            let wicketTypes = ['BOWLED', 'CAUGHT', 'RUN_OUT', 'STUMPED', 'LBW', 'HIT_WICKET'];
            if (wicketSequence.deliveryType === 'WD') wicketTypes = ['STUMPED', 'RUN_OUT', 'HIT_WICKET'];
            if (wicketSequence.deliveryType === 'NB') wicketTypes = ['RUN_OUT'];
            return (
                <View style={styles.container}>
                    <Stack.Screen options={{ title: `How Out${delivStr}?` }} />
                    <Text style={styles.selectPrompt}>How was the batsman out{delivStr}?</Text>
                    <ScrollView>
                        {wicketTypes.map(type => (
                            <TouchableOpacity key={type} style={styles.listCard} onPress={() => handleWicketTypeSelect(type)}>
                                <Text style={styles.listCardName}>{type.replace('_', ' ')}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setWicketSequence(null)}>
                        <Text style={styles.cancelModalBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (wicketSequence.step === 'OUT_PLAYER') {
            return (
                <View style={styles.container}>
                    <Stack.Screen options={{ title: 'Who got out?' }} />
                    <Text style={styles.selectPrompt}>Which batsman is run out?</Text>
                    <ScrollView>
                        {[liveSettings.strikerId, liveSettings.nonStrikerId].map(id => (
                            <TouchableOpacity key={id} style={styles.listCard} onPress={() => setWicketSequence({ ...wicketSequence, step: 'FIELDER', outPlayerId: id })}>
                                <Text style={styles.listCardName}>{getPlayerName(id)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setWicketSequence(null)}>
                        <Text style={styles.cancelModalBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (wicketSequence.step === 'FIELDER') {
            return (
                <View style={styles.container}>
                    <Stack.Screen options={{ title: 'Select Fielder' }} />
                    <Text style={styles.selectPrompt}>Who took the {wicketSequence.type === 'STUMPED' ? 'stumping' : 'catch'}?</Text>
                    <ScrollView>
                        {players.filter(p => p.team === liveSettings.bowlingTeamId).map(p => (
                            <TouchableOpacity key={p.playerId} style={styles.listCard}
                                onPress={() => setWicketSequence({
                                    ...wicketSequence,
                                    step: wicketSequence.type === 'RUN_OUT' ? 'RUNS_COMPLETED' : 'BATTER',
                                    fielderId: p.playerId
                                })}>
                                <Text style={styles.listCardName}>{p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setWicketSequence(null)}>
                        <Text style={styles.cancelModalBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (wicketSequence.step === 'RUNS_COMPLETED') {
            return (
                <View style={styles.container}>
                    <Stack.Screen options={{ title: 'Runs Completed' }} />
                    <Text style={styles.selectPrompt}>How many runs were completed before the Run Out?</Text>
                    <View style={[styles.keypadArea, { flex: 0, marginTop: 'auto' }]}>
                        <View style={styles.keypadRow}>
                            {[0, 1, 2, 3].map(r => (
                                <TouchableOpacity key={r} style={styles.keyRun}
                                    onPress={() => setWicketSequence({ ...wicketSequence, step: 'BATTER', runsCompleted: r })}>
                                    <Text style={styles.keyRunText}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setWicketSequence(null)}>
                        <Text style={styles.cancelModalBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (wicketSequence.step === 'BATTER') {
            return (
                <View style={styles.container}>
                    <Stack.Screen options={{ title: 'Select Next Batter' }} />
                    <Text style={styles.selectPrompt}>Who is the next batter in?</Text>
                    <ScrollView>
                        {players.filter(p => p.team === liveSettings.battingTeamId && p.playerId !== liveSettings.strikerId && p.playerId !== liveSettings.nonStrikerId).map(p => (
                            <TouchableOpacity
                                key={p.playerId}
                                style={styles.listCard}
                                onPress={() => processBall('WICKET', {
                                    wicketType: wicketSequence.type,
                                    fielderId: wicketSequence.fielderId,
                                    outPlayerId: wicketSequence.outPlayerId,
                                    newBatterId: p.playerId,
                                    runs: wicketSequence.runsCompleted || 0,
                                    extraType: wicketSequence.deliveryType !== 'LEGAL' ? wicketSequence.deliveryType : undefined
                                })}
                            >
                                <Text style={styles.listCardName}>{p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setWicketSequence(null)}>
                        <Text style={styles.cancelModalBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            );
        }
    }

    if (liveSettings?.awaitingNewBowler) {
        const changeBowler = async (bowlerId: string) => {
            try {
                setProcessing(true);
                const token = await getAuthToken();
                const res = await axios.post(
                    `${API_URL}/admin/matches/${matchId}/change-bowler`,
                    { bowlerId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMatch(res.data.match);
            } catch (err: any) {
                Alert.alert('Error', err.response?.data?.message || 'Could not set new bowler');
            } finally {
                setProcessing(false);
            }
        };
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Over Completed!', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fbbf24' }} />
                <Text style={styles.selectPrompt}>Over completed. Who is bowling next?</Text>
                <ScrollView>
                    {players.filter(p => p.team === liveSettings.bowlingTeamId && p.playerId !== liveSettings.bowlerId).map(p => (
                        <TouchableOpacity
                            key={p.playerId}
                            style={styles.listCard}
                            onPress={() => changeBowler(p.playerId)}
                        >
                            <Text style={styles.listCardName}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity style={[styles.cancelModalBtn, { backgroundColor: '#fef3c7' }]} onPress={handleUndo}>
                    <Text style={[styles.cancelModalBtnText, { color: '#b45309' }]}>UNDO LAST BALL INSTEAD</Text>
                </TouchableOpacity>
            </View>
        );
    }


    if (selectingExtra) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: `Select Extra Runs` }} />
                <Text style={styles.selectPrompt}>Runs scored off this {selectingExtra}?</Text>

                <View style={[styles.keypadArea, { flex: 0, marginTop: 'auto' }]}>
                    <View style={styles.keypadRow}>
                        {['0', '1', '2', '3'].map((r) => (
                            <TouchableOpacity key={r} style={styles.keyRun} onPress={() => submitExtra(Number(r))}>
                                <Text style={styles.keyRunText}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.keypadRow}>
                        {['4', '5', '6'].map((r) => (
                            <TouchableOpacity key={r} style={[styles.keyRun, r === '4' && styles.key4, r === '6' && styles.key6]} onPress={() => submitExtra(Number(r))}>
                                <Text style={[styles.keyRunText, (r === '4' || r === '6') && styles.keyRunTextWhite]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.keyRun, { backgroundColor: '#f1f5f9' }]} onPress={() => setSelectingExtra(null)}>
                            <Text style={[styles.keyRunText, { fontSize: 16, color: '#ef4444' }]}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // MAIN KEYPAD VIEW
    return (
        <View style={styles.keypadContainer}>
            <Stack.Screen options={{
                title: 'Live Scoring',
                headerStyle: { backgroundColor: '#1e293b' },
                headerTintColor: '#fbbf24',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.push('/admin/users')} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                        <Text style={{ color: '#fbbf24', fontSize: 16, fontWeight: '700' }}>← Back</Text>
                    </TouchableOpacity>
                )
            }} />

            {/* Scoreboard Header */}
            <View style={styles.scoreboard}>
                <View style={styles.scoreRow}>
                    <Text style={styles.teamName}>{liveScore.battingTeam}</Text>
                    <Text style={styles.scoreText}>{liveScore.runs}/{liveScore.wickets}</Text>
                </View>
                <Text style={styles.oversText}>
                    Overs: {liveScore.overs}.{liveScore.balls}
                    {match.matchConfig?.totalOvers ? ` / ${match.matchConfig.totalOvers}` : ''}
                </Text>
                {match.matchConfig?.tossWinner ? (
                    <Text style={styles.targetText}>
                        🪙 {match.matchConfig.tossWinner} won toss & chose to {match.matchConfig.tossChoice === 'BAT' ? 'Bat' : 'Bowl'}
                    </Text>
                ) : null}
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
                    <Text style={styles.statsHeaderCell}>⇆</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={[styles.statsCellName, { color: '#0284c7', fontWeight: '800' }]}>{getPlayerName(liveSettings.strikerId)} *</Text>
                    <Text style={[styles.statsCell, { fontWeight: '700' }]}>{strikerStat.runs}</Text>
                    <Text style={styles.statsCell}>{strikerStat.ballsFaced}</Text>
                    <Text style={styles.statsCell}>{strikerStat.fours}</Text>
                    <Text style={styles.statsCell}>{strikerStat.sixes}</Text>
                    <TouchableOpacity onPress={handleSwapStrike} disabled={processing} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, color: '#0284c7' }}>⇆</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.statsRow}>
                    <Text style={styles.statsCellName}>{getPlayerName(liveSettings.nonStrikerId)}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.runs}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.ballsFaced}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.fours}</Text>
                    <Text style={styles.statsCell}>{nonStrikerStat.sixes}</Text>
                    <View style={{ flex: 1 }} />
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
                    <TouchableOpacity style={styles.keyExtra} onPress={() => handleExtraPress('WD')} disabled={processing}>
                        <Text style={styles.keyExtraText}>WD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.keyExtra} onPress={() => handleExtraPress('NB')} disabled={processing}>
                        <Text style={styles.keyExtraText}>NB</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.keyExtra} onPress={() => handleExtraPress('LB')} disabled={processing}>
                        <Text style={styles.keyExtraText}>LB</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.keyExtra} onPress={() => handleExtraPress('B')} disabled={processing}>
                        <Text style={styles.keyExtraText}>B</Text>
                    </TouchableOpacity>
                </View>

                {/* Big Actions */}
                <View style={[styles.keypadRow, { marginTop: 15 }]}>
                    <TouchableOpacity style={styles.keyWicket} onPress={startWicketSequence} disabled={processing}>
                        <Text style={styles.keyWicketText}>OUT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.keyWicket, { backgroundColor: '#f59e0b' }]} onPress={handleUndo} disabled={processing}>
                        <Text style={styles.keyWicketText}>UNDO</Text>
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
    listCardName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    cancelModalBtn: { backgroundColor: '#fee2e2', padding: 16, marginHorizontal: 20, marginBottom: 20, marginTop: 10, borderRadius: 10, alignItems: 'center' },
    cancelModalBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '800', letterSpacing: 1 }
});

const setupStyles = StyleSheet.create({
    // Teams header
    teamsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#00897b', paddingVertical: 20, paddingHorizontal: 16, marginBottom: 16 },
    teamBlock: { alignItems: 'center', flex: 1 },
    teamAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#4db6ac', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    teamAvatarText: { fontSize: 28, fontWeight: '900', color: '#fff' },
    teamHeaderName: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center', maxWidth: 120 },
    vsText: { fontSize: 22, fontWeight: '900', color: '#fff', opacity: 0.8, marginHorizontal: 8 },

    // Form elements
    label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
    sectionHead: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 8, marginTop: 4 },
    input: { borderBottomWidth: 1.5, borderBottomColor: '#d1d5db', paddingVertical: 10, fontSize: 16, color: '#111827', backgroundColor: 'transparent', marginBottom: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end' },

    // Match type chips
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#d1d5db', marginRight: 8, backgroundColor: '#fff' },
    typeChipActive: { borderColor: '#00897b', backgroundColor: '#00897b' },
    typeChipText: { fontSize: 14, color: '#374151', fontWeight: '600' },
    typeChipTextActive: { color: '#fff', fontWeight: '700' },

    // Power play row
    ppRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 4 },
    ppSub: { fontSize: 13, color: '#6b7280' },

    // Ball type
    ballRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
    ballBtn: { alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', minWidth: 88, backgroundColor: '#fff' },
    ballLabel: { fontSize: 13, color: '#374151', marginTop: 6, fontWeight: '600' },

    // Pitch chips
    pitchChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#d1d5db', backgroundColor: '#fff' },
    pitchChipActive: { borderColor: '#00897b', backgroundColor: '#e6f4f1' },
    pitchChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },

    // Officials
    officialBtn: { alignItems: 'center', marginHorizontal: 4 },
    officialCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', marginBottom: 6 },

    // Match rules link
    rulesLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8 },

    // Rule rows
    ruleCard: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginVertical: 8 },
    ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    ruleLabel: { fontSize: 14, color: '#374151', flex: 1 },
    ruleCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    ruleCircleText: { fontSize: 13, fontWeight: '700', color: '#374151' },

    // Toggle switch
    toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: '#d1d5db', justifyContent: 'center', padding: 2 },
    toggleOn: { backgroundColor: '#00897b' },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
    toggleThumbOn: { alignSelf: 'flex-end' },

    // Counter
    counter: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
    counterBtn: { paddingHorizontal: 14, paddingVertical: 6 },
    counterBtnText: { fontSize: 20, color: '#374151', fontWeight: '700' },
    counterValue: { fontSize: 16, fontWeight: '700', paddingHorizontal: 12, color: '#111827' },

    // Bottom buttons
    bottomBtns: { flexDirection: 'row', gap: 12, marginTop: 24, paddingHorizontal: 0 },
    scheduleBtnGrey: { flex: 1, paddingVertical: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
    scheduleBtnText: { color: '#6b7280', fontSize: 15, fontWeight: '700' },
    nextBtn: { flex: 2, backgroundColor: '#00897b', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
