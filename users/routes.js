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

// Activity toggling 
router.put('/users/toggle_activity/:id', userController.toggleActivityUser);

// User login
router.post('/users/login', userController.loginUser);

// User authentication
router.get('/users/authenticate', userController.authUser);

// Getting all the users
router.get('/users', userController.authUser, userController.getUsers);

// Exporting the router
module.exports = router;