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
    const projectsWithEmployees = projects.map(project => ({
      ...project,
      employees: allEmployees.filter(emp => emp.job_id === project.id)
    }));

    // Sort projects: non-empty first, then empty
    return projectsWithEmployees.sort((a, b) => {
      if (a.employees.length === 0 && b.employees.length > 0) return 1;
      if (a.employees.length > 0 && b.employees.length === 0) return -1;
      return 0;
    });
  }, [projects, allEmployees]);

  const totalAssignedEmployees = useMemo(() => {
    return memoizedProjects.reduce((total, project) => total + project.employees.length, 0);
  }, [memoizedProjects]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="scheduling-container">
      <h2 className="total-employees">Total Employees Assigned to Projects: {totalAssignedEmployees}</h2>
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
            {memoizedProjects.length % 2 !== 0 && (
              <div className="empty-job-box"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Scheduling);