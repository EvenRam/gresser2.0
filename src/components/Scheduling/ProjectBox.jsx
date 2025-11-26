
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
  job_number,
  job_name,
  rain_day,
  isEditable // NEW: Explicitly passed prop
}) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  
  
  
  // Remove isEditable from useSelector since it's now a prop
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
  const calculateDropPosition = useCallback((monitor) => {
    if (!boxRef.current || !monitor.getClientOffset()) {
      return orderedEmployees.length;
    }
  
    const boxRect = boxRef.current.getBoundingClientRect();
    const clientOffset = monitor.getClientOffset();
    
    // Account for the header height
    const headerHeight = 35;
    const mouseY = clientOffset.y - boxRect.top - headerHeight;
    
    // Get active employees (filtered based on isEditable)
    const visibleEmployees = orderedEmployees.filter(emp => {
      // For past dates (not editable): show all employees who were assigned
      // For current/future dates (editable): only show currently active employees
      return isEditable ? emp.employee_status === true : true;
    });
    
    // Empty project handling
    if (visibleEmployees.length === 0) {
      return 0;
    }
    
    // Use a fixed item height for consistent calculation
    const ITEM_HEIGHT = 14; // Match the actual height of employee items
    
    // Calculate position based on mouse coordinates
    const calculatedIndex = Math.floor(mouseY / ITEM_HEIGHT);
    
    // Ensure index is within bounds
    return Math.max(0, Math.min(calculatedIndex, visibleEmployees.length));
  }, [orderedEmployees, isEditable]);
  
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
      
      // Extract only active employees (based on current date rules)
      const activeEmployees = newOrder.filter(emp => {
        return isEditable ? emp.employee_status === true : true;
      });
      
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
    
    // Use the saved drop position from hover - this matches what the user sees
    const dropIndex = dropPosition !== null ? dropPosition : orderedEmployees.length;
    
    // Log the drop position for debugging
    console.log('Dropping employee at index:', dropIndex);
    
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
  // Filter employees based on editable state
  const visibleEmployees = orderedEmployees.filter(employee => {
    // For past dates (not editable): show all employees who were assigned
    // For current/future dates (editable): only show currently active employees
    return isEditable ? employee.employee_status === true : true;
  });
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
        border: isOver ? '1px solid #4a90e2' : '1px solid gray',
        width: '170px',
        minHeight: '100px',
        margin: '-5px',
        padding: '5px',
        backgroundColor: 'white',
        position: 'relative'
      }}
    >
      <h4 className='projectboxname' 
  style={{ backgroundColor: '#396a54', color: 'white', padding: '5px', fontSize: '16px', margin: '-5px -5px 5px -5px' }}>
  {job_number} - {job_name}
</h4>
      
      <div style={{ 
        flex: 1, 
        marginBottom: '10px',
        position: 'relative'
      }}>
        {/* Drop position indicator */}
        {isEditable && isOver && dropPosition !== null && (
          <div 
            className="drop-position-indicator"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#4a90e2',
              top: `${dropPosition * 14}px`, // 14px matches employee height
              zIndex: 5,
              boxShadow: '0 0 3px rgba(74, 144, 226, 0.7)'
            }}
          />
        )}
        
        {visibleEmployees.length === 0 ? (
  <p className="no-employees-message">No employees assigned</p>
) : (
 // In your ProjectBox.jsx, replace the visibleEmployees.map section
// (around line 215-235):

visibleEmployees.map((employee, index) => {
  // ✅ Remove BOTH is_highlighted AND isHighlighted from spread
  const { is_highlighted, isHighlighted, ...cleanProps } = employee;
  
  // ✅ Get the CORRECT highlight status from Redux
  const shouldBeHighlighted = !!highlightedEmployees[employee.id];
  
 
  
  return (
      <Employee
          key={employee.id}
          {...cleanProps}
          projectId={id}
          index={index}
          name={`${employee.first_name} ${employee.last_name}`}
          isHighlighted={shouldBeHighlighted}
          onClick={handleEmployeeClick}
          onReorder={handleReorder}
          isEditable={isEditable}
      />
  );
})
)}  
      </div>
      
      <div className="project-box-footer">
        <div className="employee-count">
          Employees: {visibleEmployees.length}
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
