
import {Movie_Battle} from './game.js';

// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Set up Express and HTTP server
const app = express();
const server = http.createServer(app);

// Set up Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow React frontend
    methods: ["GET", "POST"]
  }
});

let messages = [];

let players = {};
let lobbies = {};
let matches = {};

// Define a route for testing
app.get('/', (req, res) => {
  res.send('Socket.IO server is running');
});

// Handle WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  players[socket.id] = {name: 'guest', lobby: null};
  console.log(players)

  // Listen for messages from the client
  socket.on('send_message', (data) => {
    console.log('Message received:', data);

    messages.push(data);

    // Send a message back to all clients
    io.emit('messages', messages);
  });


  socket.on('create_lobby', () => {
    while (true) {
      let code = generateCode(4);
      if (Object.keys(lobbies).includes(code) === false) {
        lobbies[code] = [socket.id];
        players[socket.id].lobby = code;

        console.log(`Lobby created: ${code}`)
        break
      }
    }
  });

  socket.on('update_name', (name) => {
    players[socket.id].name = name
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    let id = socket.id;
    delete players.id;
    console.log('User disconnected:', socket.id);
    console.log(players)
  });
});

// Start the server
server.listen(4000, () => {
  console.log('Server is listening on port 4000');
});








function generateCode(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}