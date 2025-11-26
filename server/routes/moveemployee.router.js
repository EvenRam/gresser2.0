
const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');
// Move employee to project or back to union with specific position
router.post('/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    const { employeeId, targetProjectId, dropIndex } = req.body;
    const date = req.validatedDate;
    
    // Simple logging without transformation checks
    console.log('moveemployee.router received:', {
        employeeId,
        targetProjectId,
        dropIndex,
        date
    });
    
    try {
        await pool.query('BEGIN');
        // Get employee info
        const employeeResult = await pool.query(
            'SELECT id, union_id FROM "add_employee" WHERE "id" = $1',
            [employeeId]
        );
        if (employeeResult.rowCount === 0) {
            throw new Error('Employee not found');
        }
        if (targetProjectId) {
            // Moving to a project at a specific position
            console.log('Moving to project:', {
                employeeId,
                targetProjectId,
                dropIndex
            });
            
            // Check if employee is already in this project
            const existingEmployeeQuery = await pool.query(
                `SELECT employee_display_order, job_id 
                 FROM schedule 
                 WHERE date = $1 AND employee_id = $2`,
                [date, employeeId]
            );
            
            const existingPosition = existingEmployeeQuery.rows[0]?.employee_display_order;
            const existingJobId = existingEmployeeQuery.rows[0]?.job_id;
            
            // Use the dropIndex directly from frontend - convert to integer if needed
            let finalDropIndex = dropIndex !== undefined && dropIndex !== null ? 
                parseInt(dropIndex, 10) : null;
                
            // Handle case when no drop index is provided
            if (finalDropIndex === null) {
                // Get current max display order for last position
                const maxOrderResult = await pool.query(
                    `SELECT COALESCE(MAX(employee_display_order), -1) as max_order
                     FROM schedule 
                     WHERE date = $1 AND job_id = $2`,
                    [date, targetProjectId]
                );
                finalDropIndex = maxOrderResult.rows[0].max_order + 1;
            }
            
            console.log('Using final drop index:', finalDropIndex);
            
            // Make space for the employee by adjusting existing employees
            await pool.query(
                `UPDATE schedule 
                SET employee_display_order = employee_display_order + 1
                WHERE date = $1 
                  AND job_id = $2 
                  AND employee_display_order >= $3
                  AND employee_id != $4`,
                [date, targetProjectId, finalDropIndex, employeeId]
            );
            // Insert or update the employee at the exact position
            await pool.query(
                `INSERT INTO schedule 
                    (date, employee_id, job_id, current_location, is_highlighted,
                    employee_display_order)
                VALUES 
                    ($1, $2, $3, 'project', TRUE, $4)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = EXCLUDED.job_id,
                    current_location = EXCLUDED.current_location,
                    is_highlighted = EXCLUDED.is_highlighted,
                    employee_display_order = EXCLUDED.employee_display_order`,
                [date, employeeId, targetProjectId, finalDropIndex]
            );
        } else {
            // Moving back to union - keep this functionality unchanged
            console.log('Moving back to union:', {
                employeeId,
                date
            });
            
            await pool.query(
                `INSERT INTO schedule 
                    (date, employee_id, current_location, is_highlighted)
                VALUES 
                    ($1, $2, 'union', TRUE)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = NULL,
                    current_location = EXCLUDED.current_location,
                    is_highlighted = TRUE,
                    employee_display_order = NULL`,
                [date, employeeId]
            );
        }
        await pool.query('COMMIT');
        console.log('Transaction committed successfully');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error moving employee:', error);
        res.status(500).send(`Error moving employee: ${error.message}`);
    }
});
// Add bulk operations endpoint - keep as is
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
