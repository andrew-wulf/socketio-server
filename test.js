
const axios = require('axios');


function search(term, type = 'movie') {
   let base_url = ENV['THEMOVIEDB_BASE_URL']
   let api_key = ENV['THEMOVIEDB_API_KEY']
   let access_token = ENV['THEMOVIEDB_ACCESS_TOKEN']

   if (!term) {
    return null
   }

   let search_params = {api_key: api_key, query: term};
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
        return null
       }
   }

  
  search_url.search = search_params.toString();


  axios.post(search_url, {params: search_params})
    .then(response => {
        console.log(response)
    })

    .catch(error => {
        console.log(error)
    });

}


search('Tom Holland', 'Person')