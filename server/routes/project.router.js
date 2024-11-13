const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

router.get('/withEmployees', async (req, res) => {
    try {
        const sqlText = `
        SELECT 
            jobs.job_id AS job_id, 
            jobs.job_name AS job_name, 
            jobs.status AS job_status,
            jobs.display_order AS display_order,
            add_employee.id AS employee_id, 
            add_employee.first_name AS employee_first_name,
            add_employee.last_name AS employee_last_name,
            add_employee.employee_status AS employee_status,
            add_employee.phone_number AS employee_phone_number,
            add_employee.email AS employee_email,
            add_employee.address AS employee_address,
            add_employee.current_location AS current_location,
            add_employee.union_id AS union_id,
            add_employee.is_highlighted AS is_highlighted,
            add_employee.display_order AS employee_display_order,
            unions.union_name AS union_name
        FROM jobs
        LEFT JOIN add_employee ON jobs.job_id = add_employee.job_id
        LEFT JOIN unions ON add_employee.union_id = unions.id
        WHERE jobs.status = 'Active'
        ORDER BY jobs.display_order NULLS LAST, jobs.job_id, add_employee.display_order NULLS LAST, add_employee.id
        `;
        
        const result = await pool.query(sqlText);
        
        const jobs = {};
        
        result.rows.forEach(row => {
            if (!jobs[row.job_id]) {
                jobs[row.job_id] = {
                    id: row.job_id,
                    job_name: row.job_name,
                    display_order: row.display_order,
                    employees: []
                };
            }
  
            if (row.employee_id && row.employee_status === true) {
                jobs[row.job_id].employees.push({
                    id: row.employee_id,
                    first_name: row.employee_first_name,
                    last_name: row.employee_last_name,
                    employee_status: row.employee_status,
                    phone_number: row.phone_number,
                    email: row.email,
                    address: row.address,
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

router.put('/updateProjectOrder', async (req, res) => {
    try {
        const { orderedProjectIds } = req.body;
        
        await pool.query('BEGIN');

        // Update each project's display_order
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
        res.status(500).send('Error updating project order');
    }
});

module.exports = router;