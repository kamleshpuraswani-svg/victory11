import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

interface Player {
    id: string;
    name: string;
    role: string;
    credits: number;
    team: string;
}

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthToken } from '../utils/storage';
import axios from 'axios';
import { API_URL } from '../constants/Config';

const TEAM_PLAYERS: Record<string, any[]> = {
    "MI Warriors": [
        { "id": "mw1", "name": "Sanskar Mehta", "role": "BAT", "credits": 0, "team": "MI Warriors" },
        { "id": "mw2", "name": "Utsav Desai", "role": "BAT", "credits": 0, "team": "MI Warriors" },
        { "id": "mw3", "name": "Abhas Mathur", "role": "BAT", "credits": 0, "team": "MI Warriors" },
        { "id": "mw4", "name": "Nagendra Giri", "role": "AR", "credits": 0, "team": "MI Warriors" },
        { "id": "mw5", "name": "Thakkar Akash H.", "role": "BOWL", "credits": 0, "team": "MI Warriors" },
        { "id": "mw6", "name": "Kshitij Modi", "role": "BAT", "credits": 0, "team": "MI Warriors" },
        { "id": "mw7", "name": "Bhavya Jain", "role": "BAT", "credits": 0, "team": "MI Warriors" },
        { "id": "mw8", "name": "Priyank Suthar", "role": "BOWL", "credits": 0, "team": "MI Warriors" },
        { "id": "mw9", "name": "Dip Rabari", "role": "BOWL", "credits": 0, "team": "MI Warriors" },
        { "id": "mw10", "name": "Sanjay Prajapati", "role": "BAT", "credits": 0, "team": "MI Warriors" },
        { "id": "mw11", "name": "Dheer Kothari", "role": "AR", "credits": 0, "team": "MI Warriors" },
        { "id": "mw12", "name": "Karan Darji", "role": "AR", "credits": 0, "team": "MI Warriors" },
        { "id": "mw13", "name": "Mayur Rajput", "role": "WK", "credits": 0, "team": "MI Warriors" },
        { "id": "mw14", "name": "Tirth Shah", "role": "BOWL", "credits": 0, "team": "MI Warriors" },
        { "id": "mw15", "name": "Paras Anadani", "role": "BOWL", "credits": 0, "team": "MI Warriors" }
    ],
    "MI Smashers": [
        { "id": "ms1", "name": "Nihir Patel", "role": "BAT", "credits": 0, "team": "MI Smashers" },
        { "id": "ms2", "name": "Chirag Murari", "role": "BAT", "credits": 0, "team": "MI Smashers" },
        { "id": "ms3", "name": "Khushal Koriya", "role": "BOWL", "credits": 0, "team": "MI Smashers" },
        { "id": "ms4", "name": "Piyush Selarka", "role": "AR", "credits": 0, "team": "MI Smashers" },
        { "id": "ms5", "name": "Aman Singh Thakur", "role": "BAT", "credits": 0, "team": "MI Smashers" },
        { "id": "ms6", "name": "Nikhil Gohil", "role": "BOWL", "credits": 0, "team": "MI Smashers" },
        { "id": "ms7", "name": "Smit Thakkar", "role": "WK", "credits": 0, "team": "MI Smashers" },
        { "id": "ms8", "name": "Maulik Togadiya", "role": "BOWL", "credits": 0, "team": "MI Smashers" },
        { "id": "ms9", "name": "Mink Virparia", "role": "AR", "credits": 0, "team": "MI Smashers" },
        { "id": "ms10", "name": "Vimal Prajapati", "role": "BAT", "credits": 0, "team": "MI Smashers" },
        { "id": "ms11", "name": "Vishal Parmar", "role": "BOWL", "credits": 0, "team": "MI Smashers" },
        { "id": "ms12", "name": "Aryan Shah", "role": "BAT", "credits": 0, "team": "MI Smashers" },
        { "id": "ms13", "name": "Chirag Prajapati", "role": "AR", "credits": 0, "team": "MI Smashers" },
        { "id": "ms14", "name": "Chirag Rami", "role": "BOWL", "credits": 0, "team": "MI Smashers" },
        { "id": "ms15", "name": "Kamlesh Puraswani", "role": "BAT", "credits": 0, "team": "MI Smashers" }
    ],
    "300.EXE": [
        { "id": "ex1", "name": "Jay Thakkar", "role": "BAT", "credits": 0, "team": "300.EXE" },
        { "id": "ex2", "name": "Dharma Suthar", "role": "AR", "credits": 0, "team": "300.EXE" },
        { "id": "ex3", "name": "Vishal Prajapati", "role": "BOWL", "credits": 0, "team": "300.EXE" },
        { "id": "ex4", "name": "Anish Panchal", "role": "BAT", "credits": 0, "team": "300.EXE" },
        { "id": "ex5", "name": "Meet Vora", "role": "WK", "credits": 0, "team": "300.EXE" },
        { "id": "ex6", "name": "Suraj Barnwal", "role": "BOWL", "credits": 0, "team": "300.EXE" },
        { "id": "ex7", "name": "Yashang Vyas", "role": "BAT", "credits": 0, "team": "300.EXE" },
        { "id": "ex8", "name": "Hitesh Rabari", "role": "AR", "credits": 0, "team": "300.EXE" },
        { "id": "ex9", "name": "Kundan Kumar Singh", "role": "BOWL", "credits": 0, "team": "300.EXE" },
        { "id": "ex10", "name": "Manish Singh", "role": "BAT", "credits": 0, "team": "300.EXE" },
        { "id": "ex11", "name": "Nisarg Soni", "role": "BOWL", "credits": 0, "team": "300.EXE" },
        { "id": "ex12", "name": "Ashay Patel", "role": "AR", "credits": 0, "team": "300.EXE" },
        { "id": "ex13", "name": "Kuldeep Rajput", "role": "BOWL", "credits": 0, "team": "300.EXE" },
        { "id": "ex14", "name": "Nimesh Vaniya", "role": "BAT", "credits": 0, "team": "300.EXE" },
        { "id": "ex15", "name": "Jaydeep Karia", "role": "WK", "credits": 0, "team": "300.EXE" }
    ],
    "Collab Kings": [
        { "id": "ck1", "name": "Neeraj Joshi", "role": "BAT", "credits": 0, "team": "Collab Kings" },
        { "id": "ck2", "name": "Jeet Parikh", "role": "BAT", "credits": 0, "team": "Collab Kings" },
        { "id": "ck3", "name": "Harshit Sampat", "role": "BOWL", "credits": 0, "team": "Collab Kings" },
        { "id": "ck4", "name": "Paresh Panchal", "role": "BOWL", "credits": 0, "team": "Collab Kings" },
        { "id": "ck5", "name": "Gyansingh Baghel", "role": "AR", "credits": 0, "team": "Collab Kings" },
        { "id": "ck6", "name": "Sagar Patel", "role": "BAT", "credits": 0, "team": "Collab Kings" },
        { "id": "ck7", "name": "Dipesh Jethva", "role": "BOWL", "credits": 0, "team": "Collab Kings" },
        { "id": "ck8", "name": "Nikunj Jogi", "role": "AR", "credits": 0, "team": "Collab Kings" },
        { "id": "ck9", "name": "Vikash", "role": "BAT", "credits": 0, "team": "Collab Kings" },
        { "id": "ck10", "name": "Dev Bhatt", "role": "WK", "credits": 0, "team": "Collab Kings" },
        { "id": "ck11", "name": "Aman Patel", "role": "BAT", "credits": 0, "team": "Collab Kings" },
        { "id": "ck12", "name": "Arpit Bobade", "role": "BOWL", "credits": 0, "team": "Collab Kings" },
        { "id": "ck13", "name": "Manoj Rajput", "role": "AR", "credits": 0, "team": "Collab Kings" },
        { "id": "ck14", "name": "Ashutosh Jaiswal", "role": "BAT", "credits": 0, "team": "Collab Kings" },
        { "id": "ck15", "name": "Ankit Dave", "role": "BOWL", "credits": 0, "team": "Collab Kings" },
        { "id": "ck16", "name": "Vijaya K. Gongada", "role": "AR", "credits": 0, "team": "Collab Kings" }
    ],
    "Collab Titans": [
        { "id": "ct1", "name": "Akash Patel", "role": "BAT", "credits": 0, "team": "Collab Titans" },
        { "id": "ct2", "name": "Banti Chaudhary", "role": "BAT", "credits": 0, "team": "Collab Titans" },
        { "id": "ct3", "name": "Bhavin Vala", "role": "BOWL", "credits": 0, "team": "Collab Titans" },
        { "id": "ct4", "name": "Dinesh Sawant", "role": "BAT", "credits": 0, "team": "Collab Titans" },
        { "id": "ct5", "name": "Hasmukh Suthar", "role": "BOWL", "credits": 0, "team": "Collab Titans" },
        { "id": "ct6", "name": "Vivek Chauhan", "role": "AR", "credits": 0, "team": "Collab Titans" },
        { "id": "ct7", "name": "Sunil", "role": "BAT", "credits": 0, "team": "Collab Titans" },
        { "id": "ct8", "name": "Sunny Panchal", "role": "BOWL", "credits": 0, "team": "Collab Titans" },
        { "id": "ct9", "name": "Debtanu Adak", "role": "WK", "credits": 0, "team": "Collab Titans" },
        { "id": "ct10", "name": "Pratik Patel", "role": "BAT", "credits": 0, "team": "Collab Titans" },
        { "id": "ct11", "name": "Satyam Kumar", "role": "BOWL", "credits": 0, "team": "Collab Titans" },
        { "id": "ct12", "name": "Govind Rajput", "role": "AR", "credits": 0, "team": "Collab Titans" },
        { "id": "ct13", "name": "Bhavesh Vadher", "role": "BAT", "credits": 0, "team": "Collab Titans" },
        { "id": "ct14", "name": "Shaikh Mo Asad M", "role": "BOWL", "credits": 0, "team": "Collab Titans" },
        { "id": "ct15", "name": "Vivek A. Shekhat", "role": "BAT", "credits": 0, "team": "Collab Titans" },
        { "id": "ct16", "name": "Chirag Patel", "role": "AR", "credits": 0, "team": "Collab Titans" }
    ],
    "300 Dakaits": [
        { "id": "dk1", "name": "Aditya Jani", "role": "BAT", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk2", "name": "Parth Bapodara", "role": "BAT", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk3", "name": "Jaydeep Chandela", "role": "BOWL", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk4", "name": "Ansh Shah", "role": "AR", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk5", "name": "Varun Patel", "role": "BAT", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk6", "name": "Uzer Khan", "role": "WK", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk7", "name": "Abhishek K.", "role": "BOWL", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk8", "name": "Dhruvin Dave", "role": "BAT", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk9", "name": "Vijay Sadhu", "role": "BOWL", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk10", "name": "Sumeet Thakkar", "role": "AR", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk11", "name": "Patel Ayush R.", "role": "BAT", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk12", "name": "Mehul Sir", "role": "BAT", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk13", "name": "Dipak Prajapati", "role": "AR", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk14", "name": "Jwalant Mehta", "role": "BOWL", "credits": 0, "team": "300 Dakaits" },
        { "id": "dk15", "name": "Vaibhav Trivedi", "role": "BAT", "credits": 0, "team": "300 Dakaits" }
    ]
};

export default function TeamSelection() {
    const { matchId, teamA, teamB, teamId, editSelectedPlayers, editCaptainId, editViceCaptainId, matchTitle } = useLocalSearchParams();
    const router = useRouter();
    const [players, setPlayers] = useState<any[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Role selection state
    const [isRoleSelection, setIsRoleSelection] = useState(false);
    const [captainId, setCaptainId] = useState<string | null>(null);
    const [viceCaptainId, setViceCaptainId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. Initialize selection if editing
                if (editSelectedPlayers) {
                    const parsed = JSON.parse(editSelectedPlayers as string);
                    setSelectedPlayers(parsed);
                    if (editCaptainId) setCaptainId(editCaptainId as string);
                    if (editViceCaptainId) setViceCaptainId(editViceCaptainId as string);
                }

                // 2. Load Players
                // Fallback to local data first
                const localPlayers = [
                    ...(TEAM_PLAYERS[teamA as string] || []),
                    ...(TEAM_PLAYERS[teamB as string] || [])
                ];
                setPlayers(localPlayers);

                // Try fetching remote data
                if (matchId) {
                    const response = await axios.get(`${API_URL}/players/${matchId}`);
                    if (response.data && Array.isArray(response.data.players) && response.data.players.length > 0) {
                        setPlayers(response.data.players);
                    }

                    // Also check match status for locking edits
                    const contestsRes = await axios.get(`${API_URL}/contests/${matchId}`);
                    if (contestsRes.data.matchStatus && contestsRes.data.matchStatus !== 'UPCOMING') {
                        setErrorMsg(`Match is ${contestsRes.data.matchStatus.toLowerCase()}. Editing is disabled.`);
                    }
                }
            } catch (error) {
                console.error("Error initializing team selection:", error);
                setErrorMsg("Could not load players. Showing local squad.");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [matchId, teamA, teamB, editSelectedPlayers]);

    const togglePlayer = (p: any) => {
        setErrorMsg(null);
        if (selectedPlayers.includes(p.id)) {
            setSelectedPlayers(selectedPlayers.filter(id => id !== p.id));
        } else {
            if (selectedPlayers.length < 11) {
                setSelectedPlayers([...selectedPlayers, p.id]);
            } else {
                setErrorMsg("Limit reached: Pick exactly 11 players.");
            }
        }
    };

    const handleContinue = () => {
        if (selectedPlayers.length !== 11) {
            setErrorMsg("Pick exactly 11 players to continue.");
            return;
        }
        setErrorMsg(null);
        setIsRoleSelection(true);
    };

    const handleFinalSubmit = async () => {
        if (!captainId || !viceCaptainId) {
            setErrorMsg("Please select BOTH a Captain (C) and a Vice-Captain (VC).");
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);

        try {
            // Re-verify status before submit
            const statusRes = await axios.get(`${API_URL}/contests/${matchId}`);
            if (statusRes.data.matchStatus && statusRes.data.matchStatus !== 'UPCOMING') {
                Alert.alert("Match Locked", `Match is already ${statusRes.data.matchStatus.toLowerCase()}. You can no longer save teams.`);
                setSubmitting(false);
                return;
            }

            const url = teamId
                ? `${API_URL}/teams/${teamId}`
                : `${API_URL}/teams/create`;

            const method = teamId ? 'put' : 'post';

            const token = await getAuthToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            console.log("Team Selection Final Submit:", {
                method,
                url,
                teamId,
                matchId,
                playerCount: selectedPlayers.length,
                captainId,
                viceCaptainId
            });

            const response = await axios({
                method,
                url,
                headers,
                data: {
                    matchId,
                    playerIds: selectedPlayers,
                    captainId,
                    viceCaptainId
                }
            });

            console.log("Submit Response:", response.data);
            Alert.alert(
                "Success",
                teamId ? "Team updated!" : "Team saved!",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace({
                            pathname: '/my-teams',
                            params: { matchId, matchTitle }
                        })
                    }
                ]
            );
        } catch (error: any) {
            console.error("Submit error detail:", error);
            if (error.response) {
                // Server responded with a status code outside the 2xx range
                setErrorMsg(`Server Error: ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                // Request was made but no response was received
                setErrorMsg("No response from server. Is the backend running at 5001?");
            } else {
                setErrorMsg(`App Error: ${error.message}`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={{ marginTop: 10 }}>Loading Player List...</Text>
            </View>
        );
    }

    const displayedPlayers = isRoleSelection
        ? players.filter(p => selectedPlayers.includes(p.id))
        : players;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: isRoleSelection ? 'Choose Captain & VC' : 'Select 11 Players' }} />

            <View style={styles.statsContainer}>
                {isRoleSelection ? (
                    <Text style={styles.statLabel}>Pick Captain (2x) & VC (1.5x)</Text>
                ) : (
                    <Text style={styles.statLabel}>Team Progress: <Text style={styles.statValue}>{selectedPlayers.length}/11</Text></Text>
                )}
                {errorMsg ? (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                ) : (
                    <Text style={styles.tipText}>
                        {isRoleSelection ? 'Select your best performers for extra points' : 'Select exactly 11 players to continue'}
                    </Text>
                )}
            </View>

            <FlatList
                data={displayedPlayers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.playerCard, selectedPlayers.includes(item.id) && styles.selectedCard]}>
                        <TouchableOpacity
                            style={styles.playerInfoContainer}
                            onPress={() => !isRoleSelection && togglePlayer(item)}
                            disabled={isRoleSelection}
                        >
                            <View style={styles.playerInfo}>
                                <View style={styles.teamBadge}>
                                    <Text style={styles.teamBadgeText}>{item.team}</Text>
                                </View>
                                <View>
                                    <Text style={styles.playerName}>{item.name}</Text>
                                    <Text style={styles.playerRole}>{item.role}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {isRoleSelection ? (
                            <View style={styles.roleButtons}>
                                <TouchableOpacity
                                    style={[styles.roleBtn, captainId === item.id && styles.roleBtnActive]}
                                    onPress={() => {
                                        if (viceCaptainId === item.id) setViceCaptainId(null);
                                        setCaptainId(item.id);
                                    }}
                                >
                                    <Text style={[styles.roleBtnText, captainId === item.id && styles.roleBtnTextActive]}>C</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleBtn, viceCaptainId === item.id && styles.roleBtnActive]}
                                    onPress={() => {
                                        if (captainId === item.id) setCaptainId(null);
                                        setViceCaptainId(item.id);
                                    }}
                                >
                                    <Text style={[styles.roleBtnText, viceCaptainId === item.id && styles.roleBtnTextActive]}>VC</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            selectedPlayers.includes(item.id) && (
                                <View style={styles.checkCircle}>
                                    <Text style={styles.checkText}>✓</Text>
                                </View>
                            )
                        )}
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {isRoleSelection ? (
                <TouchableOpacity
                    style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                    onPress={handleFinalSubmit}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'SAVING TEAM...' : (teamId ? 'UPDATE TEAM' : 'SAVE TEAM')}
                    </Text>
                </TouchableOpacity>
            ) : (
                selectedPlayers.length === 11 && (
                    <TouchableOpacity style={styles.submitButton} onPress={handleContinue}>
                        <Text style={styles.submitButtonText}>CONTINUE</Text>
                    </TouchableOpacity>
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    statsContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center'
    },
    statLabel: { fontSize: 18, color: '#333', fontWeight: '600' },
    statValue: { color: '#4caf50', fontWeight: '800' },
    tipText: { fontSize: 12, color: '#888', marginTop: 5 },
    errorText: { fontSize: 13, color: '#ef4444', fontWeight: '700', marginTop: 5 },
    playerCard: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f1f1',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedCard: { backgroundColor: '#f0fdf4' },
    playerInfoContainer: { flex: 1 },
    playerInfo: { flexDirection: 'row', alignItems: 'center' },
    teamBadge: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 15
    },
    teamBadgeText: { fontSize: 11, fontWeight: '800', color: '#4b5563', textTransform: 'uppercase' },
    playerName: { fontSize: 17, fontWeight: '600', color: '#111827' },
    playerRole: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    roleButtons: { flexDirection: 'row' },
    roleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        backgroundColor: '#fff'
    },
    roleBtnActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    roleBtnText: { fontSize: 14, fontWeight: 'bold', color: '#4b5563' },
    roleBtnTextActive: { color: '#fff' },
    checkCircle: {
        backgroundColor: '#4caf50',
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    submitButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#10b981',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitButtonText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 1 },
});
