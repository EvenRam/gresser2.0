const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');


//moveemployee.router.js
// Move employee to project or back to union
router.post('/:date', rejectUnauthenticated, async (req, res) => {
   const { employeeId, targetProjectId } = req.body;
   const date = req.params.date;  // Just use the date parameter directly
  
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


       // Handle specific date entry only
       if (targetProjectId) {
           // Moving to a project
           await pool.query(
               `INSERT INTO schedule
                   (date, employee_id, job_id, current_location, is_highlighted,
                   employee_display_order)
               VALUES
                   ($1, $2, $3, 'project', TRUE,
                   (SELECT COALESCE(MAX(employee_display_order) + 1, 0)
                   FROM schedule
                   WHERE date = $1 AND job_id = $3))
               ON CONFLICT (date, employee_id)
               DO UPDATE SET
                   job_id = EXCLUDED.job_id,
                   current_location = EXCLUDED.current_location,
                   is_highlighted = EXCLUDED.is_highlighted,
                   employee_display_order = EXCLUDED.employee_display_order`,
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
                   is_highlighted = EXCLUDED.is_highlighted,
                   employee_display_order = NULL`,
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


// Add bulk operations endpoint
router.post('/bulk/:date', rejectUnauthenticated, async (req, res) => {
   const { sourceDate, employeeIds, targetProjectId } = req.body;
   const targetDate = req.params.date;  // Just use the date parameter directly


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
