const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const express = require('express')
const app = express()
const API_IMAGES_PER_PAGE = 20
const db = require('./db.js')
const SearchModel = require('./SearchModel.js')
const normalize = json => json.map(({pageURL, tags, previewURL, webformatURL}) => ({pageURL, tags, previewURL, webformatURL}))

const searchApi = (query, page) => {
  return fetch(`https://pixabay.com/api/?key=${process.env.API_KEY}&q=${encodeURIComponent(query)}&page=${page}`)
  .then(resp => resp.json())
}

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.get("/search/:searchTerm", (req, res) => {
  const {searchTerm} = req.params
  const {offset} = req.query
  
  //Save the searched term to db
  const newSearch = new SearchModel({searchTerm, date: Date.now()}).save(e => e && console.log(e))
  
  //Make fetching to Pixabay API
  if(!offset) res.json({message: 'Please specify an offset (even 0)'})
  else {
    const firstPageToGo = Math.ceil(offset / API_IMAGES_PER_PAGE) || 1
    const secondPageToGo = firstPageToGo + 1
    const imagesToCut = offset % API_IMAGES_PER_PAGE
    
    searchApi(searchTerm,firstPageToGo).then(firstFetch => {
      if(firstFetch.total == 0) {
        res.json({message: `Nothing matched ${searchTerm}`})
      }
      if(offset == 0) {
        res.json(normalize(firstFetch.hits))
      } else {
        searchApi(searchTerm, secondPageToGo).then(secondFetch => {
          const formattedFirstFetch = normalize(firstFetch.hits.splice(imagesToCut))
          const formattedSecondFetch = normalize(secondFetch.hits.splice(0,imagesToCut))
          
          res.json(formattedFirstFetch.concat(formattedSecondFetch))
        }) 
      }
    }).catch(e => res.json({message: 'An error occured, you may have specified a too large offset'}))
  }
})


app.get('/latestSearch', (req, res) => {
  SearchModel.find({}, (e, latestSearch) => {
    if(e) res.json({message: 'An error occured while retrieving latest search'})
    else res.json(latestSearch.map(({date, searchTerm}) => ({date, searchTerm})))
  })
})
app.listen(process.env.PORT,  () => {
  console.log('Your app is listening')
})
