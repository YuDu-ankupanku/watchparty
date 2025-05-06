const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const User = require('../models/User');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Create a new room
router.post('/', auth, async (req, res) => {
  try {
    const { name, videoUrl, isLocked } = req.body;
    
    const room = new Room({
      name,
      videoUrl,
      host: req.user._id,
      isLocked: isLocked || false,
      members: [req.user._id],
      currentTime: 0,
      isPlaying: false,
    });
    
    await room.save();
    
    // Populate host data
    await room.populate('host', 'username email');
    
    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active (public) rooms
router.get('/active', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ isLocked: false })
      .populate('host', 'username')
      .sort({ createdAt: -1 });
    
    // Add member count to each room
    const roomsWithMemberCount = rooms.map(room => {
      return {
        ...room.toObject(),
        memberCount: room.members.length,
      };
    });
    
    res.json(roomsWithMemberCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent rooms the user has joined
router.get('/recent', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('host', 'username')
      .sort({ updatedAt: -1 })
      .limit(10);
    
    // Add member count to each room
    const roomsWithMemberCount = rooms.map(room => {
      return {
        ...room.toObject(),
        memberCount: room.members.length,
      };
    });
    
    res.json(roomsWithMemberCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific room by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('host', 'username email')
      .populate('members', 'username');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if room is locked and user is not a member
    if (room.isLocked && !room.members.some(member => member._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'This room is private' });
    }
    
    // Add member count
    const roomWithMemberCount = {
      ...room.toObject(),
      memberCount: room.members.length,
    };
    
    res.json(roomWithMemberCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/:id/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if room is locked
    if (room.isLocked && room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This room is private' });
    }
    
    // Add user to members if not already a member
    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }
    
    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a room
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Remove user from members
    room.members = room.members.filter(
      member => member.toString() !== req.user._id.toString()
    );
    
    // If no members left, delete the room
    if (room.members.length === 0) {
      await Room.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Room deleted' });
    }
    
    // If host leaves, assign new host
    if (room.host.toString() === req.user._id.toString() && room.members.length > 0) {
      room.host = room.members[0];
    }
    
    await room.save();
    
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room (host only)
router.put('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is the host
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can update the room' });
    }
    
    const { name, videoUrl, isLocked } = req.body;
    
    if (name) room.name = name;
    if (videoUrl) room.videoUrl = videoUrl;
    if (isLocked !== undefined) room.isLocked = isLocked;
    
    await room.save();
    
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a user from room (host only)
router.post('/:id/remove/:userId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is the host
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can remove users' });
    }
    
    // Remove user from members
    room.members = room.members.filter(
      member => member.toString() !== req.params.userId
    );
    
    await room.save();
    
    res.json({ message: 'User removed from room' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;