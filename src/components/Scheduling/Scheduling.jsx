import React, { useEffect, useState, useCallback } from 'react'; 
import { useDispatch, useSelector } from 'react-redux'; 
import { useDrag, useDrop } from 'react-dnd';
import ProjectBox from './ProjectBox'; 
import './EmployeeStyles.css'; 
import './Scheduling.css';
import DraggableJobBox from './DraggableJobBox';
import Employee from './Employee';

const Scheduling = () => {
  const dispatch = useDispatch(); 
  const [isLoading, setIsLoading] = useState(true); 
  const jobsBox = useSelector((state) => state.projectReducer); 
  const [jobs, setJobs] = useState([]); 

  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' }); 
      setIsLoading(false); 
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

  const moveEmployee = useCallback((employeeId, targetProjectId) => {
    console.log('Move Employee', employeeId, 'to', targetProjectId); 
    dispatch({ type: 'MOVE_EMPLOYEE', payload: { employeeId, targetProjectId } }); 
  }, [dispatch]); 
  if (isLoading) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="scheduling-container">
      <div>
        {!jobs || jobs.length === 0 ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">YOU HAVE NO JOBS</td> 
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="jobs-container">
            {jobs.map((job, index) => (
              <DraggableJobBox
                key={job.id} 
                job={job}
                index={index} 
                moveJob={moveJob} 
                moveEmployee={moveEmployee} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduling; 
