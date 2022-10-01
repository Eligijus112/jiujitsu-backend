// Password hashing
const bcrypt = require("bcrypt");

// Importing the connection to the database
const db = require("../db/connection");

// Defining the rank update API 
const updateRank = (req, res) => {
    // Getting the id of the user
    const id = parseInt(req.params.id);

    // Getting the new rank
    const rank = req.body.rank;
    const stripes = req.body.stripes;

    // Getting teh datetime of the request
    const datetime = new Date();

    // Infering the user_id and the id are the same OR the user is admin
    if (!(req.user_id === id || req.is_admin)) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Cheking if the user exists in the table 
    db.query("SELECT id FROM user_ranks WHERE user_id = $1", [id], (error, results) => {
        if (error) {
            throw error;
        }

        // If the user exists, update the rank
        if (results.rows.length > 0) {
            db.query(
                "UPDATE user_ranks SET rank_name = $1, stripe_count = $2, rank_datetime = $3 WHERE user_id = $4",
                [rank, stripes, datetime, id],
                (error, results) => {
                    if (error) {
                        throw error;
                    }
                    res.status(200).send(`Rank modified for user: ${id}`);
                }
            );
        } else {
            // If the user is non existant, adding a new row to the table
            db.query(
                "INSERT INTO user_ranks (user_id, rank_name, stripe_count, rank_datetime) VALUES ($1, $2, $3, $4)",
                [id, rank, stripes, datetime],
                (error, results) => {
                    if (error) {
                        throw error;
                    }
                    res.status(201).send(`Rank added for user: ${id}`);
                }
            );
        }
    });
}

// Exporting all the endpoints
module.exports = {
    updateRank
}