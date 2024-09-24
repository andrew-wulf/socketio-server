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

// Define a route for testing
app.get('/', (req, res) => {
  res.send('Socket.IO server is running');
});

// Handle WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for messages from the client
  socket.on('send_message', (data) => {
    console.log('Message received:', data);

    messages.push(data);

    // Send a message back to all clients
    io.emit('messages', messages);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(4000, () => {
  console.log('Server is listening on port 4000');
});





