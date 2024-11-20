const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');


router.get('/employees', async (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User is authenticated?:', req.isAuthenticated());
        console.log("Current user is: ", req.user.username);
        
        // Get the date from the request query, or use the current date
        const selectedDate = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

        console.log("Selected or current date:", selectedDate);

        // SQL query to retrieve employee data with schedule information
        const sqlText = `
            SELECT ae.*, u.union_name, ae.is_highlighted, s.date AS schedule_date, s.job_id
            FROM "add_employee" ae
            LEFT JOIN "unions" u ON ae."union_id" = u."id"
            LEFT JOIN "schedule" s ON ae."id" = s."employee_id" AND s."date" = $1
        `;

        try {
            const result = await pool.query(sqlText, [selectedDate]);
            console.log(`GET from database add_employee with schedule`, result.rows);

            res.send({
                date: selectedDate,
                employees: result.rows,
            });
        } catch (error) {
            console.error(`Error making database query ${sqlText}`, error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(401);
    }
});



// // GET route to fetch all employee details and their schedules for a selected date
// router.get('/', rejectUnauthenticated, async (req, res) => {
//     // Use the selected date from query or default to the current date
//     const selectedDate = req.query.date || new Date().toISOString().slice(0, 10);

//     console.log("Selected date in query:", selectedDate);

//     const sqlText = `
//         WITH selected_schedule AS (
//             SELECT s.job_id, s.employee_id
//             FROM "schedule" s
//             WHERE s.date = CAST($1 AS DATE)
//         ),
//         latest_schedule AS (
//             SELECT s.job_id, s.employee_id
//             FROM "schedule" s
//             WHERE s.date < CAST($1 AS DATE)
//             ORDER BY s.date DESC
//             LIMIT 1
//         )
//         SELECT 
//             j.job_id AS job_id,
//             j.job_name AS job_name,
//             j.location AS job_location,
//             j.status AS job_status,
//             ae.id AS employee_id,               
//             ae.first_name AS employee_first_name,
//             ae.last_name AS employee_last_name,
//             ae.employee_number AS employee_number,
//             ae.employee_status AS employee_status,
//             ae.phone_number AS employee_phone_number,
//             ae.email AS employee_email,
//             ae.address AS employee_address,
//             ae.current_location AS employee_current_location,
//             ae.job_id AS employee_job_id,
//             ae.union_id AS employee_union_id,
//             ae.is_highlighted AS employee_is_highlighted,
//             ae.display_order AS employee_display_order,
//             u.union_name AS union_name
//         FROM "jobs" j
//         LEFT JOIN "add_employee" ae ON j.job_id = ae.job_id
//         LEFT JOIN "unions" u ON ae.union_id = u.id
//         WHERE j.status = 'active'
//           AND ae.employee_status = TRUE
//           AND (
//               EXISTS (SELECT 1 FROM selected_schedule ss WHERE ss.job_id = j.job_id AND ss.employee_id = ae.id)
//               OR
//               NOT EXISTS (SELECT 1 FROM selected_schedule)
//               AND EXISTS (SELECT 1 FROM latest_schedule ls WHERE ls.job_id = j.job_id AND ls.employee_id = ae.id)
//           );
//     `;

//     console.log("SQL Query:", sqlText);

//     try {
//         const result = await pool.query(sqlText, [selectedDate]);
//         console.log('Active jobs and employees for date retrieved:', result.rows);
//         res.send(result.rows);
//     } catch (error) {
//         console.error('Error fetching active jobs and employees:', error);
//         res.status(500).send('Error fetching active jobs and employees');
//     }
// });


// GET route to fetch all employee details and their schedules for a selected date
// router.get('/', rejectUnauthenticated, async (req, res) => {
//     const selectedDate = req.query.date;

//     console.log("Selected date in query:", selectedDate);

//     const sqlText = `
//         WITH selected_schedule AS (
//             SELECT s.job_id, s.employee_id
//             FROM "schedule" s
//             WHERE s.date = CAST($1 AS DATE)
//         ),
//         latest_schedule AS (
//             SELECT s.job_id, s.employee_id
//             FROM "schedule" s
//             WHERE s.date < CAST($1 AS DATE)
//             ORDER BY s.date DESC
//             LIMIT 1
//         )
//         SELECT 
//             j.job_id AS job_id,
//             j.job_name AS job_name,
//             j.location AS job_location,
//             j.status AS job_status,
//             ae.id AS employee_id,               
//             ae.first_name AS employee_first_name,
//             ae.last_name AS employee_last_name,
//             ae.employee_number AS employee_number,
//             ae.employee_status AS employee_status,
//             ae.phone_number AS employee_phone_number,
//             ae.email AS employee_email,
//             ae.address AS employee_address,
//             ae.current_location AS employee_current_location,
//             ae.job_id AS employee_job_id,
//             ae.union_id AS employee_union_id,
//             ae.is_highlighted AS employee_is_highlighted,
//             ae.display_order AS employee_display_order,
//             u.union_name AS union_name
//         FROM "jobs" j
//         LEFT JOIN "add_employee" ae ON j.job_id = ae.job_id
//         LEFT JOIN "unions" u ON ae.union_id = u.id
//         WHERE j.status = 'active'
//           AND ae.employee_status = TRUE
//           AND (
//               EXISTS (SELECT 1 FROM selected_schedule ss WHERE ss.job_id = j.job_id AND ss.employee_id = ae.id)
//               OR
//               NOT EXISTS (SELECT 1 FROM selected_schedule)
//               AND EXISTS (SELECT 1 FROM latest_schedule ls WHERE ls.job_id = j.job_id AND ls.employee_id = ae.id)
//           );
//     `;

//     console.log("SQL Query:", sqlText);

//     try {
//         const result = await pool.query(sqlText, [selectedDate]);
//         console.log('Active jobs and employees for date retrieved:', result.rows);
//         res.send(result.rows);
//     } catch (error) {
//         console.error('Error fetching active jobs and employees:', error);
//         res.status(500).send('Error fetching active jobs and employees');
//     }
// });

// router.get('/withunions', async (req, res) => {
//     const selectedDate = req.query.date; 
//     console.log("Selected date in query for withunions:", selectedDate);

//     try {
//         const sqlText = `
//             WITH selected_schedule AS (
//                 SELECT s.job_id, s.employee_id
//                 FROM "schedule" s
//                 WHERE s.date = CAST($1 AS DATE)
//             )
//             SELECT 
//                 u.id AS union_id,
//                 u.union_name AS union_name,
//                 ae.id AS employee_id,
//                 ae.first_name AS employee_first_name,
//                 ae.last_name AS employee_last_name,
//                 ae.phone_number AS employee_phone_number,
//                 ae.employee_status AS employee_status,
//                 ae.email AS employee_email,
//                 ae.address AS employee_address,
//                 ae.current_location AS employee_current_location,
//                 ae.is_highlighted AS employee_is_highlighted,
//                 s.job_id AS scheduled_job_id
//             FROM "unions" u
//             LEFT JOIN "add_employee" ae ON u.id = ae.union_id
//             LEFT JOIN selected_schedule s ON ae.id = s.employee_id
//             WHERE ae.employee_status = TRUE
//         `;
        
//         const result = await pool.query(sqlText, [selectedDate]);

//         const unions = {};

//         result.rows.forEach(row => {
//             if (!unions[row.union_id]) {
//                 unions[row.union_id] = {
//                     id: row.union_id,
//                     union_name: row.union_name,
//                     employees: []
//                 };
//             }

//             if (row.employee_id) {
//                 unions[row.union_id].employees.push({
//                     id: row.employee_id,
//                     first_name: row.employee_first_name,
//                     last_name: row.employee_last_name,
//                     phone_number: row.employee_phone_number,
//                     employee_status: row.employee_status,
//                     email: row.employee_email,
//                     address: row.employee_address,
//                     current_location: row.employee_current_location,
//                     is_highlighted: row.employee_is_highlighted,
//                     scheduled_job_id: row.scheduled_job_id
//                 });
//             }
//         });

//         res.send(Object.values(unions));
//     } catch (error) {
//         console.error('Error fetching unions with employees and schedule:', error);
//         res.status(500).send('Error fetching unions with employees and schedule');
//     }
// });


// router.get('/withunions', async (req, res) => {
//         try {
//             const sqlText = `
//                 SELECT 
//                     unions.id AS union_id,
//                     unions.union_name AS union_name,
//                     add_employee.id AS employee_id,
//                     add_employee.first_name AS employee_first_name,
//                     add_employee.last_name AS employee_last_name,
//                     add_employee.phone_number AS employee_phone_number,
//                     add_employee.employee_status AS employee_status,
//                     add_employee.email AS employee_email,
//                     add_employee.address AS employee_address,
//                     add_employee.current_location AS employee_current_location, 
//                     add_employee.union_id AS employee_union_id,
//                     add_employee.is_highlighted AS employee_is_highlighted,
//                     unions.union_name AS employee_union_name
//                 FROM unions
//                 LEFT JOIN add_employee ON unions.id = add_employee.union_id
//                 WHERE add_employee.employee_status = TRUE
//                 ORDER BY unions.union_name, add_employee.id;
//             `;
            
//             const result = await pool.query(sqlText);
            
//             const unions = {};
            
//             result.rows.forEach(row => {
//                 if (!unions[row.union_id]) {
//                     unions[row.union_id] = {
//                         id: row.union_id,
//                         union_name: row.union_name,
//                         employees: []
//                     };
//                 }
    
//                 if (row.employee_id) {
//                     unions[row.union_id].employees.push({
//                         id: row.employee_id,
//                         first_name: row.employee_first_name,
//                         last_name: row.employee_last_name,
//                         phone_number: row.employee_phone_number,
//                         employee_status: row.employee_status,
//                         email: row.employee_email,
//                         address: row.employee_address,
//                         current_location: row.employee_current_location, 
//                         union_id: row.employee_union_id,
//                         union_name: row.employee_union_name,
//                         is_highlighted: row.employee_is_highlighted
//                     });
//                 }
//             });
            
//             res.send(Object.values(unions));
//         } catch (error) {
//             console.error('Error fetching unions with employees:', error);
//             res.status(500).send('Error fetching unions with employees');
//         }
//     });
    
router.post('/', rejectUnauthenticated, async (req, res) => {
    console.log('User is authenticated?:', req.isAuthenticated());
    console.log('Current user is:', req.user.username);
    console.log('Current request body is:', req.body);

    const { first_name, last_name, employee_number, union_name, employee_status, phone_number, email, address, job_id, selected_date } = req.body;

    try {
        // Validate and fetch the union ID
        const checkUnionQuery = `
            SELECT "id" FROM "unions" WHERE "union_name" = $1
        `;
        const unionCheckResult = await pool.query(checkUnionQuery, [union_name]);

        if (unionCheckResult.rows.length === 0) {
            return res.status(400).json({ error: 'Union does not exist. Please select a valid union.' });
        }

        const unionId = unionCheckResult.rows[0].id;

        // Insert or update the employee record
        const insertEmployeeQuery = `
            INSERT INTO "add_employee" (
                "first_name", "last_name", "employee_number", "employee_status", 
                "phone_number", "email", "address", "job_id", "union_id", 
                "current_location", "is_highlighted"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'union', false)
            ON CONFLICT (employee_number) 
            DO UPDATE SET 
                first_name = EXCLUDED.first_name, 
                last_name = EXCLUDED.last_name, 
                employee_status = EXCLUDED.employee_status, 
                phone_number = EXCLUDED.phone_number, 
                email = EXCLUDED.email, 
                address = EXCLUDED.address, 
                job_id = EXCLUDED.job_id, 
                union_id = EXCLUDED.union_id;
            RETURNING id;
        `;

        const employeeValues = [
            first_name, last_name, employee_number, employee_status, 
            phone_number, email, address, job_id, unionId
        ];

        const employeeResult = await pool.query(insertEmployeeQuery, employeeValues);
        const employeeId = employeeResult.rows[0].id;

        // Handle the date for the schedule entry: Default to current date or use selected_date
        let currentDate = selected_date || new Date().toISOString().slice(0, 10);  // default to current date if not provided
        const providedDate = new Date(currentDate);
        const today = new Date();

        // Ensure the selected date is not in the past
        if (providedDate < today) {
            return res.status(400).json({ error: 'Cannot schedule for past dates.' });
        }

        // Insert or update the schedule entry for the employee
        const scheduleQuery = `
            INSERT INTO "schedule" (date, job_id, employee_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (date, job_id, employee_id)
            DO UPDATE SET job_id = EXCLUDED.job_id, employee_id = EXCLUDED.employee_id;
        `;

        const scheduleValues = [currentDate, job_id, employeeId];
        await pool.query(scheduleQuery, scheduleValues);

        res.status(201).send({ 
            message: 'Employee and schedule updated successfully.', 
            employee_id: employeeId 
        });

    } catch (error) {
        console.error('Error updating employee and schedule:', error);
        res.sendStatus(500);
    }
});

  
// PUT endpoint to update the highlight status of an employee for a specific day
router.put('/:id/highlight', async (req, res) => {
    const employeeId = req.params.id; // Employee ID from route parameter
    const { isHighlighted, date } = req.body; // Extract isHighlighted and date from request body

    try {
        // SQL query to update the `is_highlighted` field in the `schedule` table
        const queryText = `
            UPDATE "schedule"
            SET "is_highlighted" = $1
            WHERE "employee_id" = $2 AND "date" = $3
        `;
        // Execute the query with the provided values
        const result = await pool.query(queryText, [isHighlighted, employeeId, date]);

        // If no rows are updated, the combination of employee_id and date might not exist
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No schedule entry found for this employee on the given date' });
        }

        res.sendStatus(204); // Send a 'No Content' response on successful update
    } catch (error) {
        console.error('Error updating highlight status for schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

  

module.exports = router;
