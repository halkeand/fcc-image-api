const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URL)
const conn = mongoose.connection;             
 
conn.on('error', console.error.bind(console, 'connection error:'));  
 
conn.once('open', () => console.log('connected to db'))
module.exports = conn