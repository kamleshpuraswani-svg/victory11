import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { getAuthToken } from '../utils/storage';

import { API_URL } from '../constants/Config';

export default function Contests() {
    const { matchId, teamA, teamB } = useLocalSearchParams();
    const router = useRouter();
    const [contests, setContests] = useState<any[]>([]);
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [matchStatus, setMatchStatus] = useState('UPCOMING');
    const [loading, setLoading] = useState(true);
    const [teamsLoading, setTeamsLoading] = useState(false);

    useEffect(() => {
        fetchContests();
    }, [matchId]);

    const fetchContests = async () => {
        try {
            const response = await axios.get(`${API_URL}/contests/${matchId}`);
            setContests(response.data.contests);
            setMatchStatus(response.data.matchStatus || 'UPCOMING');
            await fetchUserTeams();
        } catch (err) {
            console.error("Fetch contests error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserTeams = async () => {
        try {
            setTeamsLoading(true);
            const token = await getAuthToken();
            if (!token) return;

            const response = await axios.get(`${API_URL}/teams/${matchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserTeams(response.data.teams);
        } catch (err) {
            console.error("Fetch user teams error:", err);
        } finally {
            setTeamsLoading(false);
        }
    };

    const handleJoin = (contest: any) => {
        if (matchStatus !== 'UPCOMING') {
            Alert.alert(
                matchStatus === 'COMPLETED' ? 'Match Ended' : 'Match Live',
                `This match is ${matchStatus.toLowerCase()} and no longer accepting entries.`
            );
            return;
        }
        // Navigate directly to team selection for this match
        router.push({
            pathname: '/team-selection',
            params: { matchId, teamA, teamB }
        });
    };

    const renderContest = ({ item }: { item: any }) => {
        const hasJoined = userTeams.length > 0;
        const isLocked = matchStatus !== 'UPCOMING';

        return (
            <View>
                <View style={[styles.contestCard, isLocked && styles.lockedCard]}>
                    <View style={styles.contestInfo}>
                        <Text style={styles.contestName}>{item.name}</Text>
                        <Text style={styles.contestDesc}>
                            {matchStatus === 'COMPLETED' ? 'This match has ended.' :
                                matchStatus === 'LIVE' ? 'Match is live. Entries are closed.' :
                                    'Join the ultimate challenge and win big!'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.entryBtn,
                            hasJoined && styles.joinedBtn,
                            isLocked && styles.disabledBtn
                        ]}
                        onPress={() => handleJoin(item)}
                    >
                        <Text style={styles.entryBtnText}>
                            {matchStatus === 'COMPLETED' ? 'ENDED' : hasJoined ? 'JOINED' : 'JOIN'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {userTeams.length > 0 && (
                    <View style={styles.userTeamsSection}>
                        <Text style={styles.sectionTitle}>MY TEAMS ({userTeams.length})</Text>
                        {userTeams.map((team, index) => (
                            <TouchableOpacity
                                key={team._id}
                                style={styles.teamRow}
                                onPress={() => router.push({
                                    pathname: '/team-details',
                                    params: { teamId: team._id }
                                })}
                            >
                                <View style={styles.teamRowLeft}>
                                    <View style={styles.teamNumberCircle}>
                                        <Text style={styles.teamNumberText}>T{index + 1}</Text>
                                    </View>
                                    <Text style={styles.teamRowText}>Team {index + 1}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        ))}

                        {!isLocked && (
                            <TouchableOpacity
                                style={styles.addMoreBtn}
                                onPress={() => handleJoin(item)}
                            >
                                <Ionicons name="add-circle" size={20} color="#4caf50" />
                                <Text style={styles.addMoreText}>Create Multiple Teams</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
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
    entryBtnText: { color: '#fff', fontWeight: 'bold' },
    joinedBtn: {
        backgroundColor: '#1e293b',
    },
    disabledBtn: {
        backgroundColor: '#94a3b8',
    },
    lockedCard: {
        opacity: 0.8,
        borderColor: '#e2e8f0',
        borderWidth: 1
    },
    userTeamsSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginTop: -10, // Overlap with contest card slightly
        marginBottom: 20,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderTopWidth: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
        marginBottom: 10,
        letterSpacing: 0.5
    },
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    teamRowLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    teamNumberCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    teamNumberText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e293b'
    },
    teamRowText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b'
    },
    addMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    addMoreText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '700',
        color: '#4caf50'
    }
});
