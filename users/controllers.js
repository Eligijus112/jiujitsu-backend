// Password hashing
const bcrypt = require("bcrypt");

// Importing the connection to the database
const db = require("../db/connection");

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

  // By default, the user is not an admin
  const is_admin = false;

  // By default, the user is active at time of registration
  const is_active = true;

  // Getting the current time
  const created_at = new Date();

  // Hashing the password
  bcrypt.hash(req.body.password, 5).then((hash) => {
    // Checking if user already exists
    db.query(check_query, [email], (err, result) => {
      if (result.rows.length > 0) {
        return res.status(409).send({ message: "User already exists" });
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
              });
            } else {
              // If there is no error, return the result
              return res.status(201).send({
                message: "User created successfully",
                user_id: result.rows[0].id,
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
        UPDATE users SET is_active = $1 WHERE id = $2
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
            db.query(update_query, [!is_active, user_id], (err, result) => {
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
                error: err
            });
        } else {
            // If there is no error, return the result
            if (result.rows.length > 0) {
                // If the user exists, check the password
                bcrypt.compare(password, result.rows[0].password).then((match) => {
                    if (match) {
                        // If the password matches, return the user info
                        return res.status(200).send({
                            message: "User logged in successfully",
                            user_id: result.rows[0].id,
                            is_admin: result.rows[0].is_admin,
                            is_active: result.rows[0].is_active
                        });
                    } else {
                        // If the password does not match, return an error
                        return res.status(401).send({
                            message: "Incorrect password"
                        });
                    }
                });
            } else {
                // If the user does not exist, return an error
                return res.status(404).send({
                    message: "User does not exist"
                });
            }
        }
    });
};



// Exporting the user controller
module.exports = {
  createUser,
  deleteUser,
  toggleActivityUser,
  loginUser
};
