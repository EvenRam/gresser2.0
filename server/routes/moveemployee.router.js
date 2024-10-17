
const express = require('express');
const pool = require('../modules/pool'); 
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware'); 
router.post('/', rejectUnauthenticated, async (req, res) => {
    const { employeeId, targetProjectId } = req.body; 

    try {
        await pool.query('BEGIN');

        const employeeResult = await pool.query(
            'SELECT union_id FROM "add_employee" WHERE "id" = $1',
            [employeeId]
        );

        if (employeeResult.rowCount === 0) {
            throw new Error('Employee not found');
        }

        const { union_id } = employeeResult.rows[0];

        // Update the employee's location without changing the union_id
        await pool.query(
            'UPDATE "add_employee" SET "job_id" = $1, "current_location" = $2 WHERE "id" = $3',
            [targetProjectId || null, targetProjectId ? 'project' : 'union', employeeId]
        );

        await pool.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error moving employee:', error);
        res.status(500).send(`Error moving employee: ${error.message}`);
    }
});



module.exports = router;
