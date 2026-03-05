import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { getAuthToken } from '../../utils/storage';

type LeaderboardUser = {
    _id: string;
    name: string;
    email: string;
    totalPoints: number;
    teamCount: number;
};

export default function LeaderboardScreen() {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchLeaderboard = async () => {
        try {
            const response = await axios.get(`${API_URL}/leaderboard`);
            setUsers(response.data.leaderboard);
        } catch (error) {
            console.error("Fetch leaderboard error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchLeaderboard();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaderboard();
    };

    const handleUserTap = (userId: string, userName: string) => {
        router.push({
            pathname: '/user-teams',
            params: { userId, userName }
        });
    };

    const renderItem = ({ item, index }: { item: LeaderboardUser, index: number }) => {
        const isTopThree = index < 3;
        let rankColor = '#64748b'; // default grey

        if (index === 0) rankColor = '#fbbf24'; // Gold
        else if (index === 1) rankColor = '#94a3b8'; // Silver
        else if (index === 2) rankColor = '#b45309'; // Bronze

        return (
            <TouchableOpacity
                style={styles.userCard}
                onPress={() => handleUserTap(item._id, item.name || 'Anonymous User')}
                activeOpacity={0.7}
            >
                <View style={styles.rankContainer}>
                    <Text style={[styles.rankText, { color: rankColor, fontSize: isTopThree ? 24 : 18 }]}>
                        #{index + 1}
                    </Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name || 'Anonymous User'}</Text>
                    <Text style={styles.teamCount}>{item.teamCount} Teams Created</Text>
                </View>

                <View style={styles.pointsContainer}>
                    <Text style={styles.pointsLabel}>Total Points</Text>
                    <Text style={styles.pointsText}>{item.totalPoints}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Global Leaderboard', headerShown: false }} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>TOP PLAYERS</Text>
                <Text style={styles.headerSubtitle}>Based on total fantasy points across all matches</Text>
            </View>

            {users.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No rankings available yet.</Text>
                    <Text style={styles.emptySubtext}>Join a contest to get on the board!</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#1e293b',
        padding: 20,
        paddingTop: 60, // Account for safe area roughly
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 15
    },
    headerTitle: {
        color: '#fbbf24',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 5
    },
    listContainer: { paddingHorizontal: 15, paddingBottom: 20 },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontWeight: '900',
        fontStyle: 'italic'
    },
    userInfo: {
        flex: 1,
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#f1f5f9'
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b'
    },
    teamCount: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2
    },
    pointsContainer: {
        alignItems: 'flex-end',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8
    },
    pointsLabel: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    pointsText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#4caf50'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b'
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 5
    }
});
