const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

//MOVEEMPLOYEE.ROUTER.JS
// Simple date validation middleware
const validateDate = (req, res, next) => {
    const date = req.params.date || req.body.date;
    if (!date) {
        return res.status(400).send('Date is required');
    }
    
    try {
        const requestDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        if (isNaN(requestDate.getTime())) {
            return res.status(400).send('Invalid date format');
        }

        if (requestDate > today) {
            return res.status(400).send('Cannot access or modify future dates');
        }

        next();
    } catch (error) {
        return res.status(400).send('Invalid date');
    }
};

router.post('/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    const { employeeId, targetProjectId } = req.body;
    const date = req.params.date;

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
                    current_location = EXCLUDED.current_location,
                    is_highlighted = EXCLUDED.is_highlighted`,
                [date, employeeId, targetProjectId]
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
                    current_location = EXCLUDED.current_location,
                    is_highlighted = EXCLUDED.is_highlighted`,
                [date, employeeId]
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