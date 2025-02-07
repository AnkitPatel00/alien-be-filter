const mongoose = require('mongoose')
require('dotenv').config()

const mongoURI = process.env.mongoURI

const initializeDatabase = async() => {
  try {
    const isConnected = await mongoose.connect(mongoURI)
    if (isConnected)
    {
      console.log("Connnected Successfully.")
    }
  }
  catch (error)
  {
    console.log("Failed to Connect: ",error)
  }
}

module.exports = initializeDatabase