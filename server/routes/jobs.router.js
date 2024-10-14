const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

// Route to get all active jobs
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User is authenticated:', req.isAuthenticated());
        console.log("Current user is:", req.user.username);

        const sqlText = `
        SELECT * FROM "jobs"
        ORDER BY "job_name" ASC;
        `;

        pool.query(sqlText)
            .then((result) => {
                console.log(`GET jobs from database:`, result.rows);
                res.send(result.rows);
            })
            .catch((error) => {
                console.log(`Error making database query ${sqlText}:`, error);
                res.sendStatus(500);
            });
    } else {
        res.sendStatus(401);
    }
});

// Route to create a new job
router.post('/', rejectUnauthenticated, (req, res) => {
    console.log('User is authenticated:', req.isAuthenticated());
    console.log("Current user is:", req.user.username);
    console.log("Request body:", req.body);

    const { job_number, job_name, location, start_date, end_date, status } = req.body;

    const queryText = `
        INSERT INTO "jobs" ("job_number", "job_name", "location", "start_date", "end_date", "status")
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING "job_id";
    `;
    const values = [job_number, job_name, location, start_date, end_date, status || 'active'];

    pool.query(queryText, values)
        .then((result) => {
            console.log('New job created with ID:', result.rows[0].job_id);
            res.sendStatus(201);
        })
        .catch((error) => {
            console.error('Error creating new job:', error);
            res.sendStatus(500);
        });
});

// Route to update a job
router.put('/:job_id', rejectUnauthenticated, (req, res) => {
    const jobId = req.params.job_id;
    const { job_number, job_name, location, start_date, end_date, status } = req.body;

    if (status !== undefined && !job_number && !job_name && !location && !start_date && !end_date) {
        // Update only the status
        const queryText = `
            UPDATE "jobs"
            SET "status" = $1
            WHERE "job_id" = $2;
        `;
        console.log("Updating job status:", { status, jobId });

        pool.query(queryText, [status, jobId])
            .then(() => {
                console.log('Job status updated successfully');
                res.sendStatus(204);
            })
            .catch((error) => {
                console.log('Error updating job status:', error);
                res.sendStatus(500);
            });
    } else {
        // Update all job details
        const updateJob = [job_number, job_name, location, start_date, end_date, jobId];
        const sqlText = `
            UPDATE "jobs"
            SET "job_number" = $1,
                "job_name" = $2,
                "location" = $3,    
                "start_date" = $4,
                "end_date" = $5
            WHERE "job_id" = $6;
        `;
        console.log("Updating job details:", updateJob);

        pool.query(sqlText, updateJob)
            .then((result) => {
                if (result.rowCount > 0) {
                    console.log('Job updated successfully');
                    res.sendStatus(204);
                } else {
                    console.log('Job not found');
                    res.sendStatus(404);
                }
            })
            .catch((error) => {
                console.log("Error updating job:", error);
                res.sendStatus(500);
            });
    }
});

// Route to delete a job
router.delete('/:job_id', rejectUnauthenticated, (req, res) => {
    const jobId = req.params.job_id;
    console.log('Delete request for jobId:', jobId);
    
    const queryText = `
        DELETE FROM "jobs"
        WHERE "job_id" = $1;
    `;
    
    pool.query(queryText, [jobId])
        .then((result) => {
            if (result.rowCount > 0) {
                console.log('Job deleted successfully');
                res.sendStatus(204);
            } else {
                console.log('Job not found or unauthorized');
                res.sendStatus(404);
            }
        })
        .catch((error) => {
            console.log('Error deleting job:', error);
            res.sendStatus(500);
        });
});

module.exports = router;