import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Play, Users, Clock } from 'lucide-react-native';
import { fetchRecentRooms } from '@/api/rooms';
import { Room } from '@/types/room';

export default function HomeScreen() {
  const { user } = useAuth();
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecentRooms = async () => {
    try {
      setError(null);
      const rooms = await fetchRecentRooms();
      setRecentRooms(rooms);
    } catch (err) {
      setError('Failed to load recent rooms');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecentRooms();
  };

  useEffect(() => {
    loadRecentRooms();
  }, []);

  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/room/${item._id}`)}
    >
      <View style={styles.roomCardContent}>
        <View style={styles.thumbnailContainer}>
          <Play size={32} color="#FFFFFF" style={styles.playIcon} />
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.roomMeta}>
            <View style={styles.metaItem}>
              <Users size={14} color="#AEAEAE" />
              <Text style={styles.metaText}>{item.memberCount} viewers</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color="#AEAEAE" />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.subtitle}>Ready to watch together?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Rooms</Text>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadRecentRooms} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#7471FF" style={styles.loader} />
        ) : recentRooms.length > 0 ? (
          <FlatList
            data={recentRooms}
            renderItem={renderRoomItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.roomsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#7471FF"
                colors={['#7471FF']}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent rooms found</Text>
            <TouchableOpacity
              style={styles.createRoomButton}
              onPress={() => router.push('/create-room')}
            >
              <Text style={styles.createRoomText}>Create a Room</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.joinSection}>
        <Text style={styles.joinTitle}>Join a room</Text>
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => router.push('/join-room')}
        >
          <Text style={styles.joinButtonText}>Enter Room ID</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    padding: 16,
  },
  welcomeSection: {
    marginTop: 10,
    marginBottom: 24,
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#AEAEAE',
  },
  username: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#FFFFFF',
    marginVertical: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8F8F8F',
  },
  section: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  roomsList: {
    paddingBottom: 16,
  },
  roomCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  roomCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  thumbnailContainer: {
    width: 84,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#212124',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    opacity: 0.7,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#AEAEAE',
    marginLeft: 4,
  },
  loader: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#8F8F8F',
    marginBottom: 16,
  },
  createRoomButton: {
    backgroundColor: '#7471FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createRoomText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  joinSection: {
    padding: 16,
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    marginBottom: 16,
  },
  joinTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#212124',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#241E1E',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FF5252',
    marginBottom: 8,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A2D',
    borderRadius: 4,
  },
  retryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});