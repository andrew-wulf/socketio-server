
const {Movie_Battle} = require('./game')

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
  io.to(socket.id).emit('get_id', socket.id);

  players[socket.id] = {name: 'guest', lobby: null};
  

  socket.on('update_name', (player_name) => {
    console.log(`Name updated for user ${socket.id}: ${player_name}`)
    players[socket.id].name = player_name
    console.log(players)
  })



  socket.on('create_lobby', () => {
    while (true) {
      let code = generateCode(4);
      if (Object.keys(lobbies).includes(code) === false) {
        lobbies[code] = [socket.id];
        players[socket.id].lobby = code;

        io.to(socket.id).emit('lobby_data', 
          {room: code,
            players: lobbies[code].map(id => {return [id, players[id].name]})
          }
        );

        console.log(`Lobby created: ${code}`)
        break
      }
    }
  });
 
  socket.on('view_lobbies', () => {
    io.to(socket.id).emit('lobbies_data', lobbies)
  })

  socket.on('join_lobbies', () => {
    io.to(socket.id).emit('lobbies_data', lobbies)
  })

  socket.on('_lobbies', () => {
    io.to(socket.id).emit('lobbies_data', lobbies)
  })


  // Listen for messages from the client
  socket.on('send_message', (data) => {
    console.log('Message received:', data);

    messages.push(data);

    // Send a message back to all clients
    io.emit('messages', messages);
  });



  // Handle disconnect
  socket.on('disconnect', () => {
    let id = socket.id;
    let lobbyID = players[id].lobby;

    if (lobbyID) {
      lobbies[lobbyID] = lobbies[lobbyID].filter(e => {return e !== id});
      if (lobbies[lobbyID].length < 1) {delete lobbies[lobbyID]}
    }

    delete players[id];
    console.log('User disconnected:', socket.id);
  });

  socket.on('get_info', () => {
    console.log('Users:');
    console.log(players);
    console.log('lobbies:');
    console.log(lobbies);
    console.log('Matches:');
    console.log(matches);
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