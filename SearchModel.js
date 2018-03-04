const mongoose = require('mongoose')

const Model = mongoose.model('Search',{
  searchTerm: String,
  date: Date
})

module.exports = Model