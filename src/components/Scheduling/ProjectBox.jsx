import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from './Employee';
import '../Trades/Box.css';
import '../Scheduling/Scheduling.css';

const ProjectBox = ({
  id,
  employees = [],
  moveEmployee,
  job_name,
  rain_day
}) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  const isEditable = useSelector((state) => state.scheduleReducer.isEditable);
  const [orderedEmployees, setOrderedEmployees] = useState([]);
  const boxRef = useRef(null);

  // Sort employees by display order
  useEffect(() => {
    if (!Array.isArray(employees)) {
      console.warn('Employees prop is not an array:', employees);
      return;
    }
    const validEmployees = employees.filter(emp => emp && emp.id);
    const sorted = [...validEmployees].sort((a, b) => {
      if (a.display_order === null) return 1;
      if (b.display_order === null) return -1;
      return a.display_order - b.display_order;
    });
    setOrderedEmployees(sorted);
  }, [employees]);

  const highlightedEmployees = useSelector(state =>
    state.employeeReducer.highlightedEmployeesByDate[selectedDate] || {}
  );

  // Handle employee highlighting
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

  // Calculate drop position
  const calculateDropIndex = (monitor) => {
    if (!boxRef.current || !monitor.getClientOffset()) {
        // Return a safe default if we don't have valid measurements
        return orderedEmployees.length;
    }

    const hoveredRect = boxRef.current.getBoundingClientRect();
    const clientOffset = monitor.getClientOffset();
    
    if (!clientOffset) {
        return orderedEmployees.length;
    }

    const mouseY = clientOffset.y - hoveredRect.top;
    const height = hoveredRect.bottom - hoveredRect.top;

    // Ensure we have employees and valid height
    if (!orderedEmployees.length || height <= 0) {
        return 0;
    }
    
    let index = Math.floor((mouseY / height) * orderedEmployees.length);

    // Clamp the index between valid bounds
    return Math.max(0, Math.min(index, orderedEmployees.length));
};

  // Handle drops
  const handleDrop = useCallback((item, monitor) => {
    if (!item?.id || !isEditable) return;
    
    const dropIndex = calculateDropIndex(monitor);
    const isExternalMove = item.current_location === 'union' ||
                          (item.current_location === 'project' && item.projectId !== id);

    if (isExternalMove) {
      moveEmployee(item.id, id, item.union_id, selectedDate, dropIndex);
      dispatch({
        type: 'SET_HIGHLIGHTED_EMPLOYEE',
        payload: {
          id: item.id,
          isHighlighted: true,
          date: selectedDate
        }
      });
    }
  }, [id, moveEmployee, dispatch, selectedDate, isEditable, orderedEmployees.length]);

  // Configure drop target
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [handleDrop]);

  // Update handleReorder to be more robust
const handleReorder = useCallback(async (fromIndex, toIndex) => {
  if (!isEditable || fromIndex === toIndex) return;
  
  const newOrder = [...orderedEmployees];
  const [moved] = newOrder.splice(fromIndex, 1);
  
  if (!moved) return; // Guard against invalid moves
  
  newOrder.splice(toIndex, 0, moved);

  // Update local state immediately for smooth UI
  setOrderedEmployees(newOrder);

  try {
      const orderedEmployeeIds = newOrder
          .filter(emp => emp && emp.employee_status)
          .map(emp => emp.id);

      if (orderedEmployeeIds.length > 0) {
          dispatch({
              type: 'UPDATE_EMPLOYEE_ORDER',
              payload: {
                  projectId: id,
                  orderedEmployeeIds,
                  sourceIndex: fromIndex,
                  targetIndex: toIndex,
                  date: selectedDate
              }
          });
      }
  } catch (error) {
      console.error('Error updating employee order:', error);
      setOrderedEmployees(orderedEmployees); // Revert on error
  }
}, [orderedEmployees, id, dispatch, selectedDate, isEditable]);

  const currentRainDay = useSelector(state => {
    const projects = state.projectReducer.projectsByDate[selectedDate] || [];
    const project = projects.find(p => p.id === id);
    return project?.rain_day || false;
  });

  const handleRainDayToggle = useCallback(() => {
    if (!isEditable) return;
    
    const newRainDayStatus = !currentRainDay;
    
    dispatch({
      type: 'UPDATE_RAIN_DAY_STATUS_REQUEST',
      payload: {
        jobId: id,
        isRainDay: newRainDayStatus,
        date: selectedDate
      }
    });
  }, [dispatch, id, currentRainDay, selectedDate, isEditable]);

  if (!id) {
    return null;
  }

  return (
    <div
      ref={(el) => {
        boxRef.current = el;
        drop(el);
      }}
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
        style={{ 
          backgroundColor: '#396a54', 
          color: 'white', 
          padding: '5px', 
          fontSize: '16px', 
          margin: '-5px -5px 5px -5px' 
        }}>
        {job_name}
      </h4>
      
      <div style={{ flex: 1, marginBottom: '10px' }}>
        {orderedEmployees.length === 0 ? (
          <p className="no-employees-message">No employees assigned</p>
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
      </div>
      <div className="project-box-footer">
        <div className="employee-count">
          Employees: {orderedEmployees.filter(emp => emp.employee_status === true).length}
        </div>
        <div className="rain-day-toggle">
          <label>
            <input
              type="checkbox"
              checked={currentRainDay}
              onChange={handleRainDayToggle}
              disabled={!isEditable}
              className="rain-day-checkbox"
            />
            <span className="rain-day-label">Rain Day</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProjectBox);