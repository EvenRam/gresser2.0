import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import Employee from './Employee';
import '../Trades/Box.css'

const ProjectBox = ({ id, employees = [], moveEmployee, job_name }) => {
  const dispatch = useDispatch();
  const highlightedEmployees = useSelector(state => state.employeeReducer.highlightedEmployees);
  const [orderedEmployees, setOrderedEmployees] = useState([]);

  // Sort employees by display_order when component mounts or employees change
  useEffect(() => {
    const sorted = [...employees].sort((a, b) => {
      if (a.display_order === null) return 1;
      if (b.display_order === null) return -1;
      return a.display_order - b.display_order;
    });
    setOrderedEmployees(sorted);
  }, [employees]);

  const handleDrop = useCallback((item) => {
    console.log('Dropped item:', item);
    console.log('Current project box ID:', id);
    moveEmployee(item.id, id, item.union_id);
    
    if (item.current_location === 'project') {
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
    if (isHighlighted) {
      dispatch({ type: 'SET_HIGHLIGHTED_EMPLOYEE', payload: { id: employeeId, isHighlighted: false } });
    }
  }, [dispatch]);

  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    const newOrder = [...orderedEmployees];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setOrderedEmployees(newOrder);

    try {
      // Get ordered employee IDs
      const orderedEmployeeIds = newOrder
        .filter(emp => emp.employee_status === true)
        .map(emp => emp.id);

      // Send update to server
      await axios.put('/api/project/updateOrder', {
        projectId: id,
        orderedEmployeeIds
      });

      // Update Redux store
      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId: id,
          employees: newOrder
        }
      });
    } catch (error) {
      console.error('Error updating employee order:', error);
      // Optionally revert the order if the server update fails
      setOrderedEmployees(employees);
    }
  }, [orderedEmployees, id, dispatch, employees]);

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
        style={{ backgroundColor: '#396a54', color: 'white', padding: '5px', fontSize: '16px' }}>
        {job_name}
      </h4>
      {orderedEmployees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        orderedEmployees
          .filter(employee => employee.employee_status === true) 
          .map((employee, index) => {
            const isHighlighted = !!highlightedEmployees[employee.id];
            return (
              <Employee
                key={employee.id}
                {...employee}
                index={index}
                name={`${employee.first_name} ${employee.last_name}`}
                isHighlighted={isHighlighted}
                onClick={handleEmployeeClick}
                onReorder={handleReorder}
              />
            );
          })
      )}
      <h6 className='employee-count'>
        Employees: {orderedEmployees.filter(emp => emp.employee_status === true).length}
      </h6>
    </div>
  );
};

export default React.memo(ProjectBox);