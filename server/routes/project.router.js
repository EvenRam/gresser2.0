const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

router.get('/withEmployees', async (req, res) => {
  try {
    const date = req.query.date;
    const sqlText = `
      SELECT 
        jobs.job_id AS job_id, 
        jobs.job_name AS job_name, 
        add_employee.id AS employee_id, 
        add_employee.first_name AS employee_first_name,
        add_employee.last_name AS employee_last_name
      FROM jobs
      LEFT JOIN add_employee ON jobs.job_id = add_employee.job_id
      WHERE jobs.start_date <= $1 AND jobs.end_date >= $1
      ORDER BY jobs.job_id, add_employee.id;
    `;
    
    const result = await pool.query(sqlText, [date]);
    
    const jobs = {};
    
    result.rows.forEach(row => {
      if (!jobs[row.job_id]) {
        jobs[row.job_id] = {
          id: row.job_id,
          job_name: row.job_name,
          employees: []
        };
      }
      
      if (row.employee_id) {
        jobs[row.job_id].employees.push({
          id: row.employee_id,
          first_name: row.employee_first_name,
          last_name: row.employee_last_name
        });
      }
    });
    
    res.send(Object.values(jobs));
  } catch (error) {
    console.error('Error fetching jobs with employees:', error);
    res.status(500).send('Error fetching jobs with employees');
  }
});

module.exports = router;