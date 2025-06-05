const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { validateDate } = require('../routes/date-validation.middleware');


//Route to get all jobs
router.get('/', (req, res) => {
    //check if the user is authenticated
    if (req.isAuthenticated()) {
        console.log('User is authenticated?:', req.isAuthenticated());
        console.log("Current user is: ", req.user.username);

        const sqlText = `
        SELECT * FROM "jobs"
        `;

        // query database for all jobs
        pool.query(sqlText)
            .then((result) => {
                console.log(`GET from database`, result);
                //send the job rows back
                res.send(result.rows);
            })
            .catch((error) => {
                console.log(`Error making database query ${sqlText}`, error);
                // Send 500--- Internal Server Error
                res.sendStatus(500);
            });
    } else {
        // send 401 unauthorized if user if not authenticated
        res.sendStatus(401);
    }
});

//Route to create a new job
router.post('/', rejectUnauthenticated, (req, res) => {
    console.log('User is authenticated?:', req.isAuthenticated());
    console.log("Current user is:", req.user.username);
    console.log("Current request body is:", req.body);

    //get job info from request body
    const jobInfo = req.body

    const jobs = [
        jobInfo.job_number,
        jobInfo.job_name,
        jobInfo.location,
        jobInfo.start_date,
        jobInfo.end_date,
        jobInfo.status]

    const queryText = `
        INSERT INTO "jobs" ("job_number", "job_name", "location", "start_date", "end_date", "status")
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING "job_id"
    `;
    console.log("values", jobs)
    // Add a new job to the database
    pool.query(queryText, jobs)
        .then(() => {
            // 201 Created for successful creation
            res.sendStatus(201);
        })
        .catch((error) => {
            console.error('Error making POST insert for jobs:', error);
            res.sendStatus(500);
        });
});

router.put('/:job_id', rejectUnauthenticated, async (req, res) => {
    const jobId = req.params.job_id;
    const { job_number, job_name, location, start_date, end_date, status } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // If only updating status
if (status !== undefined &&
    !job_number &&
    !job_name &&
    !location &&
    !start_date &&
    !end_date) {

    const queryText = `
        UPDATE "jobs"
        SET "status" = $1
        WHERE "job_id" = $2;
    `;
    console.log("Updating status with values:", { status, jobId });

    await client.query(queryText, [status, jobId]);

    // Get today's date in the central time zone
    const centralTime = new Date().toLocaleString("en-US", {
        timeZone: "America/Chicago"
    });
    const today = new Date(centralTime);
    today.setHours(0, 0, 0, 0);
    
    // Format as YYYY-MM-DD
    const formattedToday = today.toISOString().split('T')[0];
    console.log("Using today's date for queries:", formattedToday);
    
    if (status === 'Inactive') {
        // Only change current_location, keep job_id for "limbo" state
        const moveEmployeesQuery = `
            UPDATE schedule
            SET current_location = 'union'
            WHERE job_id = $1 
            AND date >= $2;
        `;
        await client.query(moveEmployeesQuery, [jobId, formattedToday]);
        console.log("Updated employees to union for job", jobId, "from date", formattedToday);
    } else if (status === 'Active') {
        // Restore employees that were in "limbo" state
        const restoreEmployeesQuery = `
            UPDATE schedule
            SET current_location = 'project'
            WHERE job_id = $1 
            AND date >= $2;
        `;
        await client.query(restoreEmployeesQuery, [jobId, formattedToday]);
        console.log("Restored employees to project for job", jobId, "from date", formattedToday);
    }

    await client.query('COMMIT');
    res.sendStatus(204);
} else {
            // For full job updates
            const queryText = `
                UPDATE "jobs"
                SET 
                    "job_number" = $1,
                    "job_name" = $2,
                    "location" = $3,    
                    "start_date" = $4,
                    "end_date" = $5
                WHERE "job_id" = $6
                RETURNING *;
            `;

            const values = [
                job_number,
                job_name,
                location,
                start_date,
                end_date,
                jobId
            ];

            const result = await client.query(queryText, values);

            await client.query('COMMIT');

            if (result.rowCount > 0) {
                res.sendStatus(204);
            } else {
                res.sendStatus(404);
            }
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.log("Error updating job:", error);
        res.status(500).send(error.message);
    } finally {
        client.release();
    }
});

router.delete('/:job_id', (req, res) => {
    const jobId = req.params.job_id;
    console.log('Delete request for jobId', jobId);
    const queryText = `
        DELETE FROM "jobs"
        WHERE "job_id" = $1;
    `;
    
    pool.query(queryText, [jobId])
        .then((result) => {
            if (result.rowCount > 0) {
                res.sendStatus(204);
            } else {
                res.sendStatus(403);
            }
        })
        .catch((error) => {
            console.log('error making query...', error);
            res.sendStatus(500);
        });
});

module.exports = router;