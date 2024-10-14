import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProjectBox from './ProjectBox';
import Employee from './Employee';
import './EmployeeStyles.css';
import './Scheduling.css';

const Scheduling = () => {
  const dispatch = useDispatch();
  const employeeCard = useSelector((state) => state.cardReducer);
  const jobsBox = useSelector((state) => state.jobReducer);

  useEffect(() => {
    dispatch({ type: 'FETCH_EMPLOYEE_CARD' });
    dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
  }, [dispatch]);

  const moveEmployee = (employeeId, targetProjectId) => {
    dispatch({ type: 'MOVE_EMPLOYEE', payload: { employeeId, targetProjectId } });
  };

  // Filter active jobs
  const activeJobs = jobsBox.filter(job => job.status === 'active');

  return (
    <div className="scheduling-container">
      <div>
        <h3>Employees</h3>
        <div className="employee-list">
          {employeeCard.map((employee) => (
            <div key={employee.id} className="employee-item">
              <Employee
                id={employee.id}
                name={`${employee.first_name} ${employee.last_name}`}
                number={employee.phone_number}
                email={employee.email}
                address={employee.address}
                unionName={employee.union_name}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        {!activeJobs || activeJobs.length === 0 ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">YOU HAVE NO ACTIVE JOBS</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="jobs-container">
            {activeJobs.map((job) => (
              <div key={job.id} className="job-box">
                <ProjectBox
                  id={job.id}
                  job_name={job.job_name}
                  employees={job.employees ? job.employees.filter(emp => emp.employee_status) : []}
                  moveEmployee={moveEmployee}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduling;