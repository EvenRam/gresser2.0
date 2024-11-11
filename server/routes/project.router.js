router.get('/withEmployees', async (req, res) => {
    try {
        const sqlText = `
        SELECT 
            jobs.job_id AS job_id, 
            jobs.job_name AS job_name, 
            jobs.status AS job_status,
            jobs.display_order,
            jobs.start_date,
            jobs.end_date,
            jobs.location,
            add_employee.id AS employee_id, 
            add_employee.first_name AS employee_first_name,
            add_employee.last_name AS employee_last_name,
            add_employee.employee_status AS employee_status,
            add_employee.phone_number AS employee_phone_number,
            add_employee.email AS employee_email,
            add_employee.address AS employee_address,
            add_employee.current_location AS current_location,
            add_employee.union_id AS union_id,
            add_employee.display_order AS employee_display_order,
            unions.union_name AS union_name
        FROM jobs
        LEFT JOIN add_employee ON jobs.job_id = add_employee.job_id
        LEFT JOIN unions ON add_employee.union_id = unions.id
        WHERE jobs.status = 'Active'
        ORDER BY jobs.display_order NULLS LAST, jobs.job_id, 
                add_employee.display_order NULLS LAST, add_employee.id;
        `;
        
        console.log('Executing SQL query...');
        const result = await pool.query(sqlText);
        console.log('Raw database results:', result.rows[0]); // Log the first row
        
        const jobs = {};
        
        result.rows.forEach(row => {
            if (!jobs[row.job_id]) {
                jobs[row.job_id] = {
                    id: row.job_id,
                    job_name: row.job_name,
                    display_order: row.display_order,
                    start_date: row.start_date,
                    end_date: row.end_date,
                    location: row.location,
                    employees: []
                };
                console.log('Created job object:', jobs[row.job_id]); // Log each job as it's created
            }
  
            if (row.employee_id && row.employee_status === true) {
                jobs[row.job_id].employees.push({
                    id: row.employee_id,
                    first_name: row.employee_first_name,
                    last_name: row.employee_last_name,
                    employee_status: row.employee_status,
                    phone_number: row.phone_number,
                    email: row.email,
                    address: row.address,
                    current_location: row.current_location,
                    union_id: row.union_id,
                    union_name: row.union_name,
                    display_order: row.employee_display_order
                });
            }
        });
        
        const orderedJobs = Object.values(jobs).sort((a, b) => {
            if (a.display_order === null) return 1;
            if (b.display_order === null) return -1;
            return a.display_order - b.display_order;
        });
        
        console.log('Final response data:', orderedJobs); // Log the final response
        res.send(orderedJobs);
    } catch (error) {
        console.error('Error fetching jobs with employees:', error);
        res.status(500).send('Error fetching jobs with employees');
    }
});