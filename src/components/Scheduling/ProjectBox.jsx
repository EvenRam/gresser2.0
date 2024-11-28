import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import Employee from './Employee';
import '../Trades/Box.css'

const ProjectBox = ({ id, employees = [], moveEmployee, job_name }) => {
  const dispatch = useDispatch();
  const highlightedEmployees = useSelector(state => state.employeeReducer.highlightedEmployees);
  const [orderedEmployees, setOrderedEmployees] = useState([]);
  const [insertPosition, setInsertPosition] = useState(null);
  const boxRef = useRef(null);

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
    
    const isExternalMove = item.current_location === 'union' || 
                          (item.current_location === 'project' && item.projectId !== id);
    
    moveEmployee(item.id, id, item.union_id);
    
    if (isExternalMove) {
      dispatch({ type: 'SET_HIGHLIGHTED_EMPLOYEE', payload: { id: item.id, isHighlighted: true } });
    }
    setInsertPosition(null);
  }, [id, moveEmployee, dispatch]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    hover: (item, monitor) => {
      if (!boxRef.current) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const boxRect = boxRef.current.getBoundingClientRect();
      const boxTop = boxRect.top + 40; // Account for header
      const mouseY = clientOffset.y - boxTop;
      
      const filteredEmployees = orderedEmployees.filter(emp => emp.employee_status === true);
      const employeeHeight = 24; // Approximate height of each employee item
      
      let newPosition = Math.floor((mouseY + employeeHeight / 2) / employeeHeight);
      newPosition = Math.max(0, Math.min(newPosition, filteredEmployees.length));
      
      setInsertPosition(newPosition);
    },
    drop: (item) => {
      handleDrop(item);
      setInsertPosition(null);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [handleDrop, orderedEmployees]);

  // Combine refs
  const combinedRef = (element) => {
    boxRef.current = element;
    drop(element);
  };

  const handleEmployeeClick = useCallback((employeeId, currentHighlightState) => {
    dispatch({ 
      type: 'SET_HIGHLIGHTED_EMPLOYEE', 
      payload: { 
        id: employeeId, 
        isHighlighted: !currentHighlightState 
      }
    });
  }, [dispatch]);

  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    const newOrder = [...orderedEmployees];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setOrderedEmployees(newOrder);

    try {
      const orderedEmployeeIds = newOrder
        .filter(emp => emp.employee_status === true)
        .map(emp => emp.id);

      await axios.put('/api/project/updateOrder', {
        projectId: id,
        orderedEmployeeIds
      });

      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId: id,
          employees: newOrder
        }
      });
    } catch (error) {
      console.error('Error updating employee order:', error);
      setOrderedEmployees(employees);
    }
  }, [orderedEmployees, id, dispatch, employees]);

  const activeEmployees = orderedEmployees.filter(employee => employee.employee_status === true);

  return (
    <div
      ref={combinedRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid gray',
        width: '170px',
        minHeight: '100px',
        margin: '-5px',
        padding: '5px',
        backgroundColor: isOver ? 'rgba(57, 106, 84, 0.1)' : 'white',
        position: 'relative'
      }}
    >
      <h4 className='projectboxname' 
        style={{ backgroundColor: '#396a54', color: 'white', padding: '5px', fontSize: '16px' }}>
        {job_name}
      </h4>
      
      <div style={{ position: 'relative', minHeight: '50px' }}>
        {activeEmployees.length === 0 ? (
          <p>No employees assigned</p>
        ) : (
          activeEmployees.map((employee, index) => (
            <React.Fragment key={employee.id}>
              {isOver && insertPosition === index && (
                <div
                  style={{
                    position: 'absolute',
                    left: '0',
                    right: '0',
                    height: '3px',
                    backgroundColor: '#396a54',
                    transform: 'translateY(-2px)',
                    zIndex: 1
                  }}
                />
              )}
              <Employee
                {...employee}
                projectId={id}
                index={index}
                name={`${employee.first_name} ${employee.last_name}`}
                isHighlighted={!!highlightedEmployees[employee.id]}
                onClick={() => handleEmployeeClick(employee.id, !!highlightedEmployees[employee.id])}
                onReorder={handleReorder}
              />
            </React.Fragment>
          ))
        )}
        {isOver && insertPosition === activeEmployees.length && (
          <div
            style={{
              position: 'absolute',
              left: '0',
              right: '0',
              bottom: '0',
              height: '3px',
              backgroundColor: '#396a54',
              zIndex: 1
            }}
          />
        )}
      </div>

      <h6 className='employee-count'>
        Employees: {activeEmployees.length}
      </h6>
    </div>
  );
};

export default React.memo(ProjectBox);