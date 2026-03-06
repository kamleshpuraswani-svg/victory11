import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { getAuthToken, clearAuthData } from '../../utils/storage';
import { API_URL } from '../../constants/Config';

type UserData = {
    _id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
};

export default function AdminUsersScreen() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'USERS' | 'MATCHES'>('USERS');
    const [matches, setMatches] = useState<any[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Pre-fetch matches for lookups regardless of tab
        fetchMatches();

        if (activeTab === 'USERS') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const token = await getAuthToken();
            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await axios.get(`${API_URL}/admin/users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUsers(response.data.users);
        } catch (err: any) {
            console.error("Fetch users error:", err);
            setError(err.response?.data?.message || 'Failed to load users');
            if (err.response?.status === 401 || err.response?.status === 403) {
                Alert.alert('Unauthorized', 'Please login as an admin.', [
                    { text: 'OK', onPress: handleLogout }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUserTeams = async (userId: string) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
            return;
        }

        setExpandedUser(userId);
        setTeamsLoading(true);
        try {
            const token = await getAuthToken();
            const response = await axios.get(`${API_URL}/admin/users/${userId}/teams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserTeams(response.data.teams);
        } catch (err) {
            console.error("Fetch user teams error:", err);
            Alert.alert('Error', 'Failed to fetch teams for this user');
        } finally {
            setTeamsLoading(false);
        }
    };

    const fetchMatches = async () => {
        setMatchesLoading(true);
        try {
            const response = await axios.get(`${API_URL}/matches/upcoming`);
            setMatches(response.data.matches);
        } catch (err) {
            console.error("Fetch matches error:", err);
            Alert.alert('Error', 'Failed to fetch matches');
        } finally {
            setMatchesLoading(false);
        }
    };

    const handleResetMatch = async (matchId: string) => {
        Alert.alert(
            'Reset Match',
            'This will clear all scoring data and reset the match to UPCOMING. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await getAuthToken();
                            const url = `${API_URL}/admin/matches/${matchId}/reset`;
                            console.log(`[RESET] Calling URL: ${url}`);
                            Alert.alert('DEBUG', `Calling: ${url}`);

                            const response = await axios.post(url, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            console.log(`[RESET] Server Response:`, response.data);
                            Alert.alert('Success', 'Match data has been reset.');
                            fetchMatches();
                        } catch (err) {
                            console.error("Reset match error:", err);
                            Alert.alert('Error', 'Failed to reset match');
                        }
                    }
                }
            ]
        );
    };

    const updateMatchStatus = async (matchId: string, newStatus: string) => {
        try {
            const token = await getAuthToken();
            await axios.patch(`${API_URL}/admin/matches/${matchId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success', `Match is now ${newStatus}`);
            fetchMatches(); // Refresh list
        } catch (err) {
            console.error("Update status error:", err);
            Alert.alert('Error', 'Failed to update match status');
        }
    };

    const getMatchTitle = (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
        return match ? match.title : matchId;
    };

    const handleLogout = async () => {
        await clearAuthData();
        router.replace('/login');
    };

    const renderItem = ({ item, index }: { item: UserData, index: number }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{index + 1}. {item.name || 'N/A'}</Text>
                <Text style={styles.userDetail}>📧 {item.email || 'N/A'}</Text>
                <Text style={styles.userDetail}>📱 {item.phone || 'N/A'}</Text>
                <Text style={styles.userDate}>Registered: {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <TouchableOpacity
                style={styles.viewTeamsBtn}
                onPress={() => fetchUserTeams(item._id)}
            >
                <Text style={styles.viewTeamsText}>
                    {expandedUser === item._id ? 'HIDE TEAMS' : 'VIEW TEAMS'}
                </Text>
            </TouchableOpacity>

            {expandedUser === item._id && (
                <View style={styles.teamsSection}>
                    {teamsLoading ? (
                        <ActivityIndicator size="small" color="#fbbf24" style={{ marginVertical: 10 }} />
                    ) : userTeams.length === 0 ? (
                        <Text style={styles.noTeamsText}>No teams created yet.</Text>
                    ) : (
                        userTeams.map((team, index) => (
                            <TouchableOpacity
                                key={team._id}
                                style={styles.teamItem}
                                onPress={() => router.push({
                                    pathname: '/admin/team-details',
                                    params: { teamId: team._id }
                                })}
                            >
                                <View style={styles.teamRowHeader}>
                                    <Text style={styles.teamNumber}>TEAM {index + 1}</Text>
                                    <Text style={styles.teamMatch}>{getMatchTitle(team.matchId)}</Text>
                                </View>
                                <View style={styles.teamStatsMini}>
                                    <Text style={styles.teamDetails}>👥 {team.players?.length || 0}/11</Text>
                                    <Text style={styles.teamDetails}>🎯 {team.totalPoints || 0} pts</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            )}
        </View>
    );
    const renderMatchItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.matchCard}
            onPress={() => router.push({
                pathname: '/admin/match-teams',
                params: { matchId: item.id, matchTitle: item.title }
            })}
        >
            <View style={styles.matchInfoHeader}>
                <Text style={styles.matchTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'UPCOMING' ? '#e1f5fe' : '#f1f5f9' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'UPCOMING' ? '#0288d1' : '#64748b' }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <View style={styles.matchDetailsRow}>
                <Text style={styles.matchDetailText}>🏟️ {item.venue || 'N/A'}</Text>
                <Text style={styles.matchDetailText}>🕒 {new Date(item.startTime).toLocaleDateString('en-GB') + ' ' + new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>

            <View style={styles.adminActionRow}>
                <TouchableOpacity
                    style={[styles.statusBtn, item.status === 'UPCOMING' && styles.activeStatusBtnUpcoming]}
                    onPress={() => updateMatchStatus(item.id, 'UPCOMING')}
                >
                    <Text style={styles.statusBtnText}>UPCOMING</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statusBtn, item.status === 'LIVE' && styles.activeStatusBtnLive]}
                    onPress={() => updateMatchStatus(item.id, 'LIVE')}
                >
                    <Text style={styles.statusBtnText}>LIVE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.statusBtn, item.status === 'COMPLETED' && styles.activeStatusBtnCompleted]}
                    onPress={() => updateMatchStatus(item.id, 'COMPLETED')}
                >
                    <Text style={styles.statusBtnText}>COMPLETED</Text>
                </TouchableOpacity>
            </View>

            {(item.status === 'LIVE' || item.status === 'COMPLETED') && (
                <View style={styles.actionRowStyles}>
                    {item.status === 'LIVE' && (
                        <TouchableOpacity
                            style={[styles.liveScoreBtn, { flex: 1, marginRight: 5 }]}
                            onPress={() => router.push({
                                pathname: '/admin/live-match-keypad',
                                params: { matchId: item.id }
                            })}
                        >
                            <Text style={styles.liveScoreBtnText}>▶ START SCORING</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === 'COMPLETED' && (
                        <TouchableOpacity
                            style={[styles.scorecardBtn, { flex: 1, marginRight: 5 }]}
                            onPress={() => router.push({
                                pathname: '/admin/admin-scorecard',
                                params: { matchId: item.id }
                            })}
                        >
                            <Text style={styles.scorecardBtnText}>📝 VIEW & EDIT SCORECARD</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.resetMatchBtn, { flex: 0.4 }]}
                        onPress={() => handleResetMatch(item.id)}
                    >
                        <Text style={styles.resetMatchBtnText}>🔄 RESET</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );



        </TouchableOpacity >
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Admin Portal',
                    headerStyle: { backgroundColor: '#1e293b' },
                    headerTintColor: '#fbbf24',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                            <Text style={styles.logoutText}>SIGN OUT</Text>
                        </TouchableOpacity>
                    )
                }}
            />

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'USERS' && styles.activeTab]}
                    onPress={() => setActiveTab('USERS')}
                >
                    <Text style={[styles.tabText, activeTab === 'USERS' && styles.activeTabText]}>USERS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'MATCHES' && styles.activeTab]}
                    onPress={() => setActiveTab('MATCHES')}
                >
                    <Text style={[styles.tabText, activeTab === 'MATCHES' && styles.activeTabText]}>MATCHES</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'USERS' ? (
                    <>
                        <Text style={styles.headerTitle}>Total Registered Users: {users.length}</Text>
                        {loading ? (
                            <ActivityIndicator size="large" color="#1e293b" style={{ marginTop: 50 }} />
                        ) : error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : users.length === 0 ? (
                            <Text style={styles.emptyText}>No users registered yet.</Text>
                        ) : (
                            <FlatList
                                data={users}
                                keyExtractor={(item) => item._id}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContainer}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <Text style={styles.headerTitle}>Upcoming Matches: {matches.length}</Text>
                        {matchesLoading ? (
                            <ActivityIndicator size="large" color="#1e293b" style={{ marginTop: 50 }} />
                        ) : matches.length === 0 ? (
                            <Text style={styles.emptyText}>No upcoming matches found.</Text>
                        ) : (
                            <FlatList
                                data={matches}
                                keyExtractor={(item) => item.id}
                                renderItem={renderMatchItem}
                                contentContainerStyle={styles.listContainer}
                            />
                        )}
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    content: { flex: 1, padding: 20 },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center'
    },
    listContainer: { paddingBottom: 30 },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#fbbf24'
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    userDetail: { fontSize: 13, color: '#64748b', marginBottom: 2 },
    userDate: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },
    errorText: { color: '#ef4444', textAlign: 'center', marginTop: 20, fontWeight: '600' },
    emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40, fontSize: 16 },
    logoutBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fbbf24',
        borderRadius: 6
    },
    logoutText: { color: '#1e293b', fontWeight: '800', fontSize: 12 },
    viewTeamsBtn: {
        marginTop: 12,
        backgroundColor: '#e2e8f0',
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center'
    },
    viewTeamsText: {
        color: '#1e293b',
        fontWeight: '700',
        fontSize: 12
    },
    teamsSection: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    noTeamsText: {
        color: '#64748b',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10
    },
    teamItem: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    teamMatch: {
        fontWeight: '700',
        color: '#1e293b',
        fontSize: 13,
        flex: 1
    },
    teamRowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    teamNumber: {
        fontSize: 10,
        fontWeight: '900',
        color: '#fbbf24',
        backgroundColor: '#1e293b',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8
    },
    teamStatsMini: {
        flexDirection: 'row',
        gap: 15
    },
    teamDetails: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500'
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 5,
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8
    },
    activeTab: {
        backgroundColor: '#1e293b'
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b'
    },
    activeTabText: {
        color: '#fbbf24'
    },
    matchCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6'
    },
    matchInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
        flex: 1
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800'
    },
    matchDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    matchDetailText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500'
    },
    adminActionRow: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        justifyContent: 'space-between',
        gap: 8
    },
    statusBtn: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    statusBtnText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748b'
    },
    activeStatusBtnUpcoming: { backgroundColor: '#e1f5fe', borderColor: '#0288d1' },
    activeStatusBtnLive: { backgroundColor: '#fef3c7', borderColor: '#d97706' },
    activeStatusBtnCompleted: { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
    liveScoreBtn: {
        backgroundColor: '#1e293b',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fbbf24'
    },
    liveScoreBtnText: {
        color: '#fbbf24',
        fontWeight: '900',
        fontSize: 10
    },
    actionRowStyles: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12
    },
    scorecardBtn: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0288d1'
    },
    scorecardBtnText: {
        color: '#0288d1',
        fontWeight: '900',
        fontSize: 10
    },
    resetMatchBtn: {
        backgroundColor: '#fee2e2',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ef4444'
    },
    resetMatchBtnText: {
        color: '#ef4444',
        fontWeight: '900',
        fontSize: 10
    }
});

