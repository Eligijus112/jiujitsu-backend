// The env variables will be loaded from the .env file from one 
// dir above
const dotenv = require("dotenv")
dotenv.config({ path: "../.env" })

// Importing the psql connection manager 
const { Pool } = require('pg')

// Creating a connection pool to the psql database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
})

// Exporting the query object to be used in other files
module.exports = {
    query: (text, params, callback) => {
      return pool.query(text, params, callback)
    }
}