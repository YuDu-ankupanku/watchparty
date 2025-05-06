import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { joinRoomById } from '@/api/rooms';
import { X, LogIn } from 'lucide-react-native';

export default function JoinRoomScreen() {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await joinRoomById(roomId.trim());
      router.push(`/room/${roomId.trim()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room. The room may not exist or could be locked.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Join a Room</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Enter the Room ID to join an existing watch party
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Room ID"
              placeholderTextColor="#8F8F8F"
              value={roomId}
              onChangeText={setRoomId}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.joinButton, (!roomId.trim() || isLoading) && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={!roomId.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <LogIn size={20} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join Room</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.createRoomContainer}>
          <Text style={styles.createRoomText}>Or create your own room</Text>
          <TouchableOpacity style={styles.createRoomButton} onPress={() => router.push('/create-room')}>
            <Text style={styles.createRoomButtonText}>Create a Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#121214',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
    marginTop: 20,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#AEAEAE',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1A1A1D',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#7471FF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  joinButtonDisabled: {
    backgroundColor: '#5553ac',
    opacity: 0.7,
  },
  joinButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#241E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FF5252',
  },
  createRoomContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 24,
  },
  createRoomText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#8F8F8F',
    marginBottom: 16,
  },
  createRoomButton: {
    backgroundColor: '#212124',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createRoomButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});