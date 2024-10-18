import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

  const memoizedProjects = useMemo(() => {
    return projects.map(project => ({
      ...project,
      employees: allEmployees.filter(emp => emp.job_id === project.id)
    }));
  }, [projects, allEmployees]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="scheduling-container">
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