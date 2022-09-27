// Password hashing
const bcrypt = require("bcrypt");

// Importing the connection to the database
const db = require("../db/connection");

// JWT token creation 
const jwt = require("jsonwebtoken");

// Creating the user controller
const createUser = (req, res, next) => {
  // Defining a new insert statement for the users table
  const create_query = `
    INSERT INTO users (name, surname, email, password, is_admin, is_active, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;

  // Defining a query to check if the user already exists
  const check_query = `
    SELECT * FROM users WHERE email = $1
    `;

  // Extracting the necesary info from the request
  const name = req.body.name;
  const surname = req.body.surname;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  // By default, the user is not an admin
  const is_admin = false;

  // By default, the user is active at time of registration
  const is_active = true;

  // Getting the current time
  const created_at = new Date();

    // First, checking if the passwords match 
    if (password !== confirmPassword) {
        return res.status(400).send({
            message: "Passwords do not match",
            status_code: 400
        });
    }

    // Hashing the password
    bcrypt.hash(password, 5).then((hash) => {
        // Checking if user already exists
        db.query(check_query, [email], (err, result) => {
        if (result.rows.length > 0) {
            return res.status(409).send({ 
                message: "User with email already exists",
                status_code: 409            
            });
        } else {
            db.query(
            create_query,
            [
                name,
                surname,
                email,
                hash,
                is_admin,
                is_active,
                created_at,
                created_at,
            ],
            (err, result) => {
                // If there is an error, return it
                if (err) {
                return res.status(500).send({
                    message: "Error in creating user",
                    error: err,
                    status_code: 500
                });
                } else {
                // If there is no error, return the result
                return res.status(201).send({
                    message: "User created successfully",
                    user_id: result.rows[0].id,
                    status_code: 201
                });
                }
            }
            );
        }
        });
    });
};

// Method to delete a user from database
const deleteUser = (req, res, next) => {
    // Defining a new delete statement for the users table
    const delete_query = `
        DELETE FROM users WHERE id = $1
    `;

    // Extracting the user id from the request
    const user_id = req.params.id;

    // Deleting the user from the database
    db.query(delete_query, [user_id], (err, result) => {
        // If there is an error, return it
        if (err) {
            return res.status(500).send({
                message: "Error in deleting user",
                error: err
            });
        } else {
            // If there is no error, return the result
            return res.status(200).send({
                message: "User deleted successfully"
            });
        }
    });
};

// Method to change the user activity status 
const toggleActivityUser = (req, res, next) => {
    // Defining a new update statement for the users table
    const get_activity_status = `
        SELECT is_active FROM users WHERE id = $1
    `

    // Defining a new update statement for the users table
    const update_query = `
        UPDATE users SET is_active = $1, updated_at = $2 WHERE id = $3
    `;

    // Extracting the user id from the request
    const user_id = req.params.id;

    // Getting the current time
    const updated_at = new Date();

    // Getting the current activity status
    db.query(get_activity_status, [user_id], (err, result) => {
        // If there is an error, return it
        if (err) {
            return res.status(500).send({
                message: "Error in getting user activity status",
                error: err
            });
        } else {
            // If there is no error, return the result
            const is_active = result.rows[0].is_active;

            // Updating the user activity status
            db.query(update_query, [!is_active, updated_at, user_id], (err, result) => {
                // If there is an error, return it
                if (err) {
                    return res.status(500).send({
                        message: "Error in updating user activity status",
                        error: err
                    });
                } else {
                    // If there is no error, return the result
                    return res.status(200).send({
                        message: "User activity status updated successfully"
                    });
                }
            });
        }
    });
};

// User login 
const loginUser = (req, res, next) => {
    // Defining a new select statement for the users table
    const login_query = `
        SELECT * FROM users WHERE email = $1
    `;

    // Extracting the email and password from the request
    const email = req.body.email;
    const password = req.body.password;

    // Checking if user exists
    db.query(login_query, [email], (err, result) => {
        // If there is an error, return it
        if (err) {
            return res.status(500).send({
                message: "Error in logging in user",
                error: err,
                status_code: 500
            });
        } else {
            // If there is no error, return the result
            if (result.rows.length > 0) {
                // If the user exists, check the password
                bcrypt.compare(password, result.rows[0].password).then((match) => {
                    if (match) {
                        // Creating the JWT token 
                        const token = jwt.sign(
                            {
                                email: result.rows[0].email,
                                user_id: result.rows[0].id,
                                is_admin: result.rows[0].is_admin,
                                is_active: result.rows[0].is_active
                            },
                            process.env.JWT_KEY,
                            {
                                expiresIn: 3600
                            }
                        );
                        // If the password matches, return the user info
                        return res.status(200).send({
                            message: "User logged in successfully",
                            user_id: result.rows[0].id,
                            is_admin: result.rows[0].is_admin,
                            is_active: result.rows[0].is_active,
                            status_code: 200,
                            token: token,
                            expires_in: 3600
                        });
                    } else {
                        // If the password does not match, return an error
                        return res.status(401).send({
                            message: "Incorrect password",
                            status_code: 401
                        });
                    }
                });
            } else {
                // If the user does not exist, return an error
                return res.status(404).send({
                    message: "User with email does not exist",
                    status_code: 404
                });
            }
        }
    });
};

const authUser = (req, res, next) => {
    // Checking if the authorization header is present
    if (!req.headers.authorization) {
        return res.status(401).send({
            message: "Authorization header is not present",
            status_code: 401
        });
    } else {
        // Extracting the token from header
        const token = req.headers.authorization.split(" ")[1];

        // Verifying the token
        jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
            // If there is an error, return it
            if (err) {
                return res.status(403).send({
                        message: "Auth failed",
                        status_code: 403
                    })
            } else {
                // Checking if the path is not /authenticate
                if (req.path !== "/users/authenticate") {
                    return next();
                } else {
                // If there is no error, return the result
                return res.status(200).send({
                        message: "Auth successful",
                        status_code: 200,
                        user_id: decoded.user_id,
                    })
                }
            }
        });
    }
};

const getUsers = (req, res, next) => {
    // Authenticating; If authentication fails, return an error
    // If authentication is successful, return the user info
    //authUser(req, res, next)
    // Defining a new select statement for the users table
    const get_users_query = `
        SELECT * FROM users
    `;
    // Getting all users from the database
    db.query(get_users_query, (err, result) => {
        // If there is an error, return it
        if (err) {
            return res.status(500).send({
                message: "Error in getting users",
                error: err
            });
        } else {
            // If there is no error, return the result
            return res.status(200).send({
                message: "Users retrieved successfully",
                users: result.rows
            });
        }
    });    
};

// Exporting the user controller
module.exports = {
  createUser,
  deleteUser,
  toggleActivityUser,
  loginUser,
  authUser, 
  getUsers
};
