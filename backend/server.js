require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

// Config
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Store room state
const rooms = new Map();

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.id);
  
  // Join room
  socket.on('join_room', ({ roomId, userId }) => {
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        members: [],
        messages: [],
        currentTime: 0,
        isPlaying: false,
      });
    }
    
    const room = rooms.get(roomId);
    
    // Add user to room if not already in it
    if (!room.members.some(member => member.id === userId)) {
      room.members.push({
        id: userId,
        username: socket.user.username,
      });
    }
    
    // Notify all users in the room
    io.to(roomId).emit('room_update', {
      members: room.members,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
    });
  });
  
  // Leave room
  socket.on('leave_room', ({ roomId, userId }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.members = room.members.filter(member => member.id !== userId);
      
      if (room.members.length === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit('room_update', {
          members: room.members,
          currentTime: room.currentTime,
          isPlaying: room.isPlaying,
        });
      }
    }
    
    socket.leave(roomId);
  });
  
  // Video control events
  socket.on('video_control', ({ roomId, action, time }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      
      switch (action) {
        case 'play':
          room.isPlaying = true;
          break;
        case 'pause':
          room.isPlaying = false;
          break;
        case 'seek':
          room.currentTime = time;
          break;
      }
      
      socket.to(roomId).emit('video_control', { action, time });
    }
  });
  
  // Chat messages
  socket.on('send_message', ({ roomId, message }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.messages.push(message);
      
      // Keep last 100 messages
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }
      
      socket.to(roomId).emit('receive_message', message);
    }
  });
  
  // Time sync
  socket.on('sync_request', ({ roomId }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      socket.emit('sync_response', {
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
      });
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id);
    
    rooms.forEach((room, roomId) => {
      const userInRoom = room.members.some(member => member.id === socket.user.id);
      
      if (userInRoom) {
        room.members = room.members.filter(member => member.id !== socket.user.id);
        
        if (room.members.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('room_update', {
            members: room.members,
            currentTime: room.currentTime,
            isPlaying: room.isPlaying,
          });
        }
      }
    });
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('YouTube Watch Party API is running');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});