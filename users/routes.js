// Importing the express framework
const express = require('express');

// Creating a route to register users
const router = express.Router();

// Importing the user controller
const userController = require('./controllers');

// Defining the route to create users
router.post('/users/create', userController.createUser);

// User deletion 
router.delete('/users/delete/:id', userController.deleteUser);

// Exporting the router
module.exports = router;