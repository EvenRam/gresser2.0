const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware'); 


router.post('/', rejectUnauthenticated, async (req, res) => {
    const { employeeId, targetProjectId, date } = req.body; 
    const selectedDate = date || new Date().toISOString().split('T')[0];
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
        // Handle schedule table update
        if (targetProjectId) {
            // Check if there's already a schedule entry for this employee on this date
            const existingSchedule = await pool.query(
                'SELECT * FROM schedule WHERE employee_id = $1 AND date = $2',
                [employeeId, selectedDate]
            );
            if (existingSchedule.rowCount === 0) {
                // If no existing schedule, insert new entry
                await pool.query(
                    'INSERT INTO schedule (employee_id, job_id, date) VALUES ($1, $2, $3)',
                    [employeeId, targetProjectId, selectedDate]
                );
            } else {
                // If schedule exists, update it
                await pool.query(
                    'UPDATE schedule SET job_id = $1 WHERE employee_id = $2 AND date = $3',
                    [targetProjectId, employeeId, selectedDate]
                );
            }
        } else {
            // If moving back to union, remove from schedule
            await pool.query(
                'DELETE FROM schedule WHERE employee_id = $1 AND date = $2',
                [employeeId, selectedDate]
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
