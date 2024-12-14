const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware'); 

//moveemployee.router
router.post('/', rejectUnauthenticated, async (req, res) => {
    const { employeeId, targetProjectId, date } = req.body;
    const selectedDate = date || new Date().toISOString().split('T')[0];

    try {
        await pool.query('BEGIN');

        // Verify employee exists and get their union_id
        const employeeResult = await pool.query(
            'SELECT id, union_id FROM "add_employee" WHERE "id" = $1',
            [employeeId]
        );

        if (employeeResult.rowCount === 0) {
            throw new Error('Employee not found');
        }

        // We don't update add_employee table anymore since it doesn't have these columns
        // Instead, we only update the schedule table

        if (targetProjectId) {
            // Moving to a project
            await pool.query(
                `INSERT INTO schedule 
                    (date, employee_id, job_id, current_location, is_highlighted)
                VALUES 
                    ($1, $2, $3, 'project', TRUE)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = EXCLUDED.job_id,
                    current_location = 'project',
                    is_highlighted = TRUE`,
                [selectedDate, employeeId, targetProjectId]
            );
        } else {
            // Moving back to union
            await pool.query(
                `INSERT INTO schedule 
                    (date, employee_id, current_location, is_highlighted)
                VALUES 
                    ($1, $2, 'union', FALSE)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = NULL,
                    current_location = 'union',
                    is_highlighted = FALSE`,
                [selectedDate, employeeId]
            );
        }

        await pool.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error moving employee:', error);
        res.status(500).send(`Error moving employee: ${error.message}`);
    }
});
module.exports = router;
