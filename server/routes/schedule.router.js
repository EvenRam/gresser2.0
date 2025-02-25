const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');

//schedule.router.js
// GET all employees with schedule status for a specific date
router.get('/employees/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    try {
        const date = req.validatedDate;
        const sqlText = `
            WITH scheduled_employees AS (
                SELECT 
                    employee_id, 
                    job_id,
                    current_location,
                    is_highlighted,
                    employee_display_order,
                    date
                FROM schedule
                WHERE date = $1
            )
            SELECT 
                ae.id AS employee_id,
                ae.first_name,
                ae.last_name,
                ae.employee_status,
                ae.phone_number,
                ae.email,
                ae.address,
                ae.union_id,
                u.union_name,
                se.employee_display_order AS display_order,
                COALESCE(se.current_location, 'union') AS current_location,
                se.job_id AS scheduled_job_id,
                COALESCE(se.is_highlighted, false) AS is_highlighted
            FROM add_employee ae
            LEFT JOIN unions u ON ae.union_id = u.id
            LEFT JOIN scheduled_employees se ON ae.id = se.employee_id
            WHERE ae.employee_status = TRUE
            ORDER BY se.employee_display_order NULLS LAST, ae.first_name, ae.last_name;
        `;
        const result = await pool.query(sqlText, [date]);
        
        res.send({
            date,
            employees: result.rows
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).send(error.message);
    }
});

// GET employees grouped by unions
router.get('/withunions/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    try {
        const date = req.validatedDate;
        console.log('Fetching unions with employees for date:', date);

        const sqlText = `
            SELECT 
                u.id AS union_id,
                u.union_name,
                ae.id AS employee_id,
                ae.first_name,
                ae.last_name,
                ae.phone_number,
                ae.employee_status,
                ae.email,
                ae.address,
                COALESCE(s.current_location, 'union') AS current_location,
                ae.union_id AS employee_union_id,
                COALESCE(s.is_highlighted, false) AS is_highlighted,
                s.employee_display_order AS display_order,
                s.job_id AS scheduled_job_id
            FROM unions u
            LEFT JOIN add_employee ae ON u.id = ae.union_id
            LEFT JOIN (
                SELECT * FROM schedule WHERE date = $1
            ) s ON ae.id = s.employee_id
            WHERE ae.employee_status = TRUE
            AND (
                s.employee_id IS NULL  -- Not scheduled for this date
                OR (s.current_location = 'union')  -- Explicitly in union
            )
            ORDER BY u.union_name, s.employee_display_order NULLS LAST, ae.id;
        `;
        
        const result = await pool.query(sqlText, [date]);
        const unions = {};
        
        result.rows.forEach(row => {
            if (!unions[row.union_id]) {
                unions[row.union_id] = {
                    id: row.union_id,
                    union_name: row.union_name,
                    employees: []
                };
            }

            if (row.employee_id) {
                unions[row.union_id].employees.push({
                    id: row.employee_id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    phone_number: row.phone_number,
                    employee_status: row.employee_status,
                    email: row.email,
                    address: row.address,
                    current_location: row.current_location,
                    union_id: row.employee_union_id,
                    is_highlighted: row.is_highlighted,
                    display_order: row.employee_display_order,
                    scheduled_job_id: row.scheduled_job_id
                });
            }
        });
        
        res.send({
            date,
            unions: Object.values(unions)
        });
    } catch (error) {
        console.error('Error fetching unions with employees:', error);
        res.status(500).send(error.message);
    }
});

// PUT endpoint for updating highlight status
router.put('/:date/:id/highlight', rejectUnauthenticated, validateDate, async (req, res) => {
    const employeeId = req.params.id;
    const date = req.validatedDate;
    const { isHighlighted } = req.body;
    
    try {
        await pool.query('BEGIN');
        await pool.query(
            `INSERT INTO schedule 
                (date, employee_id, is_highlighted, current_location)
            VALUES 
                ($1, $2, $3, COALESCE(
                    (SELECT current_location FROM schedule WHERE date = $1 AND employee_id = $2),
                    'union'
                ))
            ON CONFLICT (date, employee_id) 
            DO UPDATE SET is_highlighted = $3`,
            [date, employeeId, isHighlighted]
        );
        await pool.query('COMMIT');
        res.sendStatus(204);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating highlight status:', error);
        res.status(500).send(error.message);
    }
});

// GET endpoint for date range schedule
router.get('/range', rejectUnauthenticated, async (req, res) => {
    const { startDate, endDate } = req.query;
    
    try {
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required');
        }

        // Basic date validation
        const validStartDate = new Date(startDate);
        const validEndDate = new Date(endDate);
        
        if (isNaN(validStartDate.getTime()) || isNaN(validEndDate.getTime())) {
            throw new Error('Invalid date format');
        }

        if (validEndDate < validStartDate) {
            throw new Error('End date cannot be before start date');
        }

        const result = await pool.query(`
            SELECT 
                s.date,
                s.job_id,
                s.employee_id,
                s.current_location,
                s.is_highlighted,
                s.employee_display_order,
                s.project_display_order,
                ae.first_name,
                ae.last_name,
                j.job_name,
                u.union_name
            FROM schedule s
            JOIN add_employee ae ON s.employee_id = ae.id
            LEFT JOIN jobs j ON s.job_id = j.job_id
            LEFT JOIN unions u ON ae.union_id = u.id
            WHERE s.date BETWEEN $1 AND $2
            ORDER BY s.date, s.project_display_order NULLS LAST, j.job_name, 
                     s.employee_display_order NULLS LAST, ae.last_name, ae.first_name;
        `, [startDate, endDate]);
        
        res.send({
            startDate,
            endDate,
            schedules: result.rows
        });
    } catch (error) {
        console.error('Error fetching schedule range:', error);
        res.status(500).send(error.message);
    }
});

router.post('/finalize/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    const client = await pool.connect();
    try {
        const currentDate = req.validatedDate;
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const formattedNextDate = nextDate.toISOString().split('T')[0];
        
        await client.query('BEGIN');

        // 1. Copy schedule entries (employee assignments and highlights)
        await client.query(`
            INSERT INTO schedule 
                (date, job_id, employee_id, current_location, 
                 is_highlighted, employee_display_order)
            SELECT 
                $2, job_id, employee_id, current_location,
                is_highlighted, employee_display_order
            FROM schedule
            WHERE date = $1
        `, [currentDate, formattedNextDate]);

        // 2. Copy project_order entries (project ordering and rain day status)
        await client.query(`
            INSERT INTO project_order 
                (date, job_id, display_order, rain_day)
            SELECT 
                $2, job_id, display_order, FALSE
            FROM project_order
            WHERE date = $1
        `, [currentDate, formattedNextDate]);

        await client.query('COMMIT');
        res.json({ nextDate: formattedNextDate });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error finalizing schedule:', error);
        res.status(500).send(error.message);
    } finally {
        client.release();
    }
});

module.exports = router;