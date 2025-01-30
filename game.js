const axios = require('axios')
const dotenv = require('dotenv')


function search(term, type='movie', auto=false) {

    return new Promise(resolve => {

        dotenv.config();
       let base_url = process.env['THEMOVIEDB_BASE_URL'];
       let api_key = process.env['THEMOVIEDB_API_KEY'];
       let access_token = process.env['THEMOVIEDB_ACCESS_TOKEN'];
    
    
       if (!term) {
        resolve(null)
       }

    
       let search_params = {'api_key': api_key, 'query': term};
       let search_url = "";
       let output = [];
    
       if (type === 'person') {
        search_url = new URL(`${base_url}/search/person`)
       }
       else {
           if (type === 'movie') {
            search_url = new URL(`${base_url}/search/movie`)
           }
           else {

            if (type === 'data') {
                search_url = new URL(`${base_url}/movie/${term}/credits?language=en-US`);
                search_params = {'api_key': api_key};
            }
            else {
                resolve(null)
            }
           }
       }
    
    
    
      axios.get(search_url, {params: search_params})
        .then(response => {
            console.log('api call...')
            let data = response.data
            let res = data.results
    
            if (type === 'person') {
                resolve(res[0])
            }
            
            if (type === 'movie') {
                let i = 0
                let return_index = -1
        
                while (output.length < 15 && i < res.length) {
                    let curr_movie = res[i];
                    if (curr_movie['release_date'].length > 0) {
                        output.push({id: curr_movie['id'], title: curr_movie['title'], release_date: curr_movie['release_date']})
                    }
                    i++;
                }
                resolve(output)
            }

            if (type === 'data') {
                output = {director: [], screenplay: [], cinematographer: [], composer: [], editor: [], cast: []}
                data['crew'].forEach(row => {
                    let job = row['job']
                    Object.keys(output).forEach(title => {
                        let t = title.toString();
                        if (t === 'cinematographer') {
                            t = "director of photography"
                        }
                        if (t === 'composer') {
                            t = "original music composer"
                        }
                        
                        if (job.downcase === t) {
                            output[title].push(row['name'])
                        }
                        
                    })
                })

                let i = 0;
                let cast = data['cast']
                while (i < 50 && i < cast.length) {
                    output.cast.push([cast[i]['name'], cast[i]['character']])
                    i +=1
                }
                resolve(output)
            }
        })
    
        .catch(error => {
            console.log(error);
            resolve(null)
        });
    })
}






class Movie_Battle {

  constructor(players, bans = true, random = true, test_run = false, multi = true, hard_mode = false) {
    this.players = players;
    this.hard_mode = hard_mode

    this.active_players = Object.keys(players);
    this.current_player_index = 0;

    this.used_links = {};
    this.blacklist = [];

    this.running = true;

    console.log('This is the movie battle server-side controller class! Temporary movie data and some of the core game logic is stored here.')

    this.first_movie()
  }

  async first_movie() {

    this.first_movie_obj = { id: 438631, title: 'Dune', release_date: '2021-01-27' }
    this.movies_info = [this.first_movie_obj];

    let res = await search(this.first_movie_obj.id, 'data');


    this.data = [{'438631': res}]

    console.log(`first movie: ${this.first_movie_obj['title']} (${this.first_movie_obj['release_date'].substring(0, 4)})`)
    console.log(`it's ${this.active_players[0]}'s turn.`)
  }



  async compare_to_current(movie_obj, blacklist = null, hard_mode = false) {
    if (this.running === false) {
      return
    }

    console.log('Sending a guess...');
    if (movie_obj) {
      if (movie_obj.id) {

        if (Object.keys(this.data).includes(movie_obj.id)) {
            this.onFail(['taken', movie_obj])
        }
        else {
          let res = await search(movie_obj.id, 'data');
          
          let last_entry = this.data[this.data.length - 1];
          let to_compare = Object.values(last_entry)[0];

          //console.log(data, to_compare)

          let comparison = this.compareMovies(to_compare, res);
          console.log(comparison);
              
          if (comparison[0] === 'success') {
            this.movies_info.push(movie_obj);

            
            let new_data = {};
            new_data[movie_obj.id] = res;

            this.data.push(new_data);
            this.onSuccess(comparison)
          }
          else {
            this.onFail(comparison)
          }
        }
      }
  
    }
  }
  

  in_blacklist(person) {
    this.blacklist.forEach(n => {
      if (n === person) {
        return true
      }
    })
    return false
  }

  compareMovies(movie1, movie2) {

    let firstMatch = null;
    let i = 1;

    let movie1keys = Object.keys(movie1);
    let titles = ['director', 'screenplay', 'cinematographer', 'composer', 'editor'];

    console.log(movie2['cast'])
    
    let res = null;

    while (i < movie1keys.length) {
      let key = movie1keys[i];

      if (key === 'title' || key === 'release_date') {
        i++;
        continue;
      }

      console.log(key)

      let category = movie1[key];
      let j = 0;
      while (j < category.length) {

        let person = category[j];
        let role = null;

        if (key === "cast") {
          role = person[1];
          person = person[0];
        }
        console.log(person)

        let k = 0;
        while (k < titles.length) {
          let title = titles[k];
          
          let x = 0;
          let crew_members = movie2[title];

          while (x < crew_members.length) {

            let crew = crew_members[x];
            //console.log(crew)
            if (crew === person) {
              console.log(1)
              if (this.hard_mode) {
                if (this.in_blacklist(crew)) {
                  res = ['fail', crew, 'fail', title]
                }
                else {
                  if (!firstMatch) {
                    res = [crew, key, title]
                  }
                  else {
                    res = ['success', crew, key, title]
                  }
                }
              }
              else {
                if (this.in_blacklist(crew) === false) {
                  res = ['success', crew, key, title]
                }
              }
            }

            if (res) {break}
            x++;
          }

          if (res) {break}
          k++;
        }

        let y = 0;
        let cast = movie2['cast'];

        while (y < cast.length) {
          let actor = cast[y];

          if (actor[0] === person) {
            console.log(2)
            if (this.hard_mode) {
              if (this.in_blacklist(actor[0])) {
                res = ['fail', actor[0], 'blacklisted', actor[1]]
              }
              else {
                if (!firstMatch) {
                  firstMatch = [actor[0], role, actor[1]]
                }
                else {
                  res = ['success', actor[0], role, actor[1]]
                }
              }
            }
            else {
              if (this.in_blacklist(actor[0]) === false) {
                res = ['success', actor[0], role, actor[1]]
              }
              
            }
          }

          if (res) {break}
          y++;
        }

        if (res) {break}
        j++;
      };

      if (res) {break}
      i++;
    }

    if (res) {
      return res
    }
    else {
      return ['fail', null]
    }
  }



  onSuccess(res) {
    console.log('Success!')
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


  onFail(res) {
    console.log('Fail!')
    
    if (this.eliminatePlayer(this.current_player_index)) {

      if (this.current_player_index === this.active_players.length) {
        this.current_player_index = 0;
      }
      this.currentStatus();
    }
  }


  eliminatePlayer(index) {

    this.active_players.splice(index, 1);

    if (this.active_players.length === 1) {
      this.gameOver()
      return false
    }

    else {
      return true
    }
  }

  gameOver() {
    console.log('Game Over!')
    console.log(this.data);
    console.log('Winner: ', this.active_players[0])
    this.running = false;
  }

  currentStatus() {
    let last_entry = this.movies_info[this.movies_info.length - 1];

    console.log('Links: ', this.used_links);
    console.log('Blacklist: ', this.blacklist);
    console.log('Remaining Players: ', this.active_players)
    console.log(`Current Movie: ${last_entry['title']} (${last_entry['release_date'].substring(0, 4)})`)
    console.log('Up Next: ', this.active_players[this.current_player_index])
  }
}

module.exports = {Movie_Battle};





function demo() {
  
  let players = {
    'Andrew': {active: true, bans: ['Tom Cruise', 'Tom Holland', 'Tom Hanks'], lifelines: {skip: true, info: true, time: true}},
    'Julie': {active: true, bans: ['Nicole Kidman', 'Zendaya', 'Oliva Coleman'], lifelines: {skip: true, info: true, time: true}},
    'Eric': {active: true, bans: ['Tom Cruise', 'Tom Holland', 'Tom Hanks'], lifelines: {skip: true, info: true, time: true}},
    'Mike': {active: true, bans: ['Tom Cruise', 'Tom Holland', 'Tom Hanks'], lifelines: {skip: true, info: true, time: true}}
  }
  
  let mb = new Movie_Battle(players);

  setTimeout(() => {
    mb.compare_to_current({ id: 693134, title: 'Dune: Part Two', release_date: '2024-02-27'})
  }, 2000)
  
  setTimeout(() => {
    mb.compare_to_current({ id: 1148901, title: 'Challenger', release_date: '2024-10-23'},)
  }, 7000)
  
  setTimeout(() => {
    mb.compare_to_current({ id: 937287, title: 'Challengers', release_date: '2024-04-18' },)
  }, 12000)
  
  setTimeout(() => {
    mb.compare_to_current({ id: 316029, title: 'The Greatest Showman', release_date: '2017-12-20' },)
  }, 17000)
  
  setTimeout(() => {
    mb.compare_to_current({ id: 693134, title: 'Dune: Part Two', release_date: '2024-02-27'},)
  }, 22000)
}



demo();
