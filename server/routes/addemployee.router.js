const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');


router.get('/', async (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User is authenticated?:', req.isAuthenticated());
        console.log("Current user is: ", req.user.username);
        
        const sqlText = `
        SELECT ae.*, u.union_name
        FROM "add_employee" ae
        LEFT JOIN "unions" u ON ae."union_id" = u."id"
        ORDER BY ae."last_name" ASC, ae."first_name" ASC;
    `;
    
        
        try {
            const result = await pool.query(sqlText);
            console.log(`GET from database addemployee`, result);
            res.send(result.rows);
        } catch (error) {
            console.log(`Error making database query ${sqlText}`, error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(401);
    }
});


router.get('/union', async (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User is authenticated?:', req.isAuthenticated());
        console.log("Current user is: ", req.user.username);

        const sqlText = `
            SELECT "id", "union_name"
            FROM "unions"
            ORDER BY "union_name" ASC;
        `; 

        try {
            const result = await pool.query(sqlText);
            console.log(`GET from database`, result);
            res.send(result.rows);
        } catch (error) {
            console.log(`Error making database query ${sqlText}`, error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(401);
    }
});


router.get('/withunions', async (req, res) => {
    try {
        const sqlText = `
            SELECT 
                unions.id AS union_id,
                unions.union_name AS union_name,
                add_employee.id AS employee_id,
                add_employee.first_name AS employee_first_name,
                add_employee.last_name AS employee_last_name,
                add_employee.phone_number AS employee_phone_number,
                add_employee.employee_status AS employee_status,
                add_employee.email AS employee_email,
                add_employee.address AS employee_address,
                add_employee.current_location AS employee_current_location, 
                add_employee.union_id AS employee_union_id,
                unions.union_name AS employee_union_name
            FROM unions
            LEFT JOIN add_employee ON unions.id = add_employee.union_id
            WHERE add_employee.employee_status = TRUE
            ORDER BY unions.union_name, add_employee.id;
        `;
        
        const result = await pool.query(sqlText);
        
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
                    first_name: row.employee_first_name,
                    last_name: row.employee_last_name,
                    phone_number: row.employee_phone_number,
                    employee_status: row.employee_status,
                    email: row.employee_email,
                    address: row.employee_address,
                    current_location: row.employee_current_location, 
                    union_id: row.employee_union_id,
                    union_name: row.employee_union_name
                });
            }
        });
        
        res.send(Object.values(unions));
    } catch (error) {
        console.error('Error fetching unions with employees:', error);
        res.status(500).send('Error fetching unions with employees');
    }
});


router.post('/', rejectUnauthenticated, async (req, res) => {
    console.log('User is authenticated?:', req.isAuthenticated());
    console.log('Current user is:', req.user.username);
    console.log('Current request body is:', req.body);

    const { first_name, last_name, employee_number, union_name, employee_status, phone_number, email, address, job_id } = req.body;

    try {
        const checkUnionQuery = `
            SELECT "id" FROM "unions" WHERE "union_name" = $1
        `;
        const unionCheckResult = await pool.query(checkUnionQuery, [union_name]);
        
        let unionId;
        if (unionCheckResult.rows.length > 0) {
            unionId = unionCheckResult.rows[0].id;
        } else {
            const insertUnionQuery = `
                INSERT INTO "unions" ("union_name")
                VALUES ($1)
                RETURNING "id"
            `;
            const unionResult = await pool.query(insertUnionQuery, [union_name]);
            unionId = unionResult.rows[0].id;
        }

      // Insert employee with current_location set to "union"
      const insertEmployeeQuery = 
      `INSERT INTO "add_employee" (
          "first_name", "last_name", "employee_number", "employee_status", "phone_number", "email", "address", "job_id", "union_id", "current_location"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'union')  
      RETURNING "id"`;

        const employeeValues = [first_name, last_name, employee_number, employee_status, phone_number, email, address, job_id, unionId];
        await pool.query(insertEmployeeQuery, employeeValues);

        res.status(201).send({ message: 'Employee and union record created successfully' });
    } catch (error) {
        console.error('Error making POST insert for add_employee and unions:', error);
        res.sendStatus(500);
    }
});


router.put('/:id', async (req, res) => {
    const employeeId = req.params.id;
    console.log("employee id", employeeId);
    const {
        first_name,
        last_name,
        employee_number,
        employee_status,
        phone_number,
        email,
        address,
        job_id,
        union_id
    } = req.body;

    // If employee_status is provided, we check for its specific value (active or inactive)
    if (employee_status !== undefined &&
        !first_name &&
        !last_name &&
        !employee_number &&
        !phone_number &&
        !email &&
        !address &&
        !job_id &&
        !union_id) {
        
        let queryText;
        let queryParams;
        
        // If the employee is set to inactive, update job_id to null and current_location to 'inactive'
        if (employee_status === false) {
            queryText = `
                UPDATE "add_employee"
                SET "employee_status" = $1, "job_id" = NULL, "current_location" = 'inactive'
                WHERE "id" = $2;
            `;
            queryParams = [employee_status, employeeId];
        } else {
            // If the employee is set to active, you can revert their current_location to 'union'
            queryText = `
                UPDATE "add_employee"
                SET "employee_status" = $1, "current_location" = 'union'
                WHERE "id" = $2;
            `;
            queryParams = [employee_status, employeeId];
        }

        console.log("updating employee with query:", queryText, queryParams);
        try {
            await pool.query(queryText, queryParams);
            res.sendStatus(204); // Success with no content
        } catch (error) {
            console.log("Error updating employee status", error);
            res.sendStatus(500);
        }
    } else {
        // Handle other fields update as before
        const values = [
            first_name,
            last_name,
            employee_number,
            employee_status,
            phone_number,
            email,
            address,
            job_id,
            union_id,
            employeeId
        ];
        const query = `
            UPDATE "add_employee"
            SET
                "first_name" = $1,
                "last_name" = $2,
                "employee_number" = $3,
                "employee_status" = $4,
                "phone_number" = $5,
                "email" = $6,
                "address" = $7,
                "job_id" = $8,
                "union_id" = $9
            WHERE "id" = $10;
        `;
        try {
            const result = await pool.query(query, values);
            if (result.rowCount > 0) {
                res.sendStatus(204);
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

module.exports = router;