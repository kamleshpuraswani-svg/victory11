import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getAuthToken } from '../utils/storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.183:5001/api';

const ALL_MATCHES = [
    {
        "id": "match_1",
        "league": "COLLAB SERIES",
        "date": "Fri, 13 Mar",
        "time": "8 PM - 10 PM",
        "teams": ["Collab Kings", "Collab Titans"]
    },
    {
        "id": "match_2",
        "league": "COLLAB SERIES",
        "date": "Fri, 13 Mar",
        "time": "10 PM - 12 AM",
        "teams": ["300 Dakaits", "MI Warriors"]
    },
    {
        "id": "match_3",
        "league": "COLLAB SERIES",
        "date": "Sun, 15 Mar",
        "time": "5 PM - 7 PM",
        "teams": ["Collab Kings", "300.EXE"]
    },
    {
        "id": "match_4",
        "league": "COLLAB SERIES",
        "date": "Sun, 15 Mar",
        "time": "7 PM - 9 PM",
        "teams": ["MI Smashers", "300 Dakaits"]
    },
    {
        "id": "match_5",
        "league": "COLLAB SERIES",
        "date": "Fri, 20 Mar",
        "time": "7 PM - 8:30 PM",
        "teams": ["MI Smashers", "300.EXE"]
    },
    {
        "id": "match_6",
        "league": "COLLAB SERIES",
        "date": "Fri, 20 Mar",
        "time": "8:45 PM - 10:15 PM",
        "teams": ["MI Warriors", "Collab Kings"]
    },
    {
        "id": "match_7",
        "league": "COLLAB SERIES",
        "date": "Fri, 20 Mar",
        "time": "10:30 PM - 12 AM",
        "teams": ["300 Dakaits", "Collab Titans"]
    },
    {
        "id": "match_8",
        "league": "COLLAB SERIES",
        "date": "Sat, 21 Mar",
        "time": "5 PM - 7 PM",
        "teams": ["300.EXE", "MI Warriors"]
    },
    {
        "id": "match_9",
        "league": "COLLAB SERIES",
        "date": "Sat, 21 Mar",
        "time": "7 PM - 9 PM",
        "teams": ["MI Smashers", "Collab Titans"]
    },
    {
        "id": "match_10",
        "league": "SEMIFINALS",
        "date": "Fri, 27 Mar",
        "time": "8 PM - 10 PM",
        "teams": ["Rank 1", "Rank 4"]
    },
    {
        "id": "match_11",
        "league": "SEMIFINALS",
        "date": "Fri, 27 Mar",
        "time": "10 PM - 12 AM",
        "teams": ["Rank 2", "Rank 3"]
    },
    {
        "id": "match_12",
        "league": "GRAND FINALE",
        "date": "Sat, 28 Mar",
        "time": "8 PM - 11 PM",
        "teams": ["Winner SF1", "Winner SF2"]
    }
];

export default function MatchList() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [matches, setMatches] = useState(ALL_MATCHES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function initialize() {
            try {
                const token = await getAuthToken();
                if (!token) {
                    router.replace('/login');
                    return;
                }

                // Attempt to fetch fresh data from backend, fallback to hardcoded list if it fails
                /*
                try {
                    const response = await axios.get(`${API_URL}/matches/upcoming`);
                    if (response.data && Array.isArray(response.data.matches) && response.data.matches.length > 0) {
                        setMatches(response.data.matches);
                    }
                } catch (apiError) {
                    console.warn('Could not fetch matches from server, using local data', apiError);
                }
                */

                setIsReady(true);
            } catch (error) {
                console.error('Initialization error', error);
                router.replace('/login');
            } finally {
                setLoading(false);
            }
        }
        initialize();
    }, []);

    if (loading || !isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading matches...</Text>
            </View>
        );
    }

    if (matches.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
                <Text style={{ color: '#666' }}>No upcoming matches found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Upcoming Matches (LIVE)' }} />
            <FlatList
                data={matches}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.matchCard}
                        onPress={() => router.push({
                            pathname: '/contests',
                            params: { matchId: item.id, teamA: item.teams[0], teamB: item.teams[1] }
                        })}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.leagueName}>{item.league || 'Series'}</Text>
                            <Text style={styles.matchTime}>{item.time || 'TBD'}</Text>
                        </View>

                        <View style={styles.matchMain}>
                            <View style={styles.teamContainer}>
                                <Text style={styles.teamText}>{item.teams?.[0] || 'TBD'}</Text>
                            </View>
                            <Text style={styles.vsText}>VS</Text>
                            <View style={styles.teamContainer}>
                                <Text style={styles.teamText}>{item.teams?.[1] || 'TBD'}</Text>
                            </View>
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.matchDate}>{item.date || 'Soon'}</Text>
                            <TouchableOpacity
                                style={styles.myTeamsBtn}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    router.push({
                                        pathname: '/my-teams',
                                        params: { matchId: item.id }
                                    });
                                }}
                            >
                                <Text style={styles.myTeamsBtnText}>MY TEAMS</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 15 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    matchCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 5,
        borderLeftColor: '#4caf50'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
        paddingBottom: 10,
        marginBottom: 10
    },
    leagueName: { fontSize: 13, fontWeight: '600', color: '#777', textTransform: 'uppercase' },
    matchTime: { fontSize: 12, color: '#4caf50', fontWeight: 'bold' },
    matchMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10
    },
    teamContainer: { flex: 1, alignItems: 'center' },
    teamText: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center' },
    vsText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
        backgroundColor: '#e91e63',
        width: 30,
        height: 30,
        borderRadius: 15,
        textAlign: 'center',
        lineHeight: 30,
        marginHorizontal: 10
    },
    cardFooter: {
        backgroundColor: '#f9f9f9',
        marginHorizontal: -15,
        marginBottom: -15,
        padding: 10,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    matchDate: { fontSize: 13, color: '#555', fontWeight: '500' },
    myTeamsBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4caf50',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    myTeamsBtnText: {
        color: '#4caf50',
        fontSize: 12,
        fontWeight: 'bold'
    }
});
