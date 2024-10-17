
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrag, useDrop } from 'react-dnd';
import ProjectBox from './ProjectBox';
import './EmployeeStyles.css';

import './Scheduling.css';
import DraggableJobBox from './DraggableJobBox';

const Scheduling = () => {

  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const jobsBox = useSelector((state) => state.projectReducer);
  const allEmployees = useSelector((state) => state.employeeReducer.employees);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
        await dispatch({ type: 'FETCH_EMPLOYEE_INFO' });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (jobsBox && Array.isArray(jobsBox)) {
      setJobs(jobsBox);
    }
  }, [jobsBox]);

  const moveJob = useCallback((dragIndex, hoverIndex) => {
    setJobs((prevJobs) => {
      const newJobs = [...prevJobs];
      const draggedJob = newJobs[dragIndex];
      newJobs.splice(dragIndex, 1);
      newJobs.splice(hoverIndex, 0, draggedJob);
      return newJobs;
    });
  }, []);

  const moveEmployee = useCallback((employeeId, targetProjectId, sourceUnionId, sourceProjectId) => {
    console.log('Move Employee', employeeId, 'to', targetProjectId, 'from union', sourceUnionId, 'or project', sourceProjectId);
    dispatch({ 
      type: 'MOVE_EMPLOYEE', 
      payload: { employeeId, targetProjectId, sourceUnionId }
    });
  }, [dispatch]);

  const memoizedJobs = useMemo(() => jobs, [jobs]);

  if (isLoading) {
    return <div>Loading...</div>;

  }

  return (
    <div className="scheduling-container">
      <div>

        {!memoizedJobs || memoizedJobs.length === 0 ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">YOU HAVE NO JOBS</td>

              </tr>
            </tbody>
          </table>
        ) : (
          <div className="jobs-container">

            {memoizedJobs.map((job, index) => (
              <DraggableJobBox
                key={job.id}
                job={job}
                index={index}
                moveJob={moveJob}
                moveEmployee={moveEmployee}
                employees={allEmployees.filter(emp => emp.current_location === 'project' && emp.job_id === job.id)}

              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export default React.memo(Scheduling);

