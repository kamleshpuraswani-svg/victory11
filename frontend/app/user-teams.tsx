import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import { Ionicons } from '@expo/vector-icons';

type MatchTeam = {
    _id: string;
    matchId: string;
    totalPoints: number;
    players: string[];
};

export default function UserTeamsScreen() {
    const { userId, userName } = useLocalSearchParams();
    const [teams, setTeams] = useState<MatchTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.get(`${API_URL}/leaderboard/${userId}/teams`);
                setTeams(response.data.teams);
            } catch (error) {
                console.error("Fetch user teams error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchTeams();
    }, [userId]);

    const renderItem = ({ item, index }: { item: MatchTeam, index: number }) => (
        <TouchableOpacity
            style={styles.teamCard}
            onPress={() => router.push({
                pathname: '/team-details',
                params: { teamId: item._id, matchId: item.matchId, readonly: 'true' }
            })}
        >
            <View style={styles.teamHeader}>
                <Text style={styles.teamNumber}>TEAM {teams.length - index}</Text>
                <Text style={styles.pointsText}>{item.totalPoints} pts</Text>
            </View>
            <View style={styles.teamDetails}>
                <Text style={styles.detailText}>👥 {item.players.length}/11 Players</Text>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: `${userName}'s Teams`,
                headerTintColor: '#1e293b'
            }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1e293b" />
                </View>
            ) : teams.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>This user hasn't created any teams yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={teams}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 15 },
    teamCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6'
    },
    teamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    teamNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b'
    },
    pointsText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#4caf50'
    },
    teamDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    detailText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500'
    },
    emptyText: {
        color: '#64748b',
        fontSize: 16,
        fontStyle: 'italic'
    }
});
