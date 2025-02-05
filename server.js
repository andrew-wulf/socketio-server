
import {Movie_Battle, Search} from './public/game.js'
import {Timer} from './public/timer.js'

// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// Set up Express and HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.use(express.static('public'));

// Set up Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://movie-battle.onrender.com"], // Allow React frontend
    methods: ["GET", "POST"],
  }
});


let players = {};
let sockets = {};
let lobbies = {};
let matches = {};

// Define a route for testing
app.get('/', (req, res) => {
  res.send('Socket.IO server is running');
});



const rooms = io.of("/").adapter.rooms;
const sids = io.of("/").adapter.sids;


// io.of("/").adapter.on("create-room", (room) => {
//   console.log(`room ${room} was created`);
// });

// io.of("/").adapter.on("join-room", (room, id) => {
//   console.log(`socket ${id} has joined room ${room}`);
// });




// Handle WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  io.to(socket.id).emit('login')


  socket.on('login', (storageID, nickname) => {
    console.log(storageID);
    console.log(Object.keys(players))
  
    if (storageID && Object.keys(players).includes(storageID)) {
      console.log('storageID match: ', storageID);
      players[storageID].socket = socket.id
      players[storageID].connected = true
      sockets[socket.id] = storageID
    }
  
    else {
      players[socket.id] = {name: 'guest', lobby: null, socket: socket.id, connected: true};
      sockets[socket.id] = socket.id
      console.log('setting storage id...')
      io.to(socket.id).emit('setStorageID', socket.id)
    }
  
    io.to(socket.id).emit('connected')
    //console.log('Player list: ', players);
  })


  socket.on('update_name', (nickname) => {
    let trueID = sockets[socket.id];
    console.log(`Name updated for user ${trueID}: ${nickname}`)
    if (players[trueID]) {
      players[trueID].name = nickname
    }
  })



  socket.on('create_lobby', () => {
    let trueID = sockets[socket.id];

    while (true) {
      let code = generateCode(4);
      if (Object.keys(lobbies).includes(code) === false) {
        let options = {
          lifelines: true,
          bans: false,
          hard_mode: false,
          random_start: true,
          random_type: 'popular',
          timer: 45,
        }
        lobbies[code] = {players: {}, messages: [], status: 'pre-game', game: null, options: options, timer: null};
        lobbies[code].players[trueID] = {name: players[trueID].name, ready: false, active: true}
        players[trueID].lobby = code;

        io.to(socket.id).emit('create-lobby-success', code);

        console.log(`Lobby created: ${code}`)
        console.log('players: ', players)
        break
      }
    }
  });

  socket.on('room_status', (code) => {
    io.to(socket.id).emit('room_update', lobbies[code])
  })

 

  socket.on('app_data', () => {
    let data = {players: players, sockets: sockets, lobbies: lobbies, matches: matches};
    io.to(socket.id).emit('app_data', data)
  })

  socket.on('view_lobbies', () => {
    io.to(socket.id).emit('lobbies_data', lobbies)
  })

  socket.on('join_lobby', (code) => {
    let trueID = sockets[socket.id]

    if (Object.keys(lobbies[code].players).length < 8) {
      players[trueID].lobby = code

      if (lobbies[code].status === 'active') {
        lobbies[code].players[trueID] = {name: players[trueID].name, ready: false, active: false}
      }
      else {
        lobbies[code].players[trueID] = {name: players[trueID].name, ready: false, active: true}
      }
    }
    

    io.to(socket.id).emit('join_success');
    io.to(code).emit('room_update', lobbies[code]);
    console.log(`Player ${trueID} joined lobby: ${lobbies[code]}`);
    console.log('player: ', players[trueID])
  })



  socket.on('join_channel', (code) => {
    socket.join(code);
  })

  socket.on('view_lobbies', () => {
    io.to(socket.id).emit('lobbies_data', lobbies)
  })


  // Listen for messages from the client
  socket.on('post_message', (msg, code) => {
    if (!lobbies[code]) {
      io.to(socket.id).emit('reset')
      return
    }

    let trueID = sockets[socket.id];
    lobbies[code].messages.push([trueID, msg])

    console.log(`Message sent by ${players[trueID].name} in room ${code}: "${msg}"`);


    // Send a message back to all clients
    io.to(code).emit('room_update', lobbies[code]);
  });


  socket.on('options_update', (code, key, value) => {
    if (lobbies[code]) {
      lobbies[code].options[key] = value
    }
    io.to(code).emit('room_update', lobbies[code]);
  })


  socket.on('start_match', (code) => {
    if (!lobbies[code]) {
      io.to(socket.id).emit('reset')
      return
    }

    let start_conditions = false;

    if (Object.keys(lobbies[code].players).length === 1) {
      start_conditions = true
    }
    else {
      let trueID = sockets[socket.id];
      lobbies[code].players[trueID].ready = !lobbies[code].players[trueID].ready
      console.log(trueID, ' ready: ', lobbies[code].players[trueID].ready)
      io.to(code).emit('room_update', lobbies[code])

      if (lobbies[code].start_type === 'player') {
        console.log('player start!')
      }

      if (Object.keys(lobbies[code].players).every(key => {return lobbies[code].players[key].ready === true})) {
        start_conditions = true
      }
    }


    if (start_conditions) {

      if (lobbies[code].options.random_start) {
        lobbies[code].status = 'active';
      }
      else {
        lobbies[code].status = 'first_pick'
      }
    
      Object.keys(lobbies[code].players).forEach(key => {
        lobbies[code].players[key].active = true
        lobbies[code].players[key].ready = false
      })

      let opts = lobbies[code].options
  
      lobbies[code].game = new Movie_Battle(lobbies[code].players, opts.lifelines, false, false, opts.random_start, opts.random_type)

      if (lobbies[code].options.timer) {
        lobbies[code].timer = new Timer(lobbies[code].options.timer)
      }
  
      setTimeout(() => {
        lobbies[code].game_data = lobbies[code].game.currentStatus();
        if (lobbies[code].timer) {
          console.log('Lobby ', code, ' has a timer.')
          if (lobbies[code].status === 'first_pick') {
            lobbies[code].timer.start(io, code, onFirstMovieFail)
          }
          else {
            lobbies[code].timer.start(io, code, onExpire)
          }
        }
        io.to(code).emit('room_update', lobbies[code])
      }, 1200)
    }

  })

  socket.on('first_pick', (code, arr) => {
    input_submit(io, code, arr, true)
  })

  socket.on('input_update', (val, code) => {
    if (!lobbies[code]) {
      io.to(socket.id).emit('reset')
      return
    }
    
    input_search(val, io, socket)
  })

  socket.on('input_submit', (code, arr) => {
    let trueID = sockets[socket.id];
    console.log(`Submit: ${trueID} | Room: ${code}`)

    if (!lobbies[code]) {
      io.to(socket.id).emit('reset')
      return
    }

    if (lobbies[code].game_data.running === false) {
      console.log('match ended, no longer accepting inputs.')
    }

    else {
      if (lobbies[code].game_data.current_id === trueID) {
        input_submit(io, code, arr)
      }
      else {
        console.log('submission invalid, current player id is ', lobbies[code].game_data.current_id)
      }
    }
  
  })


  //ids may be set up. setup game on server, input communicates. palyer object should contain all the info needed.



  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('socket disconnected: ', socket.id);
    
    let id = socket.id;
    let trueID = sockets[socket.id];
  
    players[trueID].connected = false;
    let lobbyID = players[trueID].lobby;

    
    console.log('players: ', players)

    if (lobbyID) {
      if (lobbies[lobbyID].status === 'pre-game' || lobbies[lobbyID].status === 'finished') {
        console.log('checking for absent players...')
        setTimeout(() =>{
          Object.keys(lobbies[lobbyID].players).forEach(trueID => {
            console.log(players[trueID])
            if (players[trueID].connected === false) {
              delete lobbies[lobbyID].players[trueID]
              players[trueID].lobby = null
              console.log(`removed absent player ${players[trueID].name} from pre-game lobby ${lobbyID}`)
            }
          });
          if (Object.keys(lobbies[lobbyID].players).length < 1) {
            delete lobbies[lobbyID]
            console.log('discarded empty room.')
          }
          io.to(lobbyID).emit('room_update', lobbies[lobbyID])
        }, 2000)
      }
    }
    delete sockets[socket.id]
  });


});




async function retrieve_comparison(mb, movie_obj) {
  let res = mb.compare_to_current(movie_obj);
  console.log(res)
}

async function input_search(val, io, socket) {
  let res = await Search(val, 'movie');
  io.to(socket.id).emit('recieve_input_update', val, res)
}

async function input_submit(io, code, arr, first_movie = false) {

    if (lobbies[code].timer.expired && arr) {
      return
    }
    lobbies[code].timer.stop()

    if (first_movie) {
      await lobbies[code].game.first_movie(arr);
    }
    else {
      await lobbies[code].game.compare_to_current(arr);
    }

    lobbies[code].game_data = lobbies[code].game.currentStatus();

    if (first_movie && lobbies[code].game_data.history.length > 0) {
      lobbies[code].status = 'active';
    }
    
    if (lobbies[code].game_data.running === false) {
      lobbies[code].status = 'finished'
      io.to(code).emit('room_update', lobbies[code]);
    }
    else {
        setTimeout(() => {
          if (lobbies[code].status === 'first_pick') {
            lobbies[code].timer.start(io, code, onFirstMovieFail);
          }
          else {
            lobbies[code].timer.start(io, code, onExpire);
          }
          io.to(code).emit('room_update', lobbies[code]);
        }, 1000)
      }
  
      if (lobbies[code].game_data.running === false) {
        lobbies[code].status = 'finished'
        handleLobbyCleanup(code)
      }
}

async function onExpire(io, code) {
  console.log('Sending fail signal...')
  input_submit(io, code, false)
}

async function onFirstMovieFail(io, code) {
  console.log('Sending fail signal...')
  input_submit(io, code, false, true)
}


function handleLobbyCleanup(code) {
  //leaving for now, may want to rematch

  console.log('----------- Server Clutter Check ---------- \n\n\n')
  console.log('SOCKETS: ', sockets)
  console.log('PLAYERS: ', players)
  console.log('LOBBIES', Object.keys(lobbies))

  // setTimeout(() => {
  //   delete lobbies[code]
  // }, 30000)
}

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








// Start the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
