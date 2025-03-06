const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');

// Move employee to project or back to union with specific position
router.post('/:date', rejectUnauthenticated, validateDate, async (req, res) => {
    const { employeeId, targetProjectId, dropIndex } = req.body;
    const date = req.validatedDate;
    
    console.log('moveemployee.router received:', {
        employeeId,
        targetProjectId,
        dropIndex,
        date,
        rawDropIndex: req.body.dropIndex, // Check if there's any transformation happening
        bodyKeys: Object.keys(req.body)
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
                initialDropIndex: dropIndex
            });
            
            // Get current max display order for proper last position handling
            const maxDisplayOrderResult = await pool.query(
                `SELECT COALESCE(MAX(employee_display_order), -1) as max_order,
                 COUNT(*) as employee_count
                 FROM schedule 
                 WHERE date = $1 AND job_id = $2`,
                [date, targetProjectId]
            );
            
            const maxDisplayOrder = maxDisplayOrderResult.rows[0].max_order;
            const employeeCount = maxDisplayOrderResult.rows[0].employee_count;
            
            // Validate drop index - ensure it's not null/undefined and is within valid range
            let validDropIndex = dropIndex;
            if (validDropIndex === undefined || validDropIndex === null) {
                // If no index provided, append to end
                validDropIndex = maxDisplayOrder + 1;
            } else if (validDropIndex > maxDisplayOrder + 1) {
                // Ensure index doesn't exceed valid range
                validDropIndex = maxDisplayOrder + 1;
            }
            
            console.log('moveemployee.router processed index:', {
                originalDropIndex: dropIndex,
                validatedDropIndex: validDropIndex,
                maxDisplayOrder,
                employeeCount,
                isLastPosition: validDropIndex > maxDisplayOrder,
                maxPlusOne: maxDisplayOrder + 1
            });
            
            // Get existing employee position if any
            const existingEmployeeQuery = await pool.query(
                `SELECT employee_display_order, job_id 
                 FROM schedule 
                 WHERE date = $1 AND employee_id = $2`,
                [date, employeeId]
            );
            
            const existingPosition = existingEmployeeQuery.rows[0]?.employee_display_order;
            const existingJobId = existingEmployeeQuery.rows[0]?.job_id;
            
            console.log('Existing employee position:', {
                employeeId,
                existingPosition,
                existingJobId,
                isSameProject: existingJobId == targetProjectId, // Use == for type coercion
                moveType: existingJobId == targetProjectId ? 'reorder' : 'new-assignment'
            });
            
            // First, make space for the new employee by adjusting existing employees' positions
            if (existingJobId == targetProjectId && existingPosition < validDropIndex) {
                // If moving later in same project, adjust the index
                console.log('Moving later in same project - adjusting index');
                validDropIndex = validDropIndex - 1;
            }
            
            // Now recheck if this is the last position
            const isLastPosition = validDropIndex > maxDisplayOrder;
            console.log('Final position check:', {
                validDropIndex,
                maxDisplayOrder,
                isLastPosition
            });
            
            // First, make space for the new employee by adjusting existing employees' positions
            const updateResult = await pool.query(
                `UPDATE schedule 
                SET employee_display_order = employee_display_order + 1
                WHERE date = $1 
                  AND job_id = $2 
                  AND employee_display_order >= $3
                  AND employee_id != $4`,
                [date, targetProjectId, validDropIndex, employeeId]
            );
            
            console.log('Space making result:', {
                rowsAffected: updateResult.rowCount,
                date,
                targetProjectId,
                validDropIndex
            });

            // Now insert or update the employee at the exact position
            const insertResult = await pool.query(
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
                    employee_display_order = EXCLUDED.employee_display_order
                RETURNING *`,
                [date, employeeId, targetProjectId, validDropIndex]
            );
            
            console.log('Insert/update result:', {
                result: insertResult.rows[0],
                finalPosition: insertResult.rows[0]?.employee_display_order
            });
            
            // Verify final order
            const finalOrderQuery = await pool.query(
                `SELECT employee_id, employee_display_order 
                 FROM schedule 
                 WHERE date = $1 AND job_id = $2
                 ORDER BY employee_display_order`,
                [date, targetProjectId]
            );
            
            console.log('Final project order:', {
                employees: finalOrderQuery.rows,
                employeeCount: finalOrderQuery.rows.length
            });
        } else {
            // Moving back to union
            console.log('Moving back to union:', {
                employeeId,
                date
            });
            
            await pool.query(
                `INSERT INTO schedule 
                    (date, employee_id, current_location, is_highlighted)
                VALUES 
                    ($1, $2, 'union', FALSE)
                ON CONFLICT (date, employee_id) 
                DO UPDATE SET 
                    job_id = NULL,
                    current_location = EXCLUDED.current_location,
                    is_highlighted = EXCLUDED.is_highlighted,
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