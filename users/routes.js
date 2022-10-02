// Importing the express framework
const express = require('express');

// Creating a route to register users
const router = express.Router();

// Importing the user controller
const userController = require('./controllers');

// Defining the route to create users
router.post('/users/create', userController.createUser);

// User deletion 
router.delete('/users/:id', userController.authUser, userController.deleteUser);

// User login
router.post('/users/login', userController.loginUser);

// User authentication
router.get('/users/authenticate', userController.authUser);

// Getting all the users
router.get('/users', userController.authUser, userController.getUsers);

// Getting one user info 
router.get('/users/:id', userController.authUser, userController.getUser);

// Exporting the router
module.exports = router;