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

// Exporting the user controller
module.exports = {
  createUser,
  deleteUser
};
