const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');

// Get projects with employees for a specific date
router.get('/withEmployees/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    try {
        const date = req.validatedDate;
        
        const sqlText = `
        SELECT 
            j.job_id,
            j.job_name,
            j.status AS job_status,
            po.display_order,
            po.rain_day,
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
        LEFT JOIN project_order po ON j.job_id = po.job_id AND po.date = $1
        LEFT JOIN schedule s ON j.job_id = s.job_id AND s.date = $1
        LEFT JOIN add_employee ae ON s.employee_id = ae.id AND ae.employee_status = true
        LEFT JOIN unions u ON ae.union_id = u.id
        WHERE j.status = 'Active'
        ORDER BY po.display_order NULLS LAST, j.job_id,
                s.employee_display_order NULLS LAST
        `;
        
        const result = await pool.query(sqlText, [date]);
        const jobs = {};
        
        result.rows.forEach(row => {
            if (!jobs[row.job_id]) {
                jobs[row.job_id] = {
                    id: row.job_id,
                    job_name: row.job_name,
                    display_order: row.display_order,
                    rain_day: row.rain_day,
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

// Update project display order
router.put('/updateProjectOrder', rejectUnauthenticated, validateDate, async (req, res) => {
    const client = await pool.connect();
    try {
        const { orderedProjectIds } = req.body;
        const date = req.validatedDate;

        if (!Array.isArray(orderedProjectIds)) {
            throw new Error('orderedProjectIds must be an array');
        }

        await client.query('BEGIN');

        await client.query(`LOCK TABLE project_order IN EXCLUSIVE MODE`);

        await client.query(`
            DELETE FROM project_order 
            WHERE date = $1
        `, [date]);

        for (let i = 0; i < orderedProjectIds.length; i++) {
            await client.query(`
                INSERT INTO project_order (date, job_id, display_order)
                VALUES ($1, $2, $3)
            `, [date, orderedProjectIds[i], i]);
        }

        await client.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating project order:', error);
        res.status(500).send(error.message);
    } finally {
        client.release();
    }
});

// Update employee order within a project for a specific date
router.put('/updateOrder', rejectUnauthenticated, validateDate, async (req, res) => {
    const client = await pool.connect();
    try {
        const { projectId, orderedEmployeeIds } = req.body;
        const date = req.validatedDate;

        if (!Array.isArray(orderedEmployeeIds)) {
            throw new Error('orderedEmployeeIds must be an array of objects with id and display_order');
        }
        
        await client.query('BEGIN');
        
        // Lock the relevant rows to prevent concurrent modifications
        await client.query(`
            LOCK TABLE schedule IN SHARE ROW EXCLUSIVE MODE
        `);

        // Update or insert each employee's order
        for (const { id, display_order } of orderedEmployeeIds) {
            await client.query(
                `INSERT INTO schedule 
                    (date, job_id, employee_id, employee_display_order, current_location)
                VALUES 
                    ($1, $2, $3, $4, 'project')
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    employee_display_order = $4,
                    job_id = $2,
                    current_location = 'project';`,
                [date, projectId, id, display_order]
            );
        }

        await client.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating employee order:', error);
        res.status(500).send(error.message);
    } finally {
        client.release();
    }
});

// Update rain day status
router.put('/:jobId/rainday', rejectUnauthenticated, validateDate, async (req, res) => {
    const { jobId } = req.params;
    const { isRainDay } = req.body;
    const date = req.validatedDate;

    try {
        await pool.query('BEGIN');
        
        await pool.query(
            `INSERT INTO project_order (date, job_id, rain_day)
             VALUES ($1, $2, $3)
             ON CONFLICT (date, job_id)
             DO UPDATE SET rain_day = $3`,
            [date, jobId, isRainDay]
        );

        await pool.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating rain day status:', error);
        res.status(500).send(error.message);
    }
});

module.exports = router;