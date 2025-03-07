import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import axios from 'axios';
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
  const [dropPosition, setDropPosition] = useState(null);
  
  // Sort employees by display_order
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
  
  if (!id) {
    return null;
  }
  
  // Calculate drop position based on mouse coordinates
  // Use a constant CALCULATION_HEIGHT to maintain consistent drop positioning
  // This is different from the visual display height
  const calculateDropPosition = useCallback((monitor) => {
    if (!boxRef.current || !monitor.getClientOffset()) {
      return orderedEmployees.length;
    }
  
    const boxRect = boxRef.current.getBoundingClientRect();
    const clientOffset = monitor.getClientOffset();
    
    // Account for the header height
    const headerHeight = 35;
    const mouseY = clientOffset.y - boxRect.top - headerHeight;
    
    // Get active employees
    const activeEmployees = orderedEmployees.filter(emp => emp.employee_status === true);
    
    // Empty project handling
    if (activeEmployees.length === 0) {
      return 0;
    }
    
    // IMPORTANT: This value is used for calculation only
    // It should match the original value for consistent positioning
    const CALCULATION_HEIGHT = 20;
    
    // Calculate position based on mouse coordinates
    const calculatedIndex = Math.floor(mouseY / CALCULATION_HEIGHT);
    
    // Special handling for drop position after the last item
    if (mouseY > activeEmployees.length * CALCULATION_HEIGHT - 2) {
      return activeEmployees.length;
    }
    
    // Ensure index is within bounds
    return Math.max(0, Math.min(calculatedIndex, activeEmployees.length));
  }, [orderedEmployees]);
  
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
  
  // Handle employee reordering
  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    if (!isEditable || fromIndex === toIndex) return;
    
    try {
      // Create a new array with the updated order
      const newOrder = [...orderedEmployees];
      const [movedEmployee] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedEmployee);
      
      // Update the local state first for immediate UI feedback
      setOrderedEmployees(newOrder);
      
      // Extract only active employees
      const activeEmployees = newOrder.filter(emp => emp.employee_status === true);
      
      // Create an array of just the employee IDs
      const orderedEmployeeIds = activeEmployees.map(emp => emp.id);
      
      // Make sure we have valid IDs
      if (!orderedEmployeeIds.length) {
        console.warn('No valid employee IDs for reordering');
        return;
      }
      
      // Dispatch the action to update the order
      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId: id,
          orderedEmployeeIds,
          date: selectedDate
        }
      });
    } catch (error) {
      console.error('Error reordering employees:', error);
      
      // Refresh from server on error
      dispatch({
        type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
        payload: { date: selectedDate }
      });
    }
  }, [orderedEmployees, id, dispatch, selectedDate, isEditable]);
  
  // Handle employee drop
  const handleDrop = useCallback((item) => {
    if (!item?.id || !isEditable) return;
    
    // Make sure dropPosition has a valid fallback for last position
    const dropIndex = dropPosition !== null ? dropPosition : orderedEmployees.length;
    
    // Determine if this is from another container
    const isExternalMove = item.current_location === 'union' || 
                          (item.current_location === 'project' && item.projectId !== id);
    
    // Handle internal reordering
    if (!isExternalMove && typeof item.index === 'number') {
      handleReorder(item.index, dropIndex);
    } else {
      // Move from union or another project
      moveEmployee({
        employeeId: item.id,
        targetProjectId: id,
        dropIndex,
        date: selectedDate
      });
      
      // Highlight on external move
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
    }
    
    // Reset drop position
    setDropPosition(null);
  }, [id, moveEmployee, dispatch, selectedDate, isEditable, dropPosition, orderedEmployees.length, handleReorder]);
  
  // Configure drop target
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    hover: (item, monitor) => {
      if (!isEditable) return;
      
      // Calculate and update drop position
      const position = calculateDropPosition(monitor);
      if (dropPosition !== position) {
        setDropPosition(position);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
  }), [handleDrop, calculateDropPosition, isEditable, dropPosition]);
  
  // Get rain day status from Redux
  const currentRainDay = useSelector(state => {
    const projects = state.projectReducer.projectsByDate[selectedDate] || [];
    const project = projects.find(p => p.id === id);
    return project?.rain_day || false;
  });
  
  // Handle rain day toggle
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
 
  // CALCULATION_HEIGHT determines where to place the drop indicator
  // This should match the value used in calculateDropPosition
  const CALCULATION_HEIGHT = 20;
  const VISUAL_HEIGHT = 14; // The actual visual height of the employee items

  return (
    <div
      ref={node => {
        boxRef.current = node;
        drop(node);
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
        position: 'relative'
      }}
    >
      <h4 className='projectboxname' 
        style={{ backgroundColor: '#396a54', color: 'white', padding: '5px', fontSize: '16px', margin: '-5px -5px 5px -5px' }}>
        {job_name}
      </h4>
      
      <div style={{ 
        flex: 1, 
        marginBottom: '10px',
        position: 'relative'
      }}>
        {/* Drop position indicator - position based on the CALCULATION_HEIGHT */}
        {isEditable && isOver && dropPosition !== null && (
          <div 
            className="drop-position-indicator"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#4a90e2',
              // Multiply by the constant calculation height, not the visual height
              top: `${dropPosition * CALCULATION_HEIGHT * (VISUAL_HEIGHT/CALCULATION_HEIGHT)}px`,
              zIndex: 5,
              boxShadow: '0 0 3px rgba(74, 144, 226, 0.7)'
            }}
          />
        )}
        
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
                onClick={handleEmployeeClick}
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