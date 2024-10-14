// Import required modules
const express = require('express');
const pool = require('../modules/pool'); // PostgreSQL connection pool
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware'); // Middleware to ensure only authenticated users can access the route

router.post('/', rejectUnauthenticated, async (req, res) => {
    const { employeeId, targetProjectId } = req.body; 

    try {
        await pool.query('BEGIN');

        const employeeResult = await pool.query(
            'SELECT union_id FROM "add_employee" WHERE "id" = $1',
            [employeeId]
        );

        if (employeeResult.rowCount === 0) {
            throw new Error('Employee not found');
        }

        const { union_id } = employeeResult.rows[0];

        // Update the employee's location without changing the union_id
        await pool.query(
            'UPDATE "add_employee" SET "job_id" = $1, "current_location" = $2 WHERE "id" = $3',
            [targetProjectId || null, targetProjectId ? 'project' : 'union', employeeId]
        );

        await pool.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error moving employee:', error);
        res.status(500).send(`Error moving employee: ${error.message}`);
    }
});



// A commented-out PUT route to update the employee's location directly
// router.put('/updatelocation/:id', async (req, res) => {
//     const employeeId = req.params.id; // Get employeeId from the route parameters
//     const { newLocation } = req.body; // Destructure the request body to get the new location (either 'project' or 'union')

//     const sqlText = `
//         UPDATE "add_employee"
//         SET "current_location" = $1
//         WHERE "id" = $2;
//     `; // SQL query to update the employee's current location

//     try {
//         await pool.query(sqlText, [newLocation, employeeId]); // Execute the query with the new location and employeeId
//         res.sendStatus(204); // Send a 204 status for a successful update (No Content)
//     } catch (error) {
//         console.error('Error updating employee location:', error); // Log any errors
//         res.sendStatus(500); // Send a 500 status if there is an error
//     }
// });

// Export the router for use in the Express app
module.exports = router;
