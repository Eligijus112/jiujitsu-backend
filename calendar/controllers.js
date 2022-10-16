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

// Defining a post request to add a new entry to the calendar
const addEntry = (req, res) => {
  // Extracting the fields with formidable
  const form = formidable({ multiples: true });

  // Parsing the form
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).send({
        message: "Error in adding dates",
        error: err,
        status_code: 500,
      });
    }

    // Extracting the user id from the request
    const user_id = req.user_id;

    // Extracting the date of the attendance
    const date = fields.date;

    // Boolean indicating morning or not morning
    const part_of_day = fields.part_of_day;

    // Querying the database to check if the user has already registered for the date
    db.query(searchQuery(user_id, date, part_of_day), (error, results) => {
      if (error) {
        return res.status(500).send({
          message: "Error in adding dates",
          error: error,
        });
      }

      if (results.rows.length > 0) {
        return res.status(403).send({
          message: "User already registered for that " + part_of_day,
          status_code: 403,
        });
      }

      // Checking if there is an entry for that user in the current day
      db.query(
        "select * from calendar where user_id = $1 and date = $2",
        [user_id, date],
        (error, results) => {
          if (results.rows.length > 0) {
            // If there is an entry, update it
            db.query(
            `update calendar 
            set going_${part_of_day} = true, updated_at = NOW() 
            where user_id = ${user_id} and date = '${date}'`,
              (error, results) => {
                if (error) {
                  return res.status(500).send({
                    message: "Error in adding dates",
                    error: error,
                  });
                }

                return res.status(201).send({
                  message: "User registered for " + part_of_day,
                  status_code: 201,
                });
              }
            );
          } else {
            // Getting the evening or morning query
            const insert_query =
              part_of_day === "morning"
                ? morningQuery(user_id, date)
                : eveningQuery(user_id, date);

            // Inserting the new entry in the database
            db.query(insert_query, (error, results) => {
              if (error) {
                return res.status(500).send({
                  message: "Error in adding dates",
                  error: error,
                });
              }
              return res.status(201).send({
                message: "Date added",
                status_code: 201,
              });
            });
          }
        }
      );
    });
  });
};

// Query to search for already registered dates
const searchQuery = (user_id, date, part_of_day) => {
  return `SELECT * FROM calendar WHERE user_id = ${user_id} AND date = '${date}' AND going_${part_of_day} = true`;
};

// Defining the query for morning attendance
const morningQuery = (user_id, date) => {
  // Infering the current datetime
  return `INSERT INTO 
    calendar (user_id, date, going_morning, created_at, updated_at) 
    VALUES (${user_id}, '${date}', true, NOW(), NOW())`;
};

// Defining the query for evening attendance
const eveningQuery = (user_id, date) => {
  return `INSERT INTO 
    calendar (user_id, date, going_evening, created_at, updated_at) 
    VALUES (${user_id}, '${date}', true, NOW(), NOW())`;
};

const getCalendar = (req, res) => {
  // Extracting the start and end dates from the request 
  const start_date = req.query.start;
  const end_date = req.query.end;

  // Query to get the activity of users 
  query = `select 
    date, 
    sum(case when going_morning then 1 else 0 end) as morning_sum,
    sum(case when going_evening then 1 else 0 end) as evening_sum
  from public.calendar 
  where date >= '${start_date}' and date <= '${end_date}'
  group by date`

  // Querying the database
  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).send({
        message: "Error in getting user activity",
        error: error,
      });
    }

    return res.status(200).send({
      message: "Successfully gotten the calendar",
      data: results.rows,
      status_code: 200,
    });
  });
}

const getMorningGoers = (req, res) => {
  // Extracting the start and end dates from the request 
  const start_date = req.query.start;
  const end_date = req.query.end;

  // Query to get the activity of users 
  query = `select 
    calendar.*, users.*, user_ranks.*
  from public.calendar 
  left join 
    users on users.id = calendar.user_id
  left join 
    user_ranks on user_ranks.user_id = users.id
  where calendar.date >= '${start_date}' and calendar.date <= '${end_date}' and calendar.going_morning`

  // Querying the database
  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).send({
        message: "Error in getting user activity",
        error: error,
      });
    }

    return res.status(200).send({
      message: "Successfully gotten the morning goers",
      data: results.rows,
      status_code: 200,
    });
  });
}

const getEveningGoers = (req, res) => {
  // Extracting the start and end dates from the request 
  const start_date = req.query.start;
  const end_date = req.query.end;

  // Query to get the activity of users 
  query = `select 
    calendar.*, users.*, user_ranks.*
  from public.calendar 
  left join 
    users on users.id = calendar.user_id
  left join 
    user_ranks on user_ranks.user_id = users.id
  where calendar.date >= '${start_date}' and calendar.date <= '${end_date}' and calendar.going_evening`

  // Querying the database
  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).send({
        message: "Error in getting user activity",
        error: error,
      });
    }

    return res.status(200).send({
      message: "Successfully gotten the evening goers",
      data: results.rows,
      status_code: 200,
    });
  });
}

const toggleAttendance = (req, res) => {
  // Extracting the user id from the request
  const user_id = req.body.user_id;
  // Extracting the date and part of day from the request
  const date = req.body.date;
  const part_of_day = req.body.part_of_day;

  // Query to search for already registered dates
  const search_query = searchQuery(user_id, date, part_of_day);

  // Querying the db 
  db.query(search_query, (error, results) => {
    if (error) {
      return res.status(500).send({
        message: "Error in searching for dates",
        error: error,
      });
    }

    // Checking if the user is already registered for that part of day
    if (results.rows.length > 0) {
      // If the user is already registered, unregister him
      db.query(
        `update calendar 
        set going_${part_of_day} = false, updated_at = NOW() 
        where user_id = ${user_id} and date = '${date}'`,
        (error, results) => {
          if (error) {
            return res.status(500).send({
              message: "Error in removing dates",
              error: error,
            });
          }

          return res.status(201).send({
            message: "User unregistered for " + part_of_day,
            status_code: 201,
          });
        }
      );
    } else {
      // If the user is not registered, register him
      db.query(
        `update calendar 
        set going_${part_of_day} = true, updated_at = NOW() 
        where user_id = ${user_id} and date = '${date}'`,
        (error, results) => {
          if (error) {
            return res.status(500).send({
              message: "Error in adding dates",
              error: error,
            });
          }

          return res.status(201).send({
            message: "User registered for " + part_of_day,
            status_code: 201,
          });
        }
      );
    }
  });
};

// Exporting the addEntry function
module.exports = {
  addEntry,
  getCalendar,
  getMorningGoers,
  getEveningGoers,
  toggleAttendance
};
