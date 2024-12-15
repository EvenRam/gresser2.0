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



router.post('/', rejectUnauthenticated, async (req, res) => {
    console.log('User is authenticated?:', req.isAuthenticated());
    console.log('Current user is:', req.user.username);
    console.log('Current request body is:', req.body);

    const { first_name, last_name, employee_number, union_name, employee_status, phone_number, email, address, job_id } = req.body;

    try {
        
        const insertUnionQuery = `
            INSERT INTO "unions" ("union_name")
            VALUES ($1)
            RETURNING "id"
        `;
        const unionValues = [union_name];
        const unionResult = await pool.query(insertUnionQuery, unionValues);
        const unionId = unionResult.rows[0].id;

      
        const insertEmployeeQuery = `
            INSERT INTO "add_employee" (
                "first_name", "last_name", "employee_number", "employee_status", "phone_number", "email", "address", "job_id", "union_id"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING "id"
        `;
        const employeeValues = [first_name, last_name, employee_number, employee_status, phone_number, email, address, job_id, unionId];
        await pool.query(insertEmployeeQuery, employeeValues);

        res.status(201).send({ message: 'Employee and union record created successfully' });
    } catch (error) {
        console.error('Error making POST insert for add_employee and unions:', error);
        res.sendStatus(500);
    }
});


router.put('/:id', rejectUnauthenticated, async (req, res) => {
    const employeeId = req.params.id;
    console.log("Employee ID:", employeeId);

    const {
        first_name,
        last_name,
        employee_number,
        employee_status,
        phone_number,
        email,
        address,
        union_id
    } = req.body;

    try {
        // If only updating employee status
        if (employee_status !== undefined &&
            !first_name &&
            !last_name &&
            !employee_number &&
            !phone_number &&
            !email &&
            !address &&
            !union_id) {

            const queryText = `
                UPDATE "add_employee"
                SET "employee_status" = $1
                WHERE "id" = $2;
            `;
            await pool.query(queryText, [employee_status, employeeId]);
            res.sendStatus(200);
            return;
        }

        // For full employee update
        const queryText = `
            UPDATE "add_employee"
            SET
                "first_name" = COALESCE($1, first_name),
                "last_name" = COALESCE($2, last_name),
                "employee_number" = COALESCE($3, employee_number),
                "employee_status" = COALESCE($4, employee_status),
                "phone_number" = COALESCE($5, phone_number),
                "email" = COALESCE($6, email),
                "address" = COALESCE($7, address),
                "union_id" = COALESCE($8, union_id)
            WHERE "id" = $9
            RETURNING *;
        `;
        
        const queryParams = [
            first_name,
            last_name,
            employee_number,
            employee_status,
            phone_number,
            email,
            address,
            union_id,
            employeeId
        ];

        const result = await pool.query(queryText, queryParams);
        
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }

    } catch (error) {
        console.error('Error updating employee with union:', error);
        res.status(500).json({ 
            message: 'Error updating employee with union',
            error: error.message 
        });
    }
});



module.exports = router;