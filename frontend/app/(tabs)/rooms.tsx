import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { fetchActiveRooms } from '@/api/rooms';
import { Room } from '@/types/room';
import { Users, Play } from 'lucide-react-native';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      setError(null);
      const activeRooms = await fetchActiveRooms();
      setRooms(activeRooms);
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRooms();
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/room/${item._id}`)}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.memberCount}>
          <Users size={14} color="#FFFFFF" />
          <Text style={styles.memberCountText}>{item.memberCount}</Text>
        </View>
      </View>
      
      <View style={styles.videoPreview}>
        <Play size={32} color="#FFFFFF" style={styles.playIcon} />
      </View>
      
      <View style={styles.roomFooter}>
        <Text style={styles.hostName}>Hosted by {item.host.username}</Text>
        <Text style={styles.roomStatus}>
          {item.isLocked ? 'Private' : 'Public'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadRooms} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#7471FF" style={styles.loader} />
      ) : rooms.length > 0 ? (
        <FlatList
          data={rooms}
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
          <Text style={styles.emptyText}>No active rooms available</Text>
          <TouchableOpacity
            style={styles.createRoomButton}
            onPress={() => router.push('/create-room')}
          >
            <Text style={styles.createRoomText}>Create a Room</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    padding: 16,
  },
  roomsList: {
    paddingBottom: 16,
  },
  roomCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  roomName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(116, 113, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  videoPreview: {
    height: 160,
    backgroundColor: '#212124',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    opacity: 0.7,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  hostName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#AEAEAE',
  },
  roomStatus: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#7471FF',
    backgroundColor: 'rgba(116, 113, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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