const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');

// Debug helper
const debugLog = (message, data) => {
    console.log(`[DEBUG-MOVEEMPLOYEE-ROUTER] ${message}`, JSON.stringify(data, null, 2));
  };
  
  //moveemployee.router.js
  // Move employee to project or back to union
  router.post('/:date', rejectUnauthenticated, validateDate, async (req, res) => {
      const client = await pool.connect();
      try {
          // Log all incoming data
          debugLog('Received move request', {
            params: req.params,
            body: req.body,
            validatedDate: req.validatedDate
          });
          
          const { employeeId, targetProjectId, dropIndex, sourceLocation } = req.body;
          const date = req.validatedDate;
  
          await client.query('BEGIN');
  
          // Get employee info
          const employeeResult = await client.query(
              'SELECT id, union_id, first_name, last_name FROM "add_employee" WHERE "id" = $1',
              [employeeId]
          );
  
          if (employeeResult.rowCount === 0) {
              throw new Error('Employee not found');
          }
          
          const employee = employeeResult.rows[0];
          debugLog('Moving employee', {
              employeeId,
              employeeName: `${employee.first_name} ${employee.last_name}`,
              from: sourceLocation?.type || 'unknown',
              to: targetProjectId ? `project ${targetProjectId}` : 'union',
              dropIndex,
              date
          });
  
          // Handle specific date entry only
          if (targetProjectId) {
              // Log current state before changes
              const beforeStateQuery = await client.query(`
                  SELECT employee_id, employee_display_order, first_name, last_name
                  FROM schedule s
                  JOIN add_employee ae ON s.employee_id = ae.id
                  WHERE s.date = $1 AND s.job_id = $2
                  ORDER BY employee_display_order
              `, [date, targetProjectId]);
              
              debugLog('Current state before move', beforeStateQuery.rows);
              
              // Check if the drop index is valid
              if (typeof dropIndex !== 'number') {
                  debugLog('WARNING: dropIndex is not a number', dropIndex);
              }
              
              const indexPosition = typeof dropIndex === 'number' ? dropIndex : 0;
              debugLog('Using position index', indexPosition);
              
              // Make space for the new employee
              debugLog('Making space at position', indexPosition);
              await client.query(`
                  UPDATE schedule
                  SET employee_display_order = employee_display_order + 1
                  WHERE date = $1 
                      AND job_id = $2
                      AND employee_display_order >= $3
              `, [date, targetProjectId, indexPosition]);
  
              // Insert the employee at the exact position
              debugLog('Inserting employee at position', indexPosition);
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
              `, [date, employeeId, targetProjectId, indexPosition]);
  
              // Check the final state
              const afterStateQuery = await client.query(`
                  SELECT employee_id, employee_display_order, first_name, last_name
                  FROM schedule s
                  JOIN add_employee ae ON s.employee_id = ae.id
                  WHERE s.date = $1 AND s.job_id = $2
                  ORDER BY employee_display_order
              `, [date, targetProjectId]);
              
              debugLog('Final state after move', afterStateQuery.rows);
              
              // CRITICAL: No normalization step - removed the problematic code that reset positions
  
          } else {
              // Moving back to union
              debugLog('Moving back to union');
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
          debugLog('Transaction committed successfully');
          res.sendStatus(200);
      } catch (error) {
          await client.query('ROLLBACK');
          debugLog('ERROR moving employee', {
              error: error.message,
              stack: error.stack
          });
          console.error('Error moving employee:', error);
          res.status(500).send(`Error moving employee: ${error.message}`);
      } finally {
          client.release();
      }
  });
  
// Keep existing bulk operations endpoint unchanged
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