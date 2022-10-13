// Importing path 
const path = require('path');

// Importing the express module
const express = require('express');

// Importing the body-parser module
const bodyParser = require('body-parser');

// Importing the routes from the users module
const usersRoutes = require('./users/routes');

// Importing the ranks routes
const ranksRoutes = require('./ranks/routes');

// Importing the calendar routes
const calendarRoutes = require('./calendar/routes');

// Loading the .env constants
require('dotenv').config({path: './.env'});

// Initiating the app 
const app = express();

// Defining the image dir 
app.use('/uploads/users/profile', express.static(path.join(process.env.USER_PROFILE_IMAGE_UPLOAD_PATH)));

// Setting the body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
app.use('/api', calendarRoutes);

// Exporting the app
module.exports = app;