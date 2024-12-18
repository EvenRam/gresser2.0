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
  const employeesByDate = useSelector((state) => state.scheduleReducer.employeesByDate);
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  const highlightedEmployees = useSelector((state) => state.employeeReducer.highlightedEmployees);
  
  // Get employees for the selected date
  const allEmployees = employeesByDate[selectedDate] || [];
  
  // Initialize schedule and handle date changes
  useEffect(() => {
    const initializeSchedule = async () => {
      setIsLoading(true);
      try {
        // Initialize the schedule with saved date
        await dispatch({ type: 'INITIALIZE_SCHEDULE' });
      } catch (error) {
        console.error('Error initializing schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSchedule();
  }, [dispatch]);

  // Handle data fetching when selected date changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) return;
      
      setIsLoading(true);
      try {
        // Fetch all data for the selected date
        await Promise.all([
          dispatch({ 
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
            payload: { date: selectedDate }
          }),
          dispatch({ 
            type: 'FETCH_EMPLOYEES', 
            payload: { date: selectedDate }
          }),
          dispatch({
            type: 'FETCH_UNIONS_WITH_EMPLOYEES',
            payload: { date: selectedDate }
          })
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch, selectedDate]);

  // Handle employee movement with highlighting
  const moveEmployee = useCallback((employeeId, targetProjectId, sourceProjectId) => {
    dispatch({
      type: 'MOVE_EMPLOYEE',
      payload: {
        employeeId,
        targetProjectId,
        sourceProjectId,
        date: selectedDate,
        is_highlighted: true // Ensure highlighting on move
      },
    });
  }, [dispatch, selectedDate]);

  // Handle employee ordering within projects
  const updateEmployeeOrder = useCallback(async (projectId, orderedEmployeeIds) => {
    try {
      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId,
          employees: orderedEmployeeIds.map((id, index) => ({
            id,
            display_order: index
          })),
          date: selectedDate
        }
      });

      await axios.put('/api/project/updateOrder', {
        projectId,
        orderedEmployeeIds,
        date: selectedDate
      });
    } catch (error) {
      console.error('Error updating employee order:', error);
    }
  }, [dispatch, selectedDate]);

  // Handle project ordering
  const moveJob = useCallback(async (sourceIndex, targetIndex) => {
    try {
      dispatch({
        type: 'REORDER_PROJECTS',
        payload: { sourceIndex, targetIndex, date: selectedDate },
      });

      const orderedProjectIds = projects
        .slice()
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((project) => project.id);

      const [movedId] = orderedProjectIds.splice(sourceIndex, 1);
      orderedProjectIds.splice(targetIndex, 0, movedId);

      await axios.put('/api/project/updateProjectOrder', {
        orderedProjectIds,
        date: selectedDate
      });
    } catch (error) {
      console.error('Error updating project order:', error);
    }
  }, [dispatch, projects, selectedDate]);

  // Handle employee highlighting toggle
  const toggleHighlight = useCallback(async (employeeId, isHighlighted) => {
    try {
      await axios.put(`/api/schedule/${selectedDate}/${employeeId}/highlight`, {
        isHighlighted
      });

      dispatch({
        type: 'SET_HIGHLIGHTED_EMPLOYEE',
        payload: {
          id: employeeId,
          isHighlighted,
          date: selectedDate
        }
      });
    } catch (error) {
      console.error('Error toggling highlight:', error);
    }
  }, [dispatch, selectedDate]);

  const memoizedProjects = useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => {
        if (a.display_order !== null && b.display_order !== null) {
          return a.display_order - b.display_order;
        }
        return a.display_order === null ? 1 : -1;
      })
      .map((project) => ({
        ...project,
        employees: (project.employees || []).map(emp => ({
          ...emp,
          is_highlighted: emp.is_highlighted || highlightedEmployees[emp.id]
        }))
      }));
  }, [projects, highlightedEmployees]);

  const totalAssignedEmployees = useMemo(() => {
    return memoizedProjects.reduce(
      (total, project) => total + (project.employees?.length || 0),
      0
    );
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
                key={project.job_id}
                job={project}
                index={index}
                moveJob={moveJob}
                moveEmployee={moveEmployee}
                updateEmployeeOrder={updateEmployeeOrder}
                toggleHighlight={toggleHighlight}
                employees={project.employees}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Scheduling);