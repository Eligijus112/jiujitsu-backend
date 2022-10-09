// Password hashing
const bcrypt = require("bcrypt");

// Importing the connection to the database
const db = require("../db/connection");

// JWT token creation
const jwt = require("jsonwebtoken");

// Form parsing
const formidable = require("formidable");

// File system
const fs = require("fs");

// Creating the user controller
const createUser = (req, res, next) => {
  // Defining a new insert statement for the users table
  const create_query = `
    INSERT INTO users (
        name, 
        surname, 
        email, 
        password, 
        is_admin, 
        is_active, 
        created_at, 
        updated_at,
        image_path
        ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `;

  // Defining a query to check if the user already exists
  const check_query = `
    SELECT * FROM users WHERE email = $1
    `;

  // Rank creation query
  const create_rank_query = `
    INSERT INTO user_ranks (
        user_id,
        rank_name,
        stripe_count,
        created_at,
        updated_at
    ) VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;

  const form = formidable({ multiples: true });
  form.uploadDir = process.env.USER_PROFILE_IMAGE_UPLOAD_PATH;

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).send({
        message: "Error in creating user",
        error: err,
        status_code: 500,
      });
    }

    // Extracting the necesary fields from the request
    const name = fields.name;
    const surname = fields.surname;
    const email = fields.email;
    const password = fields.password;
    const confirmPassword = fields.confirmPassword;
    const adminPassword = fields.adminPassword;
    const rank_name = fields.beltColor;
    const stripe_count = fields.stripeCount;
    const image = files.image;

    // Getting the current time
    const created_at = new Date();

    // By default, the user is not an admin
    const is_admin = false;

    // By default, the user is active at time of registration
    const is_active = true;

    // Checking if the adming password matches with the one in memory 
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).send({
        message: "Admin password is incorrect",
        status_code: 401,
      });
    }

    // First, checking if the passwords match
    if (password !== confirmPassword) {
      return res.status(400).send({
        message: "Passwords do not match",
        status_code: 400,
      });
    }

    // Hashing the password
    bcrypt.hash(password, 5).then((hash) => {
      // Checking if user already exists
      db.query(check_query, [email], (err, result) => {
        if (result.rows.length > 0) {
          return res.status(409).send({
            message: "User with email already exists",
            status_code: 409,
          });
        } else {
          // Extracting the original file name
          const origFilename = image.originalFilename;

          // Extracting the file extension
          const fileExtension = origFilename.split(".").pop();

          // Extracting the new file name
          const newFilename = image.newFilename;

          // Adding the extension to the created file
          const newFile = newFilename + "." + fileExtension;

          // Creating the full path to the image
          const imagePath =
            process.env.USER_PROFILE_IMAGE_UPLOAD_PATH + "/" + newFile;

          // Moving the file to the new location
          fs.rename(image.filepath, imagePath, (err) => {});

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
              imagePath,
            ],
            (err, result) => {
              // If there is an error, return it
              if (err) {
                return res.status(500).send({
                  message: "Error in creating user",
                  error: err,
                  status_code: 500,
                });
              } else {
                // Extracting the created user's id
                const user_id = result.rows[0].id;

                // Adding the information about the user's rank
                db.query(
                  create_rank_query,
                  [user_id, rank_name, stripe_count, created_at, created_at],
                  (err, result) => {
                    // If there is an error, return it
                    if (err) {
                      return res.status(500).send({
                        message: "Error in creating user",
                        error: err,
                        status_code: 500,
                      });
                    } else {
                      return res.status(201).send({
                        message: "User created successfully",
                        user_id: result.rows[0].id,
                        status_code: 201,
                      });
                    }
                  }
                );
              }
            }
          );
        }
      });
    });
  });
};

// Method to delete a user from database
const deleteUser = (req, res, next) => {
  // Extracting the user id from the request
  const user_id = req.params.id;

  // Ensuring that the deleter is an admin
  if (!(req.user_id === user_id || req.is_admin)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Defining a new delete statement for the users table
  const delete_query_user = `
        DELETE FROM users WHERE id = $1
    `;
  const delete_query_ranks = `
        DELETE FROM user_ranks WHERE user_id = $1
    `;

  // Deleting the user from the database
  db.query(delete_query_ranks, [user_id], (err, result) => {
    // If there is an error, return it
    if (err) {
      return res.status(500).send({
        message: "Error in deleting user",
        error: err,
      });
    } else {
      db.query(delete_query_user, [user_id], (err, result) => {
        // If there is an error, return it
        if (err) {
          return res.status(500).send({
            message: "Error in deleting user",
            error: err,
          });
        } else {
          // If there is no error, return the result
          return res.status(200).send({
            message: "User deleted successfully",
            status_code: 200,
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
        status_code: 500,
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
                is_active: result.rows[0].is_active,
              },
              process.env.JWT_KEY,
              {
                expiresIn: 3600,
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
              expires_in: 3600,
            });
          } else {
            // If the password does not match, return an error
            return res.status(401).send({
              message: "Incorrect password",
              status_code: 401,
            });
          }
        });
      } else {
        // If the user does not exist, return an error
        return res.status(404).send({
          message: "User with email does not exist",
          status_code: 404,
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
      status_code: 401,
    });
  } else {
    // Extracting the token from header
    const token = req.headers.authorization.split(" ")[1];

    // Verifying the token
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      // If there is an error, return it
      if (err) {
        return res.status(403).send({
          message: "Authentication failed. Please login again",
          status_code: 403,
        });
      } else {
        // Checking if the path is not /authenticate
        if (req.path !== "/users/authenticate") {
          // Adding decoded info to the request
          req.user_id = decoded.user_id;
          req.is_admin = decoded.is_admin;
          req.is_active = decoded.is_active;
          return next();
        } else {
          // If there is no error, return the result
          return res.status(200).send({
            message: "Authentification successful",
            status_code: 200,
            user_id: decoded.user_id,
            is_admin: decoded.is_admin,
          });
        }
      }
    });
  }
};

const getUsers = (req, res, next) => {
  // Defining the dictionary for belt color ranks
  const belt_color_ranks = {
    white: 0,
    blue: 1,
    purple: 2,
    brown: 3,
    black: 4,
  };

  // Defining a new select statement for the users table
  const get_users_query = `
        SELECT 
            users.*, user_ranks.rank_name, user_ranks.stripe_count 
        FROM 
            users
        LEFT JOIN 
            user_ranks 
        ON 
            users.id = user_ranks.user_id
    `;
  // Getting all users from the database
  db.query(get_users_query, (err, result) => {
    // If there is an error, return it
    if (err) {
      return res.status(500).send({
        message: "Error in getting users",
        error: err,
      });
    } else {
      // Sorting the users by belt color AND stripe count
      result.rows.sort((a, b) => {
        if (belt_color_ranks[a.rank_name] < belt_color_ranks[b.rank_name]) {
          return 1;
        } else if (
          belt_color_ranks[a.rank_name] > belt_color_ranks[b.rank_name]
        ) {
          return -1;
        } else {
          if (a.stripe_count < b.stripe_count) {
            return 1;
          } else if (a.stripe_count > b.stripe_count) {
            return -1;
          } else {
            return 0;
          }
        }
      });
      // If there is no error, return the result
      return res.status(200).send({
        message: "Users retrieved successfully",
        users: result.rows,
      });
    }
  });
};

// Getting the user
const getUser = (req, res, next) => {
  // Extracting the user_id from the params
  const user_id = parseInt(req.params.id);

  // Checking if the user_id is the same as in the token
  if (!(req.user_id === user_id || req.is_admin)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Defining a new select statement for the users table
  const get_user_query = `
        SELECT
            users.*, user_ranks.rank_name, user_ranks.stripe_count
        FROM
            users
        LEFT JOIN
            user_ranks
        ON
            users.id = user_ranks.user_id
        WHERE
            users.id = $1
    `;

  // Getting the user from the database
  db.query(get_user_query, [user_id], (err, result) => {
    // If there is an error, return it
    if (err) {
      return res.status(500).send({
        message: "Error in getting user",
        error: err,
      });
    } else {
      // If there is no error, return the result
      if (result.rows.length > 0) {
        return res.status(200).send({
          message: "User retrieved successfully",
          user_info: {
            id: result.rows[0].id,
            name: result.rows[0].name,
            surname: result.rows[0].surname,
            email: result.rows[0].email,
            rank_name: result.rows[0].rank_name,
            stripe_count: result.rows[0].stripe_count,
            image_path: result.rows[0].image_path,
          },
        });
      }
    }
  });
};

// Creating the user controller
const updateUser = (req, res, next) => {
  // Defining the update query
  const update_user_query = `
        UPDATE
            users
        SET
            name = $1,
            surname = $2,
            email = $3,
            updated_at = NOW()
        WHERE
            id = $4
    `;

  // Rank creation query
  const update_rank_query = `
    UPDATE 
        user_ranks
    SET
        rank_name = $1,
        stripe_count = $2,
        updated_at = NOW()
    WHERE
        user_id = $3
    `;

  const form = formidable({ multiples: true });
  form.uploadDir = process.env.USER_PROFILE_IMAGE_UPLOAD_PATH;

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).send({
        message: "Error in updating user",
        error: err,
        status_code: 500,
      });
    }

    // Extracting the necesary fields from the request
    const name = fields.name;
    const surname = fields.surname;
    const email = fields.email;
    const rank_name = fields.rank_name;
    const stripe_count = fields.stripe_count;
    const image = files.image;

    if (image) {
      // Extracting the old image path 
      const old_image_path = fields.image_path;

      // Moving the file to the new location
      fs.rename(image.filepath, old_image_path, (err) => {});
    }

    // Updating the user in the database
    db.query(
      update_user_query,
      [name, surname, email, req.user_id],
      (err, result) => {
        if (err !== null || err !== undefined) {
          // Updating the ranks
          db.query(
            update_rank_query,
            [rank_name, stripe_count, req.user_id],
            (err, result) => {
              if (err !== null || err !== undefined) {
                return res.status(200).send({
                  message: "User updated successfully",
                  status_code: 200,
                });
              }
            }
          );
        }
        else {
          return res.status(500).send({
            message: "Error in updating user",
            error: err,
            status_code: 500,
          });
        }
      }
    );
  });
};

// Exporting the user controller
module.exports = {
  updateUser,
  createUser,
  deleteUser,
  loginUser,
  authUser,
  getUsers,
  getUser,
};
