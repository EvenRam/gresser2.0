const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');

//moveemployee.router.js
// Move employee to project or back to union
router.post('/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    const client = await pool.connect();
    try {
        const { employeeId, targetProjectId, insertIndex } = req.body;
        const date = req.validatedDate;

        await client.query('BEGIN');

        // Get employee info
        const employeeResult = await client.query(
            'SELECT id, union_id FROM "add_employee" WHERE "id" = $1',
            [employeeId]
        );

        if (employeeResult.rowCount === 0) {
            throw new Error('Employee not found');
        }

        if (targetProjectId) {
            // Moving to a project
            
            // First, get current max display order for target project
            const currentOrderResult = await client.query(`
                SELECT 
                    COUNT(*) as employee_count,
                    MAX(employee_display_order) as max_order
                FROM schedule 
                WHERE date = $1 AND job_id = $2
            `, [date, targetProjectId]);
            
            const { employee_count, max_order } = currentOrderResult.rows[0];
            let newDisplayOrder;

            if (insertIndex !== undefined) {
                // If specific position requested, shift existing employees
                await client.query(`
                    UPDATE schedule
                    SET employee_display_order = employee_display_order + 1
                    WHERE date = $1 
                        AND job_id = $2
                        AND employee_display_order >= $3
                `, [date, targetProjectId, insertIndex]);
                
                newDisplayOrder = insertIndex;
            } else {
                // If no position specified, append to end
                newDisplayOrder = (max_order !== null ? max_order : -1) + 1;
            }

            // Insert or update employee position
            await client.query(`
                INSERT INTO schedule 
                    (date, employee_id, job_id, current_location, is_highlighted,
                    employee_display_order)
                VALUES 
                    ($1, $2, $3, 'project', TRUE, $4)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = EXCLUDED.job_id,
                    current_location = EXCLUDED.current_location,
                    is_highlighted = EXCLUDED.is_highlighted,
                    employee_display_order = EXCLUDED.employee_display_order
            `, [date, employeeId, targetProjectId, newDisplayOrder]);

            // Ensure display orders are sequential
            await client.query(`
                WITH ranked AS (
                    SELECT 
                        employee_id,
                        ROW_NUMBER() OVER (
                            ORDER BY 
                                CASE 
                                    WHEN employee_id = $3 THEN $4
                                    ELSE employee_display_order 
                                END
                        ) - 1 as new_order
                    FROM schedule
                    WHERE date = $1 AND job_id = $2
                )
                UPDATE schedule s
                SET employee_display_order = r.new_order
                FROM ranked r
                WHERE s.date = $1 
                    AND s.job_id = $2
                    AND s.employee_id = r.employee_id
            `, [date, targetProjectId, employeeId, newDisplayOrder]);

        } else {
            // Moving back to union
            await client.query(`
                INSERT INTO schedule 
                    (date, employee_id, current_location, is_highlighted)
                VALUES 
                    ($1, $2, 'union', FALSE)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = NULL,
                    current_location = EXCLUDED.current_location,
                    is_highlighted = EXCLUDED.is_highlighted,
                    employee_display_order = NULL
            `, [date, employeeId]);
        }

        await client.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error moving employee:', error);
        res.status(500).send(`Error moving employee: ${error.message}`);
    } finally {
        client.release();
    }
});

// Add bulk operations endpoint
router.post('/bulk/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    const { sourceDate, employeeIds, targetProjectId } = req.body;
    const targetDate = req.validatedDate;

    try {
        await pool.query('BEGIN');

        for (const employeeId of employeeIds) {
            if (targetProjectId) {
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
                    [targetDate, employeeId, targetProjectId]
                );
            } else {
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
                    [targetDate, employeeId]
                );
            }
        }

        await pool.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error in bulk move operation:', error);
        res.status(500).send(`Error in bulk move operation: ${error.message}`);
    }
});

module.exports = router;