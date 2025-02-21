import axios from 'axios'
import dotenv from 'dotenv'


export function Search(term, type='movie', auto=false) {

    return new Promise(resolve => {

        dotenv.config();
       let base_url = process.env['THEMOVIEDB_BASE_URL'];
       let api_key = process.env['THEMOVIEDB_API_KEY'];
    
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
                        
                        if (job.toLowerCase() === t) {
                            output[title].push(row['name'])
                        }
                    })
                    // exception for the occasional 'writer' designation
                    if (job.toLowerCase() === 'writer') {
                    output.screenplay.push(row['name'])
                    }
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



function movieImage(id) {
  return new Promise(resolve => {
    dotenv.config();
    let api_key = process.env['THEMOVIEDB_API_KEY'];

    axios.get(`https://api.themoviedb.org/3/movie/${id}/images`, {params: {api_key: api_key}})
    .then(response => {
      resolve(response.data.posters[0].file_path)
    })
      .catch(error => {
        console.log(error);
        resolve(null)
    });
  })
}




function pickaMovie(res) {
  let movies_considered = []
  let i = 0;
  while (i < 5) {
    let index = Math.round(Math.random() * (res.length - 1));
    movies_considered.push(res[index])
    i++
  }
  let top_rating = movies_considered[0].popularity;
  let top_index = 0;

  movies_considered.forEach((movie, i) => {
    if (movie.popularity > top_rating) {
      top_rating = movie.popularity
      top_index = i;
    }
  })

  return movies_considered[top_index];
}


export function topRated () {

  return new Promise(resolve => { 
    
    let page1 = Math.round(Math.random() * 5);
    let page2 = page1 - 1
    if (page1 < 1) {
      page1 = 5
    }
    if (page2 < 1) {
      page2 = 4
    }
    let movie = null;
  
    dotenv.config();
    let api_key = process.env['THEMOVIEDB_API_KEY'];
  
    axios.get(`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page1}`, {params: {api_key: api_key}})
      .then(response => {
        let res = response.data.results;

        axios.get(`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page2}`, {params: {api_key: api_key}})
          .then(response => {
            res.concat(response.data.results);
            movie = pickaMovie(res);
            //console.log(movie)
            if (movie) {
              resolve({id: movie.id, title: movie.title, release_date: movie.release_date}) 
            }
            else {
              resolve({id: 438631, title: 'Dune', release_date: '2021-01-27' }) 
            }
          })
          .catch(error => {
            console.log(error);
            resolve(null)
        });
      })
      .catch(error => {
        console.log(error);
        resolve(null)
    });
  })
}



export function popular () {

  return new Promise(resolve => { 
    
    let movie = null;
  
    dotenv.config();
    let api_key = process.env['THEMOVIEDB_API_KEY'];
  
    axios.get('https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc', {params: {api_key: api_key}})
      .then(response => {
        let res = response.data.results;

        axios.get('https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=2&sort_by=popularity.desc', {params: {api_key: api_key}})
          .then(response => {
            let res2 = response.data.results;
            
            res.concat(res2);
            movie = pickaMovie(res);

            if (movie) {
              resolve({id: movie.id, title: movie.title, release_date: movie.release_date}) 
            }
            else {
              resolve({id: 438631, title: 'Dune', release_date: '2021-01-27' }) 
            }
          })
          .catch(error => {
            console.log(error);
            resolve(null)
        });
      })
      .catch(error => {
        console.log(error);
        resolve(null)
    });
  })
}









export class Movie_Battle {

  constructor(players, lifelines = true, bans = false, hard_mode = false, random = true, search_type = 'popular') {
    this.players = players;
    this.hard_mode = hard_mode

    this.solo_mode = false;
    if (Object.keys(players).length === 1) {
      this.solo_mode = true;
      console.log('Solo mode detected! Keep taking turns until you fail.')
    }

    //Game Options

    this.bans = bans;
    this.random = random;
    this.hard_mode = hard_mode;
    this.search_type = search_type;
    
    //---
  
    this.current_player_index = Math.round(Math.random()) * (Object.keys(this.players).length - 1)

    this.used_links = {};
    this.current_link = [];
    this.blacklist = [];
    this.history = [];
    this.movies_info = [];
    this.data = [];
    this.guesses = [];
    this.afk_count = 0;
    this.tie_condition = 0;

    this.running = true;
    this.winner_ids = [];


    // if (lifelines) {
    //   Object.keys(players).forEach(id => {
    //     this.players[id].lifelines = {time: true, skip: true, info: true}
    //   })
    // }

    //console.log('This is the movie battle server-side controller class! Temporary movie data and some of the core game logic is stored here.')
    if (random) {
      this.first_movie()
    }
  }

  currentStatus() {
    let last_entry = this.movies_info[this.movies_info.length - 1];

    if (this.running) {
      // console.log('Links: ', this.used_links);
      // console.log('Blacklist: ', this.blacklist);
      // console.log('Players: ', this.players)
      // console.log(`Current Movie: ${last_entry['title']} (${last_entry['release_date'].substring(0, 4)})`)
      // console.log('Up Next: ', this.players[Object.keys(this.players)[this.current_player_index]])
    }

    else {
      console.log('Status: game ended.')
    }


    let output = {};

    if (this.history.length > 0) {
      output = {
        players: this.players,
        current_id: Object.keys(this.players)[this.current_player_index],
        current_name: this.players[Object.keys(this.players)[this.current_player_index]],
        current_movie: `${last_entry['title']} (${last_entry['release_date'].substring(0, 4)})`,
        current_link: this.current_link,
        history: this.history,
        used_links: this.used_links,
        blacklist: this.blacklist,
        running: this.running,
        winner_ids: this.winner_ids,
      }
    }
    else {
      output = {
        players: this.players,
        current_id: Object.keys(this.players)[this.current_player_index],
        current_name: this.players[Object.keys(this.players)[this.current_player_index]],
        history: this.history,
        running: this.running,
      }
    }


    return (output)
  }


  async first_movie(first_obj = null) {
    console.log('fetching first movie...')

    if (first_obj !== null) {
      this.first_movie_obj = first_obj;
      if (!first_obj) {
        console.log('failed to give first movie. Moving to next player...')

        if (this.solo_mode) {
          let current_id = Object.keys(this.players)[0];
          this.eliminatePlayer(current_id);
        }
        else {
          if (this.afk_count < Object.keys(this.players).length - 1) {
            this.nextPlayer();
            this.afk_count++;
          }
          else {
            // end the game if no one picks a movie.
            Object.keys(this.players).forEach(key => {
              this.eliminatePlayer(key);
            })
          }
        }
        
        return
      }
    }
    else {
      if (this.search_type === 'popular') {
        this.first_movie_obj = await popular();
      }
      else {
        this.first_movie_obj = await topRated();
      }
    }
    this.movies_info = [this.first_movie_obj];

    let res = await Search(this.first_movie_obj.id, 'data');
    let image_path = await movieImage(this.first_movie_obj.id);

    let first_movie_data = {};
    ['director', 'screenplay', 'cinematographer', 'composer', 'editor'].forEach(title => {
      first_movie_data[title] = res[title];
    })
    let cast = [];
    res.cast.slice(0, 5).forEach(arr => {cast.push(arr[0])});

    first_movie_data.cast = cast
    first_movie_data['title'] = `${this.first_movie_obj.title} (${this.first_movie_obj.release_date.substring(0,4)})`
    first_movie_data.image = `https://image.tmdb.org/t/p/original/${image_path}`
    first_movie_data.show_info = true

    console.log(first_movie_data)

    let obj = {}
    obj[this.first_movie_obj.id] = res
    this.data = [obj]
    this.guesses = [`${this.first_movie_obj['title']} (${this.first_movie_obj['release_date'].substring(0, 4)})`]
    this.history = [first_movie_data];
    this.images = [`https://image.tmdb.org/t/p/original/${image_path}`]

    if (first_obj) {
      this.nextPlayer();
    }

    console.log('Players: ', this.players)
    console.log(this.current_player_index)

    //console.log(`first movie: ${this.first_movie_obj['title']} (${this.first_movie_obj['release_date'].substring(0, 4)})`)
    //console.log(`it's ${this.players[Object.keys(this.players)[this.current_player_index]].name}'s turn.`)
  }

  showInfo() {
    let i = this.history.length - 1;
    let data = this.data[this.data.length - 1];

    
    data = data[Object.keys(data)[0]];

    let titles = ['director', 'screenplay', 'cinematographer', 'composer', 'editor'];

    titles.forEach((title) => {

      this.history[i][title] = data[title];
    })
    let cast = [];
    data.cast.slice(0, 5).forEach(arr => {cast.push(arr[0])});

    this.history[i].cast = cast
    this.history[i].show_info = true
  }


  async compare_to_current(movie_obj, blacklist = null, hard_mode = false) {
    if (this.running === false) {
      return
    }
    this.show_info = false;
    this.tie_condition = 0;

    console.log('Sending a guess...');
    if (movie_obj) {
      if (movie_obj.id) {

        let used_ids = this.data.map(obj => {return Object.keys(obj)[0]})
        // console.log(movie_obj.id)
        // console.log(used_ids)
        
        this.guesses.push(`${movie_obj['title']} (${movie_obj['release_date'].substring(0, 4)})`);
        let image_path = await movieImage(movie_obj.id);
        this.images.push(`https://image.tmdb.org/t/p/original/${image_path}`);


        if (used_ids.includes(movie_obj.id.toString())) {
          console.log('taken!')
            this.onFail(['taken', movie_obj])
        }
        else {
          let res = await Search(movie_obj.id, 'data');

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
    else {
      this.onFail(['expired'])
    }
  }
  
  in_blacklist(person) {
    return this.blacklist.some(n => {n === person})
  }

  compareMovies(movie1, movie2) {

    let currentMatch = ['fail', null];
    let currentLinkCount = 0;

    let i = 1;

    let movie1keys = Object.keys(movie1);
    let titles = ['director', 'screenplay', 'cinematographer', 'composer', 'editor'];

    //console.log(movie2['cast'])
    
    let res = null;

    while (i < movie1keys.length) {
      let key = movie1keys[i];

      if (key === 'title' || key === 'release_date') {
        i++;
        continue;
      }

      //console.log(key)

      let category = movie1[key];
      let j = 0;
      while (j < category.length) {

        let person = category[j];
        let role = null;

        if (key === "cast") {
          role = person[1];
          person = person[0];
        }
       // console.log(person)

        let k = 0;
        while (k < titles.length) {
          let title = titles[k];
          
          let x = 0;
          let crew_members = movie2[title];

          while (x < crew_members.length) {

            let crew = crew_members[x];
            //console.log(crew)
            if (crew === person) {
              if (this.hard_mode) {
                if (this.blacklist.includes(crew)) {
                  res = ['blacklisted', crew, key, title]
                }
                else {
                  if (currentMatch[0] === 'fail') {
                    currentMatch = ['success', crew, key, title];
                    currentLinkCount = this.used_links[person] || 0
                  }
                  else {
                    if (this.used_links[person] && this.used_links[person] > currentLinkCount) {
                      currentMatch = ['success', crew, key, title];
                      currentLinkCount = this.used_links[person]
                    }
                  }
                }
              }
              else {
                if (this.blacklist.includes(crew)) {
                  res = null
                }
                else {
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
            if (this.hard_mode) {
              if (this.blacklist.includes(actor[0])) {
                res = ['blacklisted', actor[0], role, actor[1]]
              }
              else {
                if (currentMatch[0] === 'fail') {
                  currentMatch = ['success', actor[0], role, actor[1]];
                  currentLinkCount = this.used_links[person] || 0
                }
                else {
                  if (this.used_links[person] && this.used_links[person] > currentLinkCount) {
                    currentMatch = ['success', actor[0], role, actor[1]];
                    currentLinkCount = this.used_links[person]
                  }
                }
              }
            }
            else {
              if (this.blacklist.includes(actor[0])) {
                res = null
              }
              else {
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

    if (this.hard_mode && !res) {
      console.log(currentLinkCount)
      res = currentMatch
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
    this.current_link = [name, this.used_links[name]]

    this.appendToHistory(res, this.used_links[name])
    this.nextPlayer();
    return res
  }


  onFail(res) {
    console.log('Fail!')

    let current_id = Object.keys(this.players)[this.current_player_index];
    
    this.appendToHistory(res)
    this.eliminatePlayer(current_id)
    this.nextPlayer()
    return res
  }

  appendToHistory(res, n = null) {

    let usage = null;
    
    if (n) {
      usage = [false, false, false]

      let i = 0;
      while (i < n) {
        usage[i] = true;
        i++;
      }
    }

    this.history.push({
      title: this.guesses[this.guesses.length - 1],
      success: res[0],
      name: res[1],
      first_role: res[2],
      second_role: res[3],
      link_usage: usage,
      image: this.images[this.images.length - 1],
      show_info: false
    })
  }

  nextPlayer() {
    
    if (this.solo_mode) {
      return
    }
    
    let p = this.players;
    let curr = this.current_player_index;
    curr++;
    
    if (curr === Object.keys(p).length) {
      curr = 0;
    }

    if (p[Object.keys(p)[curr]].active === false) {
      let i = 0;
      while (p[Object.keys(p)[curr]].active === false && i < Object.keys(p).length) {
        curr++;
        i++;
        if (curr === Object.keys(p).length) {
          curr = 0;
          break
        }
      }
      if (p[Object.keys(p)[curr]].active === false) {
        this.gameOver()
      }
    }

    this.current_player_index = curr

    if (this.running) {
      //this.currentStatus();
    }
  }

  skip() {
    let active_count = 0;
    Object.keys(this.players).forEach(key => {
      if (this.players[key].active) {
        active_count++;
      }
    })

    this.tie_condition++;

    if (this.tie_condition === active_count) {
      this.gameOver();
    }
    else {
      this.nextPlayer();
    }

  }


  eliminatePlayer(id) {

    this.players[id].active = false
    if (this.solo_mode) {
      this.gameOver();
      return
    }

    let active_count = 0
    Object.keys(this.players).forEach(key => {
      if (this.players[key].active) {
        active_count++;
      }
    })
    if (active_count < 2) {
      this.gameOver()
    }
  }

  gameOver() {
    console.log('Game Over!')

    if (this.solo_mode) {
      console.log(`Lasted ${this.data.length} rounds.`)
    }
    else {
      
      Object.keys(this.players).forEach(id => {
        if (this.players[id].active) {
          this.winner_ids.push(id);
        }
      })

      console.log('Winners: ');
      this.winner_ids.forEach(id => {console.log(this.players[id].name)})
    }
    this.running = false;
  }


}






function demo() {
  
  let players = {
    '1': {name: 'Andrew', active: true, bans: ['Tom Cruise', 'Tom Holland', 'Tom Hanks'], lifelines: {skip: true, info: true, time: true}},
    '2': {name: 'Julie', active: true, bans: ['Nicole Kidman', 'Zendaya', 'Oliva Coleman'], lifelines: {skip: true, info: true, time: true}},
    '3': {name: 'Eric', active: true, bans: ['Tom Cruise', 'Tom Holland', 'Tom Hanks'], lifelines: {skip: true, info: true, time: true}},
    '4': {name: 'Mike', active: true, bans: ['Tom Cruise', 'Tom Holland', 'Tom Hanks'], lifelines: {skip: true, info: true, time: true}}
  }
  
  let mb = new Movie_Battle(players, true, false, true);

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



//demo();
// topRated()
// popular()
// movieImage(105)