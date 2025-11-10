const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate,isPastDate } = require('../routes/date-validation.middleware');
//project.router.js file

// Get projects with employees for a specific date
router.get('/withEmployees/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    try {
        const date = req.validatedDate;
        console.log('Fetching projects with employees for date:', date);
        
        const isHistoricalData = isPastDate(date);
        console.log('Is this a past date?', isHistoricalData);

        let sqlText;

        if (isHistoricalData) {
            // For PAST dates: Show any project that had employees assigned
            console.log('Using query for: PAST DATE - showing historical assignments');
            sqlText = `
                SELECT 
                    j.job_id,
                    j.job_number,
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
                LEFT JOIN add_employee ae ON s.employee_id = ae.id
                LEFT JOIN unions u ON ae.union_id = u.id
                WHERE 
                    -- For past dates: show projects that had employees assigned
                    s.employee_id IS NOT NULL 
                    AND s.current_location = 'project'
                ORDER BY po.display_order NULLS LAST, j.job_name, s.employee_display_order NULLS LAST
            `;
        } else {
            // For CURRENT/FUTURE dates: Only show active projects
            console.log('Using query for: CURRENT/FUTURE DATE - showing active projects');
            sqlText = `
                SELECT 
                    j.job_id,
                    j.job_number,
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
                WHERE 
                    -- For current/future: only show active projects
                    j.status = 'Active'
                ORDER BY po.display_order NULLS LAST, j.job_name, s.employee_display_order NULLS LAST
            `;
        }
        
        console.log('SQL params:', [date]);
        const result = await pool.query(sqlText, [date]);
        console.log('Project result count:', result.rows.length);
        
        const jobs = {};
        
        result.rows.forEach(row => {
            if (!jobs[row.job_id]) {
                jobs[row.job_id] = {
                    id: row.job_id,
                    job_id: row.job_id,
                    job_number: row.job_number,
                    job_name: row.job_name,
                    job_status: row.job_status,
                    display_order: row.display_order,
                    rain_day: row.rain_day,
                    employees: []
                };
            }
            
            // Add employee if they exist
            if (row.employee_id) {
                // For past dates: include all employees who were assigned
                // For current/future: only include currently active employees
                if (isHistoricalData || row.employee_status === true) {
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
            }
        });
        
        const projectsArray = Object.values(jobs);
        console.log('Returning projects:', projectsArray.length);
        
        res.send(projectsArray);
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

        // First, lock the entire project_order table for this date
        // This prevents deadlocks by ensuring consistent lock order
        await client.query(`
            LOCK TABLE project_order IN EXCLUSIVE MODE
        `);

        // Delete all existing orders for this date
        await client.query(`
            DELETE FROM project_order 
            WHERE date = $1
        `, [date]);

        // Insert new orders
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
// In project.router.js, update the updateOrder endpoint
router.put('/updateOrder', rejectUnauthenticated, validateDate, async (req, res) => {
    const client = await pool.connect();
    try {
        const { projectId, orderedEmployeeIds, date } = req.body;
        
        if (!Array.isArray(orderedEmployeeIds) || orderedEmployeeIds.length === 0) {
            throw new Error('Invalid employee order data - must be a non-empty array');
        }
        
        console.log('Updating employee order:', {
            projectId,
            orderedEmployeeIds,
            date
        });
        
        await client.query('BEGIN');

        // First, ensure all employees are assigned to this project
        for (const employeeId of orderedEmployeeIds) {
            await client.query(`
                INSERT INTO schedule 
                    (date, employee_id, job_id, current_location)
                VALUES 
                    ($1, $2, $3, 'project')
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = $3,
                    current_location = 'project'
            `, [date, employeeId, projectId]);
        }

        // Then update each employee's order
        for (let i = 0; i < orderedEmployeeIds.length; i++) {
            await client.query(`
                UPDATE schedule 
                SET employee_display_order = $1
                WHERE date = $2 
                AND job_id = $3 
                AND employee_id = $4
            `, [i, date, projectId, orderedEmployeeIds[i]]);
        }

        await client.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating employee order:', error);
        res.status(500).send('Error updating employee order: ' + error.message);
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

