const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

// Serve the game file directly
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── ROOMS ──
const rooms = {}; // roomCode -> { players: {}, enemies: [], started: false }

function makeCode() {
  return Math.random().toString(36).slice(2,8).toUpperCase();
}

function getRoom(code) {
  if (!rooms[code]) {
    rooms[code] = {
      code,
      players: {},
      hostId: null,
      started: false,
      createdAt: Date.now()
    };
  }
  return rooms[code];
}

// Clean up empty rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rooms).forEach(code => {
    const room = rooms[code];
    const empty = Object.keys(room.players).length === 0;
    const old = now - room.createdAt > 60 * 60 * 1000; // 1 hour
    if (empty || old) delete rooms[code];
  });
}, 5 * 60 * 1000);

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  let currentRoom = null;

  // ── CREATE ROOM ──
  socket.on('create_room', (data, cb) => {
    const code = makeCode();
    const room = getRoom(code);
    room.hostId = socket.id;
    room.players[socket.id] = {
      id: socket.id,
      name: data.name || 'Player',
      animal: data.animal || 'wolf',
      em: data.em || '🐺',
      x: 150, z: 150,
      hp: data.hp || 100,
      maxHp: data.hp || 100,
      level: 1,
      score: 0,
      facing: 0,
      isHost: true,
      color: data.color || 0x6b7280
    };
    socket.join(code);
    currentRoom = code;
    console.log(`Room created: ${code} by ${socket.id}`);
    cb({ success: true, code, players: room.players });
  });

  // ── JOIN ROOM ──
  socket.on('join_room', (data, cb) => {
    const code = data.code.toUpperCase();
    if (!rooms[code]) {
      return cb({ success: false, error: 'Room not found! Check the code.' });
    }
    const room = rooms[code];
    if (Object.keys(room.players).length >= 8) {
      return cb({ success: false, error: 'Room is full (max 8 players).' });
    }
    room.players[socket.id] = {
      id: socket.id,
      name: data.name || 'Player',
      animal: data.animal || 'wolf',
      em: data.em || '🐺',
      x: 150 + Math.random()*20-10,
      z: 150 + Math.random()*20-10,
      hp: data.hp || 100,
      maxHp: data.hp || 100,
      level: 1,
      score: 0,
      facing: 0,
      isHost: false,
      color: data.color || 0x6b7280
    };
    socket.join(code);
    currentRoom = code;
    // Tell everyone else about the new player
    socket.to(code).emit('player_joined', room.players[socket.id]);
    console.log(`${socket.id} joined room ${code}`);
    cb({ success: true, code, players: room.players, hostId: room.hostId });
  });

  // ── PLAYER MOVE ──
  socket.on('player_move', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    if (!room.players[socket.id]) return;
    // Update server-side position
    room.players[socket.id].x = data.x;
    room.players[socket.id].z = data.z;
    room.players[socket.id].facing = data.facing;
    room.players[socket.id].hp = data.hp;
    room.players[socket.id].score = data.score;
    room.players[socket.id].level = data.level;
    // Broadcast to others in room
    socket.to(currentRoom).emit('player_moved', {
      id: socket.id,
      x: data.x,
      z: data.z,
      facing: data.facing,
      hp: data.hp,
      maxHp: data.maxHp,
      score: data.score,
      level: data.level,
      invisible: data.invisible || false,
      raging: data.raging || false
    });
  });

  // ── PLAYER ACTION (attack, special, etc.) ──
  socket.on('player_action', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('player_action', {
      id: socket.id,
      type: data.type,
      x: data.x,
      z: data.z
    });
  });

  // ── CHAT ──
  socket.on('chat', (data) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    const player = room && room.players[socket.id];
    const name = player ? player.name : 'Unknown';
    io.to(currentRoom).emit('chat', {
      id: socket.id,
      name,
      em: player ? player.em : '🐾',
      msg: String(data.msg).slice(0, 120)
    });
  });

  // ── PLAYER DIED ──
  socket.on('player_died', () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('player_died', { id: socket.id });
  });

  // ── GET ROOM INFO ──
  socket.on('get_room', (code, cb) => {
    const r = rooms[code.toUpperCase()];
    if (!r) return cb(null);
    cb({ code: r.code, playerCount: Object.keys(r.players).length, hostId: r.hostId });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    delete room.players[socket.id];
    io.to(currentRoom).emit('player_left', { id: socket.id });
    // Transfer host if needed
    if (room.hostId === socket.id) {
      const remaining = Object.keys(room.players);
      if (remaining.length > 0) {
        room.hostId = remaining[0];
        room.players[remaining[0]].isHost = true;
        io.to(currentRoom).emit('new_host', { id: remaining[0] });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🌍 Wild World 3D Server running on port ${PORT}`);
  console.log(`🔗 Open: http://localhost:${PORT}\n`);
});
