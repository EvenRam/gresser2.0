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
  const [projectOrder, setProjectOrder] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching projects and employees...');
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
    console.log('Projects changed, updating project order...');
    console.log('Current projects:', projects);
    const savedOrder = localStorage.getItem('projectOrder');
    console.log('Saved order from localStorage:', savedOrder);
    
    if (savedOrder) {
      const parsedOrder = JSON.parse(savedOrder);
      console.log('Parsed saved order:', parsedOrder);
      
      // Filter out any project IDs that no longer exist
      const validOrder = parsedOrder.filter(id => projects.some(project => project.id === id));
      console.log('Valid order after filtering:', validOrder);
      
      // Add any new project IDs that aren't in the order
      const newOrder = [...validOrder, ...projects.filter(project => !validOrder.includes(project.id)).map(project => project.id)];
      console.log('New order after adding new projects:', newOrder);
      
      setProjectOrder(newOrder);
    } else {
      const defaultOrder = projects.map(project => project.id);
      console.log('No saved order, using default order:', defaultOrder);
      setProjectOrder(defaultOrder);
    }
  }, [projects]);

  useEffect(() => {
    console.log('Project order changed, saving to localStorage:', projectOrder);
    localStorage.setItem('projectOrder', JSON.stringify(projectOrder));
  }, [projectOrder]);

  const moveEmployee = useCallback((employeeId, targetProjectId, sourceUnionId, sourceProjectId) => {
    console.log('Moving employee:', { employeeId, targetProjectId, sourceUnionId, sourceProjectId });
    dispatch({
      type: 'MOVE_EMPLOYEE',
      payload: { employeeId, targetProjectId, sourceUnionId, sourceProjectId }
    });
  }, [dispatch]);

  const memoizedProjects = useMemo(() => {
    console.log('Recalculating memoizedProjects...');
    return projects.map(project => ({
      ...project,
      employees: allEmployees.filter(emp => emp.job_id === project.id)
    }));
  }, [projects, allEmployees]);

  const moveProject = useCallback((dragIndex, hoverIndex) => {
    console.log('Moving project:', { dragIndex, hoverIndex });
    setProjectOrder(prevOrder => {
      console.log('Previous project order:', prevOrder);
      const newOrder = [...prevOrder];
      const [reorderedItem] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, reorderedItem);
      console.log('New project order after move:', newOrder);
      localStorage.setItem('projectOrder', JSON.stringify(newOrder));
      console.log('Saved new order to localStorage:', JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const orderedProjects = projectOrder
    .map(id => memoizedProjects.find(project => project.id === id))
    .filter(Boolean);

  console.log('Final ordered projects:', orderedProjects);

  return (
    <div className="scheduling-container">
      <div>
        {!orderedProjects || orderedProjects.length === 0 ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">YOU HAVE NO JOBS</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="jobs-container">
            {orderedProjects.map((project, index) => (
              <DraggableJobBox
                key={project.id}
                job={project}
                index={index}
                moveEmployee={moveEmployee}
                moveProject={moveProject}
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