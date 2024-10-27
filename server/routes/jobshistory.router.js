const express = require('express');
const router = express.Router();
const pool = require('../modules/pool');

router.get('/', async (req, res) => {
  try {
    const filterDate = req.query.filterDate;
    console.log("filterDate", filterDate);

    let jobsWithDetailsQuery = `
      SELECT 
        j.job_id,
        j.job_number,
        j.job_name,
        j.location,
        j.start_date,
        j.end_date,
        j.status AS job_status,
        ae.id AS employee_id,
        ae.first_name,
        ae.last_name,
        ae.employee_number,
        ae.employee_status,
        ae.phone_number,
        ae.email,
        ae.address,
        ae.current_location,
        ae.union_id,
        rd.date AS rain_day
      FROM "jobs" AS j
      LEFT JOIN "add_employee" AS ae ON j.job_id = ae.job_id
      LEFT JOIN "rain_days" AS rd ON j.job_id = rd.job_id
    `;

    if (filterDate) {
      jobsWithDetailsQuery += `
        WHERE '${filterDate}' BETWEEN j.start_date AND j.end_date
      `;
    }

    jobsWithDetailsQuery += `
      GROUP BY 
        j.job_id, 
        j.job_number, 
        j.job_name, 
        j.location, 
        j.start_date, 
        j.end_date, 
        j.status, 
        ae.id, 
        ae.first_name, 
        ae.last_name, 
        ae.employee_number, 
        ae.employee_status, 
        ae.phone_number, 
        ae.email, 
        ae.address, 
        ae.current_location, 
        ae.union_id,
        rd.date
      ORDER BY j.job_id, ae.id, rd.date
    `;

    const jobsResult = await pool.query(jobsWithDetailsQuery);
    const rows = jobsResult.rows;

    // Organize jobs and their details in an object
    const jobs = {};
    rows.forEach(row => {
      const {
        job_id,
        job_number,
        job_name,
        location,
        start_date,
        end_date,
        job_status,
        employee_id,
        first_name,
        last_name,
        employee_number,
        employee_status,
        phone_number,
        email,
        address,
        current_location,
        union_id,
        rain_day
      } = row;

      // Initialize job object if it doesn't exist
      if (!jobs[job_id]) {
        jobs[job_id] = {
          job_id,
          job_number,
          job_name,
          location,
          start_date,
          end_date,
          status: job_status,
          employees: [],
          rain_days: []
        };
      }

      // Add employee details if present, avoiding duplicates
      if (employee_id && !jobs[job_id].employees.some(emp => emp.employee_id === employee_id)) {
        jobs[job_id].employees.push({
          employee_id,
          first_name,
          last_name,
          employee_number,
          employee_status,
          phone_number,
          email,
          address,
          current_location,
          union_id
        });
      }

      // Add rain day to the job if present and not already added
      if (rain_day && !jobs[job_id].rain_days.some(day => day.date === rain_day)) {
        jobs[job_id].rain_days.push({
          date: new Date(rain_day).toISOString().split('T')[0] // Format as YYYY-MM-DD
        });
      }
    });

    // Convert jobs object to an array
    const jobsArray = Object.values(jobs);
    res.json(jobsArray);
  } catch (error) {
    console.error('Error from jobshistory.router.js', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/rainday', async (req, res) => {
  try {
    const { jobId, date } = req.body;

    const checkQuery = 'SELECT * FROM "rain_days" WHERE "job_id" = $1 AND "date" = $2';
    const checkResult = await pool.query(checkQuery, [jobId, date]);

    if (checkResult.rows.length > 0) {
      const deleteQuery = 'DELETE FROM "rain_days" WHERE "job_id" = $1 AND "date" = $2';
      await pool.query(deleteQuery, [jobId, date]);
    } else {
      const insertQuery = 'INSERT INTO "rain_days" ("job_id", "date") VALUES ($1, $2)';
      await pool.query(insertQuery, [jobId, date]);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error setting/deleting rain day from jobshistory.router:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
