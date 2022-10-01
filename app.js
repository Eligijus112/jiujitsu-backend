// Importing the express module
const express = require('express');

// Importing the body-parser module
const bodyParser = require('body-parser');

// Importing the routes from the users module
const usersRoutes = require('./users/routes');

// Importing the ranks routes
const ranksRoutes = require('./ranks/routes');

// Loading the .env constants
require('dotenv').config({path: './.env'});

// Initiating the app 
const app = express();

// Setting the body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Setting up the CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

// Setting up the routes
app.use('/api', usersRoutes);
app.use('/api', ranksRoutes);

// Exporting the app
module.exports = app;