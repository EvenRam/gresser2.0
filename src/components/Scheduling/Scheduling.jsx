import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import DraggableJobBox from './DraggableJobBox';
import './EmployeeStyles.css';
import './Scheduling.css';
import DateSchedule from './DateSchedule';


const Scheduling = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  // Redux state selectors
  const projects = useSelector((state) => state.projectReducer.projects);
  const allEmployees = useSelector((state) => state.employeeReducer.employeesByDate);
  const selectedDate = useSelector((state) => state.scheduleReducer.date);
  console.log('Projects:', projects);
  console.log('All Employees:', allEmployees);
  console.log('Selected Date:', selectedDate);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (selectedDate) {
          // Dispatch actions to fetch projects and employees for the selected date
          await dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES', payload: { date: selectedDate } });
          
          await dispatch({ type: 'FETCH_EMPLOYEES', payload: { date: selectedDate } });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch, selectedDate]);

  const moveEmployee = useCallback((employeeId, targetProjectId, sourceProjectId) => {
    dispatch({
      type: 'MOVE_EMPLOYEE',
      payload: {
        employeeId,
        targetProjectId,
        sourceProjectId,
        date: selectedDate
      }
    });
  }, [dispatch, selectedDate]);

  const moveJob = useCallback(async (sourceIndex, targetIndex) => {
    try {
      // Immediate UI update
      dispatch({
        type: 'REORDER_PROJECTS',
        payload: { sourceIndex, targetIndex, date: selectedDate }
      });

      // Prepare the updated order of project IDs
      const orderedProjectIds = projects
        .slice()
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(project => project.id);

      // Move the project in the ordered array
      const [movedId] = orderedProjectIds.splice(sourceIndex, 1);
      orderedProjectIds.splice(targetIndex, 0, movedId);

      // Persist to the backend
      await axios.put('/api/project/updateProjectOrder', { orderedProjectIds });
    } catch (error) {
      console.error('Error updating project order:', error);
    }
  }, [dispatch, projects, selectedDate]);

  const memoizedProjects = useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => {
        if (a.display_order !== null && b.display_order !== null) {
          return a.display_order - b.display_order;
        }
        return a.display_order === null ? 1 : -1;
      })
      .map(project => ({
        ...project,
        employees: allEmployees.filter(emp => emp.job_id === project.id)
      }));
  }, [projects, allEmployees]);

  const totalAssignedEmployees = useMemo(() => {
    return memoizedProjects.reduce((total, project) => total + (project.employees?.length || 0), 0);
  }, [memoizedProjects]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="scheduling-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span className="total-employees">Total Employees: {totalAssignedEmployees}</span>
        <DateSchedule />
        <button
          onClick={handlePrint}
          className="btn"
          style={{ marginLeft: 'auto' }}
        >
          Print Schedule
        </button>
      </div>
      <div>
        {!memoizedProjects || memoizedProjects.length === 0 ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">YOU HAVE NO JOBS</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="jobs-container">
            {memoizedProjects.map((project, index) => (
              <DraggableJobBox
                key={project.id}
                job={project}
                index={index}
                moveJob={moveJob}
                moveEmployee={moveEmployee}
                employees={project.employees}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Scheduling);