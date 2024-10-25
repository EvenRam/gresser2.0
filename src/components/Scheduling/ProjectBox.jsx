import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from './Employee';
import '../Trades/Box.css'

const ProjectBox = ({ id, employees = [], moveEmployee, job_name }) => {
  const dispatch = useDispatch();
  const highlightedEmployees = useSelector(state => state.employeeReducer.highlightedEmployees);

  useEffect(() => {
    console.log('ProjectBox mounted/updated. ID:', id);
    console.log('Current highlightedEmployees:', highlightedEmployees);
  }, [id, highlightedEmployees]);

  const handleDrop = useCallback((item) => {
    console.log('Dropped item:', item);
    console.log('Current project box ID:', id);
    moveEmployee(item.id, id, item.union_id);
    
    if (item.current_location === 'project') {
      console.log('Setting highlighted employee:', item.id);
      dispatch({ type: 'SET_HIGHLIGHTED_EMPLOYEE', payload: { id: item.id, isHighlighted: true } });
    }
  }, [id, moveEmployee, dispatch]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [handleDrop]);

  const handleEmployeeClick = useCallback((employeeId, isHighlighted) => {
    console.log('Employee clicked:', employeeId, 'isHighlighted:', isHighlighted);
    if (isHighlighted) {
      console.log('Removing highlight from employee:', employeeId);
      dispatch({ type: 'SET_HIGHLIGHTED_EMPLOYEE', payload: { id: employeeId, isHighlighted: false } });
    }
  }, [dispatch]);

  console.log('Rendering ProjectBox. ID:', id, 'Employees:', employees);

  return (
    <div
      ref={drop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid gray',
        width: '170px',
        minHeight: '100px',
        margin: '-5px',
        padding: '5px',
        backgroundColor: isOver ? 'lightgray' : 'white',
       }}
    >
      <h4 className='projectboxname' 
      style={{ backgroundColor: '#396a54', color: 'white', padding: '5px' ,fontSize: '16px' }}>{job_name}</h4>
      {employees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        employees
        .filter(employee => employee.employee_status === true) 
        .map(employee => {
          const isHighlighted = !!highlightedEmployees[employee.id];
          console.log('Rendering employee:', employee.id, 'isHighlighted:', isHighlighted);
          return (
            <Employee
              key={employee.id}
              {...employee}
              name={`${employee.first_name} ${employee.last_name}`}
              isHighlighted={isHighlighted}
              onClick={handleEmployeeClick}
            />
          );
        })
      )}
      <h6 className='employee-count'>Employees: {employees.filter(emp => emp.employee_status === true).length}</h6>
    </div>
  );
};

export default React.memo(ProjectBox);