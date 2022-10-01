// Importing the express framework
const express = require('express');

// Creating a route to register users
const router = express.Router();

// Importing the user controller
const rankController = require('./controllers');

// Authentification
const userController = require('../users/controllers');

// Defining the route that updates a rank of a user 
router.put('/ranks/update/:id', userController.authUser, rankController.updateRank);

// Exporting the router
module.exports = router;