import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import Employee from './Employee';
import '../Trades/Box.css'

const ProjectBox = ({ id, employees = [], moveEmployee, job_name }) => {
  // console.log('🎯 ProjectBox props:', { id, job_name, employees });
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  const isEditable = useSelector((state) => state.scheduleReducer.isEditable);
  const [orderedEmployees, setOrderedEmployees] = useState([]);
 
  // console.log('ProjectBox rendering with props:', { 
  //   id, 
  //   job_name,
  //   rawEmployees: employees,
  //   employeesCount: employees.length 
  // });
 
  useEffect(() => {
    // console.log('ProjectBox employees changed:', employees);
  }, [employees]);
 
  useEffect(() => {
    if (!Array.isArray(employees)) {
      console.warn('Employees prop is not an array:', employees);
      return;
    }
    const validEmployees = employees.filter(emp => emp && emp.id);
    // console.log('Valid employees:', validEmployees);
    const sorted = [...validEmployees].sort((a, b) => {
      if (a.display_order === null) return 1;
      if (b.display_order === null) return -1;
      return a.display_order - b.display_order;
    });
 
    // console.log('Sorted employees:', sorted);
    setOrderedEmployees(sorted);
  }, [employees]);
 
  const highlightedEmployees = useSelector(state => 
    state.employeeReducer.highlightedEmployeesByDate[selectedDate] || {}
  );
 
  if (!id) {
    // console.warn('ProjectBox rendered without an id prop');
    return null;
  }
 
  // console.log('highlightedEmployees:', highlightedEmployees);
 
  const handleEmployeeClick = useCallback((employeeId, currentHighlightState) => {
    if (!isEditable) return;
    
    dispatch({ 
      type: 'SET_HIGHLIGHTED_EMPLOYEE', 
      payload: { 
        id: employeeId, 
        isHighlighted: !currentHighlightState,
        date: selectedDate
      }
    });
  }, [dispatch, selectedDate, isEditable]);
 
  const handleDrop = useCallback((item) => {
    if (!item?.id || !isEditable) return;
 
    // console.log('Dropped item:', item);
    // console.log('Current project box ID:', id);
 
    const isExternalMove = item.current_location === 'union' || 
                          (item.current_location === 'project' && item.projectId !== id);
 
    moveEmployee(item.id, id, item.union_id, selectedDate);
 
    if (isExternalMove) {
      dispatch({ 
        type: 'SET_HIGHLIGHTED_EMPLOYEE', 
        payload: { 
          id: item.id, 
          isHighlighted: true,
          date: selectedDate
        } 
      });
    }
  }, [id, moveEmployee, dispatch, selectedDate, isEditable]);
 
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [handleDrop]);
 
  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    if (!isEditable) return;
    
    const newOrder = [...orderedEmployees];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
 
    try {
      const orderedEmployeeIds = newOrder
        .filter(emp => emp.employee_status === true)
        .map(emp => emp.id);
 
      await axios.put('/api/project/updateOrder', {
        projectId: id,
        orderedEmployeeIds,
        date: selectedDate
      });
 
      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId: id,
          employees: newOrder,
          date: selectedDate
        }
      });
    } catch (error) {
      console.error('Error updating employee order:', error);
      setOrderedEmployees(employees);
    }
  }, [orderedEmployees, id, dispatch, employees, selectedDate, isEditable]);
 
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
          .map((employee, index) => (
            <Employee
              key={employee.id}
              {...employee}
              projectId={id}
              index={index}
              name={`${employee.first_name} ${employee.last_name}`}
              isHighlighted={!!highlightedEmployees[employee.id]}
              onClick={() => handleEmployeeClick(employee.id, !!highlightedEmployees[employee.id])}
              onReorder={handleReorder}
            />
          ))
      )}
      <h6 className='employee-count'>
        Employees: {orderedEmployees.filter(emp => emp.employee_status === true).length}
      </h6>
    </div>
  );
 };
 

export default React.memo(ProjectBox);