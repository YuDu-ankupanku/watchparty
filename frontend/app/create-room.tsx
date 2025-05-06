import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { createRoom } from '@/api/rooms';
import { X, Youtube } from 'lucide-react-native';

export default function CreateRoomScreen() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    if (!videoUrl.trim()) {
      setError('Video URL is required');
      return;
    }

    // Basic validation for YouTube URL
    if (!videoUrl.includes('youtube.com/watch?v=') && !videoUrl.includes('youtu.be/')) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const newRoom = await createRoom({
        name: roomName,
        videoUrl,
        isLocked: isPrivate,
      });
      
      // Navigate to the newly created room
      router.push(`/room/${newRoom._id}`);
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create a Watch Room</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Room Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a name for your room"
              placeholderTextColor="#8F8F8F"
              value={roomName}
              onChangeText={setRoomName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>YouTube Video URL</Text>
            <View style={styles.urlInputContainer}>
              <Youtube size={20} color="#FF0000" style={styles.youtubeIcon} />
              <TextInput
                style={styles.urlInput}
                placeholder="Paste YouTube URL here"
                placeholderTextColor="#8F8F8F"
                value={videoUrl}
                onChangeText={setVideoUrl}
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.helperText}>
              Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
            </Text>
          </View>

          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.switchLabel}>Private Room</Text>
              <Text style={styles.switchDescription}>
                Only people with the room ID can join
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#2A2A2D', true: '#5553ac' }}
              thumbColor={isPrivate ? '#7471FF' : '#AEAEAE'}
            />
          </View>

          <View style={styles.hostInfoContainer}>
            <Text style={styles.hostInfoLabel}>You will be the host</Text>
            <Text style={styles.hostInfoDescription}>
              As the host, you'll have control over playback and can remove users from the room.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateRoom}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating Room...' : 'Create Room'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#121214',
  },
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  contentContainer: {
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
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
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
  },
  urlInputContainer: {
    backgroundColor: '#1A1A1D',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  youtubeIcon: {
    marginRight: 12,
  },
  urlInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  helperText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8F8F8F',
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1D',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  switchLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  switchDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8F8F8F',
    maxWidth: 250,
  },
  hostInfoContainer: {
    backgroundColor: 'rgba(116, 113, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7471FF',
  },
  hostInfoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hostInfoDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#AEAEAE',
  },
  createButton: {
    backgroundColor: '#7471FF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#5553ac',
    opacity: 0.7,
  },
  createButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#241E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FF5252',
  },
});