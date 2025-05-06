import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import { GiftedChat, IMessage, Message, Bubble, InputToolbar } from 'react-native-gifted-chat';
import { getRoomById } from '@/api/rooms';
import { Room } from '@/types/room';
import { X, Play, Pause, Users, Send, Menu, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react-native';

interface ChatMessage extends IMessage {
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const webViewRef = useRef<WebView>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(true);
  const chatHeight = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    const loadRoom = async () => {
      try {
        setError(null);
        const roomData = await getRoomById(id);
        setRoom(roomData);
        setIsHost(roomData.host._id === user?._id);
      } catch (err) {
        setError('Failed to load room');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [id, user]);

  useEffect(() => {
    if (!socket || !isConnected || !id || !user) return;

    // Join room
    socket.emit('join_room', { roomId: id, userId: user._id });

    // Listen for room updates
    socket.on('room_update', (data) => {
      setMembers(data.members);
    });

    // Listen for chat messages
    socket.on('receive_message', (message) => {
      setChatMessages(previousMessages => 
        GiftedChat.append(previousMessages, [message])
      );
    });

    // Listen for video control events
    socket.on('video_control', (data) => {
      if (data.action === 'play') {
        webViewRef.current?.injectJavaScript('player.playVideo(); true;');
        setIsPlaying(true);
      } else if (data.action === 'pause') {
        webViewRef.current?.injectJavaScript('player.pauseVideo(); true;');
        setIsPlaying(false);
      } else if (data.action === 'seek') {
        webViewRef.current?.injectJavaScript(`player.seekTo(${data.time}, true); true;`);
      }
    });

    // Clean up on unmount
    return () => {
      socket.emit('leave_room', { roomId: id, userId: user._id });
      socket.off('room_update');
      socket.off('receive_message');
      socket.off('video_control');
    };
  }, [socket, isConnected, id, user]);

  const toggleChatVisibility = () => {
    Animated.timing(chatHeight, {
      toValue: showChat ? 0 : 300,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowChat(!showChat);
  };

  const handlePlay = () => {
    if (!isHost) return;
    webViewRef.current?.injectJavaScript('player.playVideo(); true;');
    socket.emit('video_control', { roomId: id, action: 'play' });
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!isHost) return;
    webViewRef.current?.injectJavaScript('player.pauseVideo(); true;');
    socket.emit('video_control', { roomId: id, action: 'pause' });
    setIsPlaying(false);
  };

  const handleSendMessage = (messages: IMessage[]) => {
    if (!socket || !isConnected || !user) return;
    
    const message = messages[0];
    const chatMessage = {
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
      user: {
        _id: user._id,
        name: user.username,
      },
    };
    
    socket.emit('send_message', { roomId: id, message: chatMessage });
    setChatMessages(previousMessages => GiftedChat.append(previousMessages, [chatMessage]));
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'stateChange') {
        if (data.state === 1) {
          setIsPlaying(true);
        } else if (data.state === 2) {
          setIsPlaying(false);
        }
      }
    } catch (err) {
      console.error('Error parsing message from WebView:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7471FF" />
        <Text style={styles.loadingText}>Joining room...</Text>
      </View>
    );
  }

  if (error || !room) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Room not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
  };

  const videoId = getYoutubeVideoId(room.videoUrl);

  const youtubeHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background-color: #000; }
        #player { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="player"></div>
      <script>
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        var player;
        function onYouTubeIframeAPIReady() {
          player = new YT.Player('player', {
            videoId: '${videoId}',
            playerVars: {
              'playsinline': 1,
              'controls': 0,
              'rel': 0,
              'fs': 0
            },
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
        }

        function onPlayerReady(event) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ready'
          }));
        }

        function onPlayerStateChange(event) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'stateChange',
            state: event.data
          }));
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
        <TouchableOpacity 
          style={styles.membersButton}
          onPress={() => setShowMembers(!showMembers)}
        >
          <Users size={20} color="#FFFFFF" />
          <Text style={styles.membersCount}>{members.length || 1}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: youtubeHTML }}
          onMessage={onMessage}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>

      {isHost && (
        <View style={styles.controls}>
          {isPlaying ? (
            <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
              <Pause size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.controlButton} onPress={handlePlay}>
              <Play size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {!isHost && (
        <View style={styles.viewerNotice}>
          <Text style={styles.viewerNoticeText}>Only the host can control playback</Text>
        </View>
      )}

      <View style={styles.chatContainer}>
        <TouchableOpacity 
          style={styles.chatToggle} 
          onPress={toggleChatVisibility}
        >
          <MessageSquare size={20} color="#FFFFFF" />
          <Text style={styles.chatToggleText}>Chat</Text>
          {showChat ? (
            <ChevronDown size={20} color="#FFFFFF" />
          ) : (
            <ChevronUp size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <Animated.View style={[styles.chatContent, { height: chatHeight }]}>
          <GiftedChat
            messages={chatMessages}
            onSend={(messages) => handleSendMessage(messages)}
            user={{
              _id: user?._id || '',
              name: user?.username || '',
            }}
            renderBubble={(props) => (
              <Bubble
                {...props}
                wrapperStyle={{
                  right: {
                    backgroundColor: '#7471FF',
                  },
                  left: {
                    backgroundColor: '#2A2A2D',
                  },
                }}
                textStyle={{
                  right: {
                    color: '#FFFFFF',
                    fontFamily: 'Inter-Regular',
                  },
                  left: {
                    color: '#FFFFFF',
                    fontFamily: 'Inter-Regular',
                  },
                }}
              />
            )}
            renderInputToolbar={(props) => (
              <InputToolbar
                {...props}
                containerStyle={styles.inputToolbar}
              />
            )}
            minInputToolbarHeight={50}
            renderAvatar={null}
            alwaysShowSend
            renderSend={(props) => (
              <Send
                {...props}
                containerStyle={styles.sendButton}
              >
                <Send color="#7471FF" size={24} />
              </Send>
            )}
            textInputStyle={styles.chatInput}
            timeTextStyle={{
              right: { color: '#AEAEAE' },
              left: { color: '#AEAEAE' }
            }}
            placeholderTextColor="#8F8F8F"
            placeholder="Type a message..."
          />
        </Animated.View>
      </View>

      {showMembers && (
        <View style={styles.membersModal}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>Room Members</Text>
            <TouchableOpacity onPress={() => setShowMembers(false)}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={members.length > 0 ? members : [{ _id: user?._id, username: user?.username, isHost: isHost }]}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.memberItem}>
                <Text style={styles.memberName}>{item.username}</Text>
                {item.isHost && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>Host</Text>
                  </View>
                )}
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121214',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121214',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#FF5252',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2A2A2D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1D',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  headerLeft: {
    width: 40,
  },
  roomName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  membersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(116, 113, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membersCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  webview: {
    backgroundColor: '#000000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1A1A1D',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7471FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  viewerNotice: {
    backgroundColor: 'rgba(116, 113, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  viewerNoticeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#AEAEAE',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  chatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  chatToggleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
  chatContent: {
    flex: 1,
  },
  inputToolbar: {
    backgroundColor: '#212124',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2D',
  },
  chatInput: {
    color: '#FFFFFF',
    backgroundColor: '#1A1A1D',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginRight: 8,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  membersModal: {
    position: 'absolute',
    top: 60,
    right: 0,
    width: 250,
    maxHeight: 300,
    backgroundColor: '#1A1A1D',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 8,
    margin: 16,
    zIndex: 10,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  membersTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  memberName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  hostBadge: {
    backgroundColor: 'rgba(116, 113, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  hostBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#7471FF',
  },
});