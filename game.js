
const axios = require('axios');

class Movie_Battle {

  constructor(players, bans = true, random = true, test_run = false, multi = true, hard_mode = false) {
    this.players = players;

    this.active_players = Object.keys(players);
    this.current_player_index = 0;

    this.used_links = {};
    this.blacklist = [];


    console.log('This is the movie battle server-side controller class! Temporary movie data and some of the core game logic is stored here.')
    

    this.first_id = 438631;
    let first_data = {}

    axios.post(`http://localhost:3000/movies/data.json`, {id: this.first_id})
        .then(response => {
          //console.log(response.data);

          first_data = response.data;
          first_data['title'] = 'Dune';
          first_data['release_date'] = '2021-09-15';

          this.movie_ids = [this.first_id];
          this.data = [{'438631': first_data}]

          console.log(`first movie: ${first_data['title']} (${first_data['release_date'].substring(0,4)})`)
          console.log(`it's ${this.active_players[0]}'s turn.`)
        })
        .catch(error => {
          console.log(error);
        });
  }


  search(term, type = 'movie', auto_select = false) {
    if (term) {
      axios.post(`http://localhost:3000/movies/search.json`, {term: term, type: type})
        .then(response => {
          console.log(response.data);
        })
        .catch(error => {
          console.log(error);
        });
    }
  }



  movie_data(id) {
    if (id) {
      axios.post(`http://localhost:3000/movies/data.json`, {id: id})
        .then(response => {
          console.log(response.data);
        })
        .catch(error => {
          console.log(error);
        });
    }
  };


  compare_to_current(id, blacklist = null, hard_mode = false) {
    console.log('Sending a guess...');
    if (id) {

      axios.post(`http://localhost:3000/movies/data.json`, {id: id})
        .then(response => {
          let data = response.data;

          let last_entry = this.data[this.data.length - 1]
          let to_compare = Object.values(last_entry)[0]

          axios.post(`http://localhost:3000/movies/compare.json`, {movie1_data: to_compare, movie2_data: data, blacklist: blacklist, hard_mode: hard_mode})
            .then(response => {
              let res = response.data.result;
              console.log(res);
              
              if (res[0] === 'success') {
                this.onSuccess(res)
              }
              else {
                this.onFail(res)
              }
              
            })
            .catch(error => {
              console.log(error);
            });
        })
        .catch(error => {
          console.log(error);
        });

    }
  }



  onSuccess(res) {
    let name = res[1];

    if (Object.keys(this.used_links).includes(name)) {
      this.used_links[name]++;
      if (this.used_links[name] > 2) {
        this.blacklist.push(name);
      }
    }
    else {
      this.used_links[name] = 1
    }

    this.current_player_index++;

    if (this.current_player_index === this.active_players.length) {
      this.current_player_index = 0;
    }

    this.currentStatus();
  }



  currentStatus() {
    console.log('Links: ', this.used_links);
    console.log('Blacklist: ', this.blacklist);
    console.log('Remaining Players: ', this.active_players)
    console.log('Up Next: ', this.active_players[this.current_player_index])
  }
}








let players = {
  'Andrew': {active: true, bans: ['Tom Cruise', 'Tom Holland', 'Tom Hanks'], lifelines: {skip: true, info: true, time: true}},
  'Julie': {active: true, bans: ['Nicole Kidman', 'Zendaya', 'Oliva Coleman'], lifelines: {skip: true, info: true, time: true}}
}



let mb = new Movie_Battle(players);
//mb.search('Dune 2');


setTimeout(() => {
  mb.compare_to_current(693134)
}, 3000)