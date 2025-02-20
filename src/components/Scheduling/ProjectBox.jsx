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
  updateEmployeeOrder,
  job_name,
  rain_day
}) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  const isEditable = useSelector((state) => state.scheduleReducer.isEditable);
  const [orderedEmployees, setOrderedEmployees] = useState([]);
  const boxRef = useRef(null);

  // Set up orderedEmployees when employees prop changes
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

  // Enhanced drop position calculation
  const calculateDropIndex = useCallback((monitor) => {
    if (!boxRef.current || !monitor.getClientOffset()) {
      console.log('Missing requirements for drop calculation');
      return orderedEmployees.length;
    }

    const hoveredRect = boxRef.current.getBoundingClientRect();
    const clientOffset = monitor.getClientOffset();
    const mouseY = clientOffset.y - hoveredRect.top;

    // Get only active employees for position calculation
    const activeEmployees = orderedEmployees.filter(emp => emp.employee_status === true);
    
    if (activeEmployees.length === 0) {
      return 0;
    }

    const itemHeight = hoveredRect.height / activeEmployees.length;
    const index = Math.floor(mouseY / itemHeight);

    // Ensure index is within bounds
    return Math.max(0, Math.min(index, activeEmployees.length));
  }, [orderedEmployees]);

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

  // Enhanced drop handling for unified approach
  // ProjectBox.jsx handleDrop function
const handleDrop = useCallback((item, monitor) => {
  if (!item?.id || !isEditable) return;

  const dropIndex = calculateDropIndex(monitor);
  console.log('Drop handling:', {
      itemId: item.id,
      sourceLocation: item.sourceLocation,
      dropIndex,  // Let's verify this is correct
      projectId: id
  });

  // Determine if this is an external move
  const isExternalMove = item.sourceLocation.type === 'union' || 
                      (item.sourceLocation.type === 'project' && item.sourceLocation.id !== id);

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
}, [id, moveEmployee, dispatch, selectedDate, isEditable, calculateDropIndex]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    hover: (item, monitor) => {
      if (!isEditable || !item) return;
      
      // Calculate and show drop position during hover
      const dropIndex = calculateDropIndex(monitor);
      console.log('Hover position:', dropIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
  }), [handleDrop, isEditable, calculateDropIndex]);

  // Setup drop ref
  const dropRef = useCallback((node) => {
    boxRef.current = node;
    drop(node);
  }, [drop]);

  const highlightedEmployees = useSelector(state =>
    state.employeeReducer.highlightedEmployeesByDate[selectedDate] || {}
  );

  // Handle internal reordering
  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    if (!isEditable) return;
    
    const newOrder = [...orderedEmployees];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    try {
      // Get active employees in the new order
      const orderedEmployeeIds = newOrder
        .filter(emp => emp.employee_status === true)
        .map(emp => emp.id);

      // Update through Redux/saga
      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId: id,
          orderedEmployeeIds,
          date: selectedDate
        }
      });

      // Update local state for immediate feedback
      setOrderedEmployees(newOrder);
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
    
    dispatch({
      type: 'UPDATE_RAIN_DAY_STATUS_REQUEST',
      payload: {
        jobId: id,
        isRainDay: !currentRainDay,
        date: selectedDate
      }
    });
  }, [dispatch, id, currentRainDay, selectedDate, isEditable]);

  return (
    <div
      ref={dropRef}
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