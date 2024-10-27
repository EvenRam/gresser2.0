import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './JobHistory.css'; 

const JobHistory = () => {
  const [jobs, setJobs] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filterDate]);

  const fetchJobs = () => {
    let url = '/api/jobhistory';
    if (filterDate) {
      url = `/api/jobhistory?filterDate=${filterDate}`;
    }

    axios.get(url)
      .then(response => {
        setJobs(response.data);
        console.log("response.data", response.data)

      })
      .catch(error => {
        console.error('Error fetching jobs:', error);
      });
  };

  const formatProjectDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDate = (dateString) => {
    // Parse the date string to avoid timezone offset issues
    const [year, month, day] = dateString.split('-');
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString();
  };
  
  const renderEmployees = (employees) => {
    if (employees && employees.length > 0) {
      return (
        <ul>
          {employees.map((employee) => (
            <li key={employee.id}>
              {employee.first_name} {employee.last_name}
            </li>
          ))}
        </ul>
      );
    } else {
      return <span>No employees assigned</span>;
    }
  };

  const renderRainDays = (rainDays) => {
    const uniqueDates = [...new Set(rainDays.map(day => day.date))];
    console.log("uniqueDate", uniqueDates)
  
    return uniqueDates.length > 0 ? (
      <ul>
        {uniqueDates.map((date) => (
          <li key={date}>{formatDate(date)}</li>
          
        ))}
      </ul>
    ) : (
      <span>No rain days</span>
    );
  };
  
  

  const rainCheckBox = (jobId) => {
    axios.post('/api/jobhistory/rainday', { jobId, date: filterDate })
      .then(() => {
        fetchJobs();
      })
      .catch(error => {
        console.error('Error changing rain day:', error);
      });
  };

  const generateReport = () => {
    let totalJobs = jobs.length;
    let totalEmployees = 0;
    let totalRainDays = 0;

    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].employees) {
        totalEmployees += jobs[i].employees.length;
      }
      if (jobs[i].rain_days) {
        totalRainDays += jobs[i].rain_days.length;
      }
    }

    let totalEstimatedHours = totalEmployees * 8;
    let averageEmployeesPerJob = 0;
    if (totalJobs > 0) {
      averageEmployeesPerJob = totalEmployees / totalJobs;
      averageEmployeesPerJob = averageEmployeesPerJob.toFixed(2);
    }
    
    setReport({
      totalJobs: totalJobs,
      totalEmployees: totalEmployees,
      totalRainDays: totalRainDays,
      averageEmployeesPerJob: averageEmployeesPerJob,
      totalEstimatedHours: totalEstimatedHours,
    });
  };

  return (
    <div>
      <h1 className="jobhistory_title">Project History</h1>
      <div className="date">
        <label>
          Date:
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </label>
        <button className='reports-btn' onClick={generateReport}>Generate Report</button>
      </div>
      <table className="history-table">
        <thead>
          <tr>
            <th>Project Number</th>
            <th>Name</th>
            <th>Location</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Employees</th>
            <th>Rain Days</th>
            {filterDate && <th>Mark as Rain Day</th>}
          </tr>
        </thead>
        <tbody className="history-tbody">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan="8">No Projects occurred on this day</td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.job_id}>
                <td>{job.job_number}</td>
                <td>{job.job_name}</td>
                <td>{job.location}</td>
                <td>{formatProjectDate(job.start_date)}</td>
                <td>{formatProjectDate(job.end_date)}</td>
                <td>{job.status}</td>
                <td>{renderEmployees(job.employees,job.job_id)}</td>
                <td>{renderRainDays(job.rain_days)}</td>
                {filterDate && (
                  <td>
                    <input
                      type="checkbox"
                      checked={job.rain_days.some(function(rd) {
                        return formatDate(rd.date) === formatDate(filterDate);
                      })}
                      onChange={() => rainCheckBox(job.job_id)}
                    />
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {report && (
        <div className="report-container">
          <div className="report-content">
            <h2>Report</h2>
            <table className="report-table">
              <tbody>
                <tr>
                  <td>Total Projects:</td>
                  <td>{report.totalJobs}</td>
                </tr>
                <tr>
                  <td>Total Employees:</td>
                  <td>{report.totalEmployees}</td>
                </tr>
                <tr>
                  <td>Total Rain Days:</td>
                  <td>{report.totalRainDays}</td>
                </tr>
                <tr>
                  <td>Average Employees per Job:</td>
                  <td>{report.averageEmployeesPerJob}</td>
                </tr>
                <tr>
                  <td>Total Estimated Hours:</td>
                  <td>{report.totalEstimatedHours}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobHistory;