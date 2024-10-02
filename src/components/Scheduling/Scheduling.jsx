import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProjectBox from './ProjectBox';
import './EmployeeStyles.css';
import './Scheduling.css';

const unionColorMapping = {
  '21 - Bricklayers': 'red',
  '22 - Cement Masons/Finishers': 'green',
  '23 - Laborers': 'black',
  '24 - Operators': 'purple',
  '25 - Carpenters': 'blue',
  default: 'gray',
};

const unionIdToName = {
  21: '21 - Bricklayers',
  22: '22 - Cement Masons/Finishers',
  23: '23 - Laborers',
  24: '24 - Operators',
  25: '25 - Carpenters',
};

const Scheduling = () => {
  const dispatch = useDispatch();
  const jobsBox = useSelector((state) => state.jobReducer);

  useEffect(() => {
    console.log('Initial jobReducer state:', jobsBox);
  }, [jobsBox]);

  useEffect(() => {
    dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
  }, [dispatch]);

  const moveEmployee = (employeeId, targetProjectId) => {
    console.log(`Moving employee ID: ${employeeId} to Project ID: ${targetProjectId}`);
    dispatch({ type: 'MOVE_EMPLOYEE', payload: { employeeId, targetProjectId } });
  };

  const logEmployeeData = (employee) => {
    const unionName = employee.union_id ? unionIdToName[employee.union_id] : 'Unknown Union';
    const color = unionColorMapping[unionName] || unionColorMapping.default;
    console.log(
      `Employee: ${employee.first_name} ${employee.last_name}, Union ID: ${employee.union_id}, Union Name: ${unionName}, Color: ${color}`
    );
  };

  return (
    <div className="scheduling-container">
      <div>
        <h3>Projects</h3>
        {!jobsBox || jobsBox.length === 0 || !Array.isArray(jobsBox) ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">YOU HAVE NO PROJECTS</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="jobs-container">
            {jobsBox.map((job) => (
              <div key={job.id} className="job-box">
                <ProjectBox
                  id={job.id}
                  job_name={job.job_name}
                  employees={job.employees}
                  moveEmployee={moveEmployee}
                  unionColorMapping={unionColorMapping}
                  unionIdToName={unionIdToName}
                  logEmployeeData={logEmployeeData}
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