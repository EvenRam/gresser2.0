import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import DraggableJobBox from './DraggableJobBox';
import './EmployeeStyles.css';
import './Scheduling.css';

const Scheduling = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const projects = useSelector((state) => {
    const projectData = state.projectReducer;
    console.log('Raw project data from Redux:', projectData);
    return projectData;
  });
  const allEmployees = useSelector((state) => state.employeeReducer.employees);

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

  const moveEmployee = useCallback((employeeId, targetProjectId, sourceUnionId, sourceProjectId) => {
    dispatch({
      type: 'MOVE_EMPLOYEE',
      payload: { employeeId, targetProjectId, sourceUnionId }
    });
  }, [dispatch]);

  const moveJob = useCallback(async (sourceIndex, targetIndex) => {
    try {
      dispatch({
        type: 'REORDER_PROJECTS',
        payload: { sourceIndex, targetIndex }
      });

      const orderedProjectIds = projects
        .slice()
        .sort((a, b) => {
          if (a.display_order === null) return 1;
          if (b.display_order === null) return -1;
          return a.display_order - b.display_order;
        })
        .map(project => project.id);

      const [movedId] = orderedProjectIds.splice(sourceIndex, 1);
      orderedProjectIds.splice(targetIndex, 0, movedId);

      await axios.put('/api/project/updateProjectOrder', {
        orderedProjectIds
      });
    } catch (error) {
      console.error('Error updating project order:', error);
    }
  }, [dispatch, projects]);

  const isDateInRange = (startDate, endDate, selectedDate) => {
    if (!startDate || !endDate || !selectedDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const selected = new Date(selectedDate);
    
    // Reset time portions for accurate date comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    return selected >= start && selected <= end;
  };

  const filteredProjects = useMemo(() => {
    console.log('Filtering projects with date:', selectedDate);
    
    return projects.filter(project => {
      console.log('Checking project:', {
        id: project.id,
        name: project.job_name,
        startDate: project.start_date,
        endDate: project.end_date
      });

      const inRange = isDateInRange(project.start_date, project.end_date, selectedDate);
      console.log(`Project ${project.id} in range: ${inRange}`);
      return inRange;
    });
  }, [projects, selectedDate]);

  const memoizedProjects = useMemo(() => {
    console.log('Filtered projects count:', filteredProjects.length);
    
    return filteredProjects
      .slice()
      .sort((a, b) => {
        if (a.display_order !== null && b.display_order !== null) {
          return a.display_order - b.display_order;
        }
        if (a.display_order === null) return 1;
        if (b.display_order === null) return -1;
        
        return a.id - b.id;
      })
      .map(project => ({
        ...project,
        employees: allEmployees.filter(emp => emp.job_id === project.id)
      }));
  }, [filteredProjects, allEmployees]);

  const totalAssignedEmployees = useMemo(() => {
    return memoizedProjects.reduce((total, project) => 
      total + (project.employees?.length || 0), 0);
  }, [memoizedProjects]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDateChange = useCallback((event) => {
    const newDate = event.target.value;
    console.log('Date changed to:', newDate);
    setSelectedDate(newDate);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="scheduling-container">
      <div className="scheduling-header">
        <h2 className="total-employees">Total Assigned Employees: {totalAssignedEmployees}</h2>
        <div className="scheduling-controls">
          <div className="date-selector">
            <label htmlFor="schedule-date">Schedule Date: </label>
            <input
              type="date"
              id="schedule-date"
              value={selectedDate}
              onChange={handleDateChange}
              className="date-input"
            />
          </div>
          <button onClick={handlePrint} className="print-button">
            Print Schedule
          </button>
        </div>
      </div>

      <div className="schedule-content">
        {memoizedProjects.length === 0 ? (
          <div className="no-jobs-message">
            {selectedDate 
              ? `No projects active on ${new Date(selectedDate).toLocaleDateString()}` 
              : "No active projects available"}
          </div>
        ) : (
          <div className="jobs-container">
            {memoizedProjects.map((project, index) => (
              <DraggableJobBox
                key={project.id}
                job={project}
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

export default React.memo(Scheduling);