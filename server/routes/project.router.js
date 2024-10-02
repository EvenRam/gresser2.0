const express = require('express');
const router = express.Router();
const pool = require('../modules/pool');

router.get('/withEmployees', async (req, res) => {
  try {
    const sqlText = `
      SELECT 
        jobs.job_id AS job_id, 
        jobs.job_name AS job_name, 
        add_employee.id AS employee_id, 
        add_employee.first_name AS employee_first_name,
        add_employee.last_name AS employee_last_name,
        add_employee.union_id,
        unions.union_name
      FROM jobs
      LEFT JOIN add_employee ON jobs.job_id = add_employee.job_id
      LEFT JOIN unions ON add_employee.union_id = unions.id
      ORDER BY jobs.job_id, add_employee.id;
    `;
    
    const result = await pool.query(sqlText);
    
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
          last_name: row.employee_last_name,
          union_id: row.union_id,
          union_name: row.union_name
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