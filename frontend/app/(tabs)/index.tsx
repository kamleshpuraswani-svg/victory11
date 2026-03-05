import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getAuthToken, clearAuthData } from '../../utils/storage';
import axios from 'axios';
import { API_URL } from '../../constants/Config';

const ALL_MATCHES: any[] = []; // Initialize empty, fetch from DB

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
          router.replace('/');
          return;
        }

        // Fetch real matches from API
        try {
          const response = await axios.get(`${API_URL}/matches/upcoming`);
          if (response.data && response.data.matches) {
            setMatches(response.data.matches);
          }
        } catch (apiErr) {
          console.error('Failed to fetch matches from API, using fallback:', apiErr);
          // Fallback is already in state as ALL_MATCHES
        }

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Upcoming Matches (LIVE)' }} />
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={async () => {
              await clearAuthData();
              router.replace('/login');
            }} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>SIGN OUT</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MICL - Upcoming Matches</Text>
            <Text style={styles.headerTagline}>Big Wins. Big Thrills. Play MICL 2026! 🏏🏆</Text>
          </View>
        }
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
              <View style={[
                styles.statusBadge,
                item.status === 'LIVE' && styles.statusBadgeLive,
                item.status === 'COMPLETED' && styles.statusBadgeCompleted
              ]}>
                <Text style={[
                  styles.statusText,
                  item.status === 'LIVE' && styles.statusTextLive,
                  item.status === 'COMPLETED' && styles.statusTextCompleted
                ]}>
                  {item.status || 'UPCOMING'}
                </Text>
              </View>
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
              <View>
                <Text style={styles.matchDate}>{item.date || 'Soon'}</Text>
                <Text style={styles.venueText}>🏟️ {item.venue || 'TBD'}</Text>
              </View>
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
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    backgroundColor: '#1e293b',
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24', // Gold Color
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  headerTagline: {
    fontSize: 14,
    color: '#cbd5e1', // Light grayish Slate
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    fontStyle: 'italic'
  },
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
  leagueName: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e1f5fe'
  },
  statusBadgeLive: { backgroundColor: '#fef3c7' },
  statusBadgeCompleted: { backgroundColor: '#f0fdf4' },
  statusText: { fontSize: 10, fontWeight: '900', color: '#0288d1' },
  statusTextLive: { color: '#d97706' },
  statusTextCompleted: { color: '#16a34a' },
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
  venueText: { fontSize: 11, color: '#64748b', marginTop: 2 },
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
  },
  logoutBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    marginBottom: 8
  },
  logoutText: {
    color: '#fbbf24',
    fontWeight: '800',
    fontSize: 10
  }
});
