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

  const memoizedProjects = useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => {
        if (a.display_order !== null && b.display_order !== null) {
          return a.display_order - b.display_order;
        }
        if (a.display_order === null) return 1;
        if (b.display_order === null) return -1;

        const aEmployees = a.employees?.length || 0;
        const bEmployees = b.employees?.length || 0;
        if (aEmployees === 0 && bEmployees > 0) return 1;
        if (aEmployees > 0 && bEmployees === 0) return -1;
        
        return a.id - b.id;
      })
      .map(project => ({
        ...project,
        employees: allEmployees.filter(emp => emp.job_id === project.id)
      }));
  }, [projects, allEmployees]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="scheduling-container">
      <div className="screen-only" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
          onClick={handlePrint}
          className="btn"
        >
          Print Schedule
        </button>
      </div>

      <div>
        {!memoizedProjects || memoizedProjects.length === 0 ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">NO PROJECTS AVAILABLE</td>
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