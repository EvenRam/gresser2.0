const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

// GET all employees with schedule status for a specific date
router.get('/employees/:date', rejectUnauthenticated, async (req, res) => {
    try {
        const date = req.params.date || new Date().toISOString().split('T')[0];

        const sqlText = `
            WITH scheduled_employees AS (
                SELECT employee_id, job_id, date
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
                ae.display_order,
                CASE 
                    WHEN se.job_id IS NOT NULL THEN 'project'
                    ELSE 'union'
                END AS current_location,
                se.job_id AS scheduled_job_id,
                ae.is_highlighted
            FROM add_employee ae
            LEFT JOIN unions u ON ae.union_id = u.id
            LEFT JOIN scheduled_employees se ON ae.id = se.employee_id
            WHERE ae.employee_status = TRUE
            ORDER BY ae.display_order NULLS LAST, ae.first_name, ae.last_name;
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

// GET employees grouped by unions for a specific date
router.get('/withunions/:date', rejectUnauthenticated, async (req, res) => {
    try {
        const date = req.params.date;
        if (!date) {
            throw new Error('Date parameter is required');
        }

        const sqlText = `
            WITH scheduled_employees AS (
                SELECT employee_id, job_id
                FROM schedule
                WHERE date = $1
            )
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
                CASE 
                    WHEN se.job_id IS NOT NULL THEN 'project'
                    ELSE 'union'
                END AS current_location,
                ae.union_id AS employee_union_id,
                ae.is_highlighted,
                ae.display_order,
                se.job_id AS scheduled_job_id
            FROM unions u
            LEFT JOIN add_employee ae ON u.id = ae.union_id
            LEFT JOIN scheduled_employees se ON ae.id = se.employee_id
            WHERE ae.employee_status = TRUE
            ORDER BY u.union_name, ae.display_order NULLS LAST, ae.id;
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

            if (row.employee_id && row.current_location === 'union') {
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
                    display_order: row.display_order,
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

// POST endpoint for adding/updating employee with schedule
router.post('/', rejectUnauthenticated, async (req, res) => {
    console.log('User is authenticated?:', req.isAuthenticated());
    console.log('Current user is:', req.user.username);
    console.log('Current request body is:', req.body);
    
    const { 
        first_name, 
        last_name, 
        employee_number, 
        union_name, 
        employee_status, 
        phone_number, 
        email, 
        address, 
        job_id, 
        selected_date 
    } = req.body;

    try {
        await pool.query('BEGIN');

        // Validate and fetch the union ID
        const unionCheckResult = await pool.query(
            'SELECT "id" FROM "unions" WHERE "union_name" = $1',
            [union_name]
        );

        if (unionCheckResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Union does not exist. Please select a valid union.' 
            });
        }

        const unionId = unionCheckResult.rows[0].id;

        // Insert or update employee
        const employeeResult = await pool.query(
            `INSERT INTO "add_employee" (
                "first_name", "last_name", "employee_number", "employee_status", 
                "phone_number", "email", "address", "union_id", 
                "current_location", "is_highlighted"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'union', false)
            ON CONFLICT (employee_number) 
            DO UPDATE SET 
                first_name = EXCLUDED.first_name, 
                last_name = EXCLUDED.last_name, 
                employee_status = EXCLUDED.employee_status, 
                phone_number = EXCLUDED.phone_number, 
                email = EXCLUDED.email, 
                address = EXCLUDED.address, 
                union_id = EXCLUDED.union_id
            RETURNING id;`,
            [
                first_name, last_name, employee_number, employee_status, 
                phone_number, email, address, unionId
            ]
        );

        const employeeId = employeeResult.rows[0].id;

        // Handle schedule entry
        const currentDate = selected_date || new Date().toISOString().split('T')[0];
        const providedDate = new Date(currentDate);
        const today = new Date();

        // Validate date
        if (providedDate < today) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Cannot schedule for past dates.' 
            });
        }

        // Add schedule entry if job_id is provided
        if (job_id) {
            await pool.query(
                `INSERT INTO "schedule" (date, job_id, employee_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (date, job_id, employee_id)
                DO UPDATE SET 
                    job_id = EXCLUDED.job_id, 
                    employee_id = EXCLUDED.employee_id;`,
                [currentDate, job_id, employeeId]
            );
        }

        await pool.query('COMMIT');

        res.status(201).send({ 
            message: 'Employee and schedule updated successfully.', 
            employee_id: employeeId,
            date: currentDate
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating employee and schedule:', error);
        res.status(500).send('Error updating employee and schedule');
    }
});


// PUT endpoint for updating highlight status
router.put('/:id/highlight', rejectUnauthenticated, async (req, res) => {
    const employeeId = req.params.id;
    const { isHighlighted, date } = req.body;

    try {
        await pool.query('BEGIN');

        const updateQuery = `
            UPDATE add_employee
            SET is_highlighted = $1
            WHERE id = $2;
        `;
        await pool.query(updateQuery, [isHighlighted, employeeId]);

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

        const result = await pool.query(`
            SELECT 
                s.date,
                s.job_id,
                s.employee_id,
                ae.first_name,
                ae.last_name,
                j.job_name,
                u.union_name
            FROM schedule s
            JOIN add_employee ae ON s.employee_id = ae.id
            JOIN jobs j ON s.job_id = j.job_id
            LEFT JOIN unions u ON ae.union_id = u.id
            WHERE s.date BETWEEN $1 AND $2
            ORDER BY s.date, j.job_name, ae.last_name, ae.first_name;
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

module.exports = router;