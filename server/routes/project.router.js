const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

// Updated GET route to include 'schedule' table
router.get('/withEmployees', async (req, res) => {
    try {
        const selectedDate = req.query.date || new Date().toISOString().split('T')[0];
        console.log("Selected Date for Project Get Route:", selectedDate);

        const sqlText = `
        WITH scheduled_jobs AS (
            SELECT s.job_id, s.employee_id, s.date AS schedule_date
            FROM schedule s
            WHERE s.date = $1
        )
        SELECT 
            jobs.job_id AS job_id, 
            jobs.job_name AS job_name, 
            jobs.status AS job_status,
            json_agg(
                json_build_object(
                    'id', add_employee.id,
                    'first_name', add_employee.first_name,
                    'last_name', add_employee.last_name,
                    'employee_status', add_employee.employee_status,
                    'phone_number', add_employee.phone_number,
                    'email', add_employee.email,
                    'address', add_employee.address,
                    'current_location', add_employee.current_location,
                    'union_id', add_employee.union_id,
                    'union_name', unions.union_name,
                    'is_highlighted', add_employee.is_highlighted,
                    'display_order', add_employee.display_order,
                    'schedule_date', sj.schedule_date,
                    'is_scheduled', CASE WHEN sj.job_id IS NOT NULL THEN TRUE ELSE FALSE END
                )
            ) AS employees
        FROM jobs
        LEFT JOIN add_employee ON jobs.job_id = add_employee.job_id AND add_employee.employee_status = TRUE
        LEFT JOIN unions ON add_employee.union_id = unions.id
        LEFT JOIN scheduled_jobs sj ON add_employee.id = sj.employee_id
        WHERE jobs.status = 'Active'
        GROUP BY jobs.job_id, jobs.job_name, jobs.status
        ORDER BY jobs.job_id;
        `;

        const result = await pool.query(sqlText, [selectedDate]);

        res.send({
            date: selectedDate,
            jobs: result.rows
        });
    } catch (error) {
        console.error('Error fetching jobs with employees:', error);
        res.status(500).send('Error fetching jobs with employees');
    }
});


router.put('/updateOrder', async (req, res) => {
    try {
        const { projectId, orderedEmployeeIds } = req.body;
        
        await pool.query('BEGIN');

        // Update each employee's display_order
        for (let i = 0; i < orderedEmployeeIds.length; i++) {
            await pool.query(
                `UPDATE add_employee 
                 SET display_order = $1 
                 WHERE id = $2 AND job_id = $3`,
                [i, orderedEmployeeIds[i], projectId]
            );
        }

        await pool.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating employee order:', error);
        res.status(500).send('Error updating employee order');
    }
});

module.exports = router;