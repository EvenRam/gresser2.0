import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import DraggableJobBox from './DraggableJobBox';
import './EmployeeStyles.css';
import './Scheduling.css';

const Scheduling = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const projects = useSelector((state) => state.projectReducer);
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
      // Update state first for immediate feedback
      dispatch({
        type: 'REORDER_PROJECTS',
        payload: { sourceIndex, targetIndex }
      });

      // Get the updated order of project IDs
      const orderedProjectIds = projects
        .slice() // Create a copy of the array
        .sort((a, b) => {
          if (a.display_order === null) return 1;
          if (b.display_order === null) return -1;
          return a.display_order - b.display_order;
        })
        .map(project => project.id);

      // Move the project in the ordered array
      const [movedId] = orderedProjectIds.splice(sourceIndex, 1);
      orderedProjectIds.splice(targetIndex, 0, movedId);

      // Persist the new order to the database
      await axios.put('/api/project/updateProjectOrder', {
        orderedProjectIds
      });
    } catch (error) {
      console.error('Error updating project order:', error);
      // You might want to add error handling here, such as reverting the order in the UI
    }
  }, [dispatch, projects]);

  const memoizedProjects = useMemo(() => {
    // Sort projects by display_order, then by other criteria
    return projects
      .slice()
      .sort((a, b) => {
        // First sort by display_order
        if (a.display_order !== null && b.display_order !== null) {
          return a.display_order - b.display_order;
        }
        if (a.display_order === null) return 1;
        if (b.display_order === null) return -1;

        // Then by employee count if display_order is the same
        const aEmployees = a.employees?.length || 0;
        const bEmployees = b.employees?.length || 0;
        if (aEmployees === 0 && bEmployees > 0) return 1;
        if (aEmployees > 0 && bEmployees === 0) return -1;
        
        // Finally by ID if everything else is equal
        return a.id - b.id;
      })
      .map(project => ({
        ...project,
        employees: allEmployees.filter(emp => emp.job_id === project.id)
      }));
  }, [projects, allEmployees]);

  const totalAssignedEmployees = useMemo(() => {
    return memoizedProjects.reduce((total, project) => total + project.employees.length, 0);
  }, [memoizedProjects]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="scheduling-container">
      <h2 className="total-employees">Total Employees: {totalAssignedEmployees}</h2>
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