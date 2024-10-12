const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');



router.post('/', rejectUnauthenticated, async (req, res) => {
    const { employeeId, targetProjectId, targetUnionId } = req.body;

    try {
        await pool.query('BEGIN');

        let result;
        if (targetProjectId) {
            result = await pool.query(
                'UPDATE "add_employee" SET "job_id" = $1, "union_id" = NULL, "current_location" = $2 WHERE "id" = $3',
                [targetProjectId, 'project', employeeId]
            );
        } else if (targetUnionId) {
            result = await pool.query(
                'UPDATE "add_employee" SET "union_id" = $1, "job_id" = NULL, "current_location" = $2 WHERE "id" = $3',
                [targetUnionId, 'union', employeeId]
            );
        } else {
            throw new Error('No target specified');
        }

        if (result.rowCount === 0) {
            throw new Error('Employee not found');
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