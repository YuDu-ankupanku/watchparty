import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { GiftedChat, IMessage, Send, Bubble, InputToolbar, Avatar, TimeProps } from 'react-native-gifted-chat';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types/user';

interface ChatProps {
  roomId: string;
}

interface ChatUser {
  _id: string;
  name: string;
  avatar?: string;
}

const WebChat = ({ messages, onSend, user }: { messages: IMessage[], onSend: (messages: IMessage[]) => void, user: ChatUser }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend([{
        _id: Date.now().toString(),
        text: text.trim(),
        createdAt: new Date(),
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
      }]);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
        {messages.map((message) => (
          <div
            key={message._id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: message.user._id === user._id ? 'flex-end' : 'flex-start',
              marginTop: 4,
              marginBottom: 4,
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            <div
              style={{
                backgroundColor: message.user._id === user._id ? '#007AFF' : '#E5E5EA',
                borderRadius: 16,
                padding: 8,
                maxWidth: '70%',
              }}
            >
              <div style={{ color: message.user._id === user._id ? '#fff' : '#000' }}>
                {message.text}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderTop: '1px solid #E5E5EA',
        backgroundColor: '#fff',
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          style={{
            flex: 1,
            backgroundColor: '#F2F2F7',
            borderRadius: 20,
            padding: '8px 15px',
            marginRight: 10,
            fontSize: 16,
            minHeight: 40,
            border: 'none',
            resize: 'none',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="send" size={24} color="#007AFF" />
        </button>
      </div>
    </div>
  );
};

export const Chat = ({ roomId }: ChatProps) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: IMessage) => {
      setMessages(previousMessages => GiftedChat.append(previousMessages, [message]));
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    if (!socket || !user) return;

    const message = newMessages[0];
    const messageToSend = {
      ...message,
      user: {
        _id: user._id,
        name: user.username,
        avatar: user.avatar,
      },
    };

    socket.emit('send_message', {
      roomId,
      message: messageToSend,
    });

    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
  }, [socket, roomId, user]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <WebChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user?._id || '',
            name: user?.username || '',
            avatar: user?.avatar,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: user?._id || '',
          name: user?.username || '',
          avatar: user?.avatar,
        }}
        renderSend={(props) => (
          <Send {...props}>
            <View style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#007AFF" />
            </View>
          </Send>
        )}
        renderBubble={(props) => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: {
                backgroundColor: '#007AFF',
              },
              left: {
                backgroundColor: '#E5E5EA',
              },
            }}
          />
        )}
        renderTime={({ currentMessage }) => (
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {new Date(currentMessage?.createdAt || '').toLocaleTimeString()}
            </Text>
          </View>
        )}
        alwaysShowSend
        infiniteScroll
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginRight: 10,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    minHeight: 40,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  timeContainer: {
    padding: 5,
  },
}); 