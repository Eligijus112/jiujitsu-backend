// Importing the express framework
const express = require('express');

// Creating a route to register users
const router = express.Router();

// Importing the user controller
const userController = require('../users/controllers');

// Importing teh calendar controller
const calendarController = require('./controllers');

// Defining the route to create users
router.post('/calendar/addEntry', userController.authUser, calendarController.addEntry);

// Route to get the user activity
router.get('/calendar', userController.authUser, calendarController.getCalendar);

// Route to get the morning goers
router.get('/calendar/morning', userController.authUser, calendarController.getMorningGoers);

// Route to get evening goers 
router.get('/calendar/evening', userController.authUser, calendarController.getEveningGoers);

// Exporting the router
module.exports = router;