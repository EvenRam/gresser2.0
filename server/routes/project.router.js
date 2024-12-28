const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');

//project.router.js file
// Get projects with employees for a specific date
router.get('/withEmployees/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    try {
        const date = req.validatedDate;
        console.log('Fetching projects with employees for date:', date);
        
        const sqlText = `
        SELECT 
            j.job_id,
            j.job_name,
            j.status AS job_status,
            s.project_display_order,
            s.employee_id,
            ae.first_name AS employee_first_name,
            ae.last_name AS employee_last_name,
            ae.employee_status,
            ae.phone_number AS employee_phone_number,
            ae.email AS employee_email,
            ae.address AS employee_address,
            s.current_location,
            ae.union_id,
            s.is_highlighted,
            s.employee_display_order,
            u.union_name
        FROM jobs j
        LEFT JOIN (
            SELECT * FROM schedule 
            WHERE date = $1
        ) s ON j.job_id = s.job_id
        LEFT JOIN add_employee ae ON s.employee_id = ae.id AND ae.employee_status = true
        LEFT JOIN unions u ON ae.union_id = u.id
        WHERE j.status = 'Active'
        ORDER BY s.project_display_order NULLS LAST, j.job_id, 
                 s.employee_display_order NULLS LAST, ae.id;
        `;

        const result = await pool.query(sqlText, [date]);
        const jobs = {};

        result.rows.forEach(row => {
            if (!jobs[row.job_id]) {
                jobs[row.job_id] = {
                    id: row.job_id,
                    job_name: row.job_name,
                    display_order: row.project_display_order,
                    employees: []
                };
            }

            if (row.employee_id && row.employee_status === true) {
                jobs[row.job_id].employees.push({
                    id: row.employee_id,
                    first_name: row.employee_first_name,
                    last_name: row.employee_last_name,
                    employee_status: row.employee_status,
                    phone_number: row.employee_phone_number,
                    email: row.employee_email,
                    address: row.employee_address,
                    current_location: row.current_location,
                    union_id: row.union_id,
                    union_name: row.union_name,
                    is_highlighted: row.is_highlighted,
                    display_order: row.employee_display_order
                });
            }
        });

        res.send(Object.values(jobs));
    } catch (error) {
        console.error('Error fetching jobs with employees:', error);
        res.status(500).send('Error fetching jobs with employees');
    }
});

// Update employee order within a project for a specific date
router.put('/updateOrder', rejectUnauthenticated, validateDate, async (req, res) => {
    try {
        const { projectId, orderedEmployeeIds } = req.body;
        const date = req.validatedDate;
        
        await pool.query('BEGIN');

        // Update display order in schedule table
        for (let i = 0; i < orderedEmployeeIds.length; i++) {
            await pool.query(
                `INSERT INTO schedule 
                    (date, job_id, employee_id, employee_display_order)
                VALUES 
                    ($1, $2, $3, $4)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    employee_display_order = $4,
                    job_id = $2;`,
                [date, projectId, orderedEmployeeIds[i], i]
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

// Update project display order
router.put('/updateProjectOrder', rejectUnauthenticated, async (req, res) => {
    try {
        const { orderedProjectIds, date } = req.body;
        
        if (!Array.isArray(orderedProjectIds)) {
            throw new Error('orderedProjectIds must be an array');
        }

        if (!date) {
            throw new Error('date is required');
        }

        await pool.query('BEGIN');

        // First, ensure all projects exist in jobs table
        const projectsExist = await pool.query(
            `SELECT job_id FROM jobs WHERE job_id = ANY($1)`,
            [orderedProjectIds]
        );

        if (projectsExist.rows.length !== orderedProjectIds.length) {
            throw new Error('One or more project IDs are invalid');
        }

        // Then update the order
        for (let i = 0; i < orderedProjectIds.length; i++) {
            await pool.query(
                `UPDATE jobs 
                SET display_order = $1 
                WHERE job_id = $2`,
                [i, orderedProjectIds[i]]
            );
        }

        await pool.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating project order:', error);
        res.status(500).send(error.message);
    }
});

module.exports = router;