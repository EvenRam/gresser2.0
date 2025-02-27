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
  rain_day,
  isEditable
}) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  const boxRef = useRef(null);
  const [orderedEmployees, setOrderedEmployees] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null); // Track hover index for debugging
  const [isReordering, setIsReordering] = useState(false); // Flag to prevent multiple reorders

  // Debug helper
  const debugLog = (message, data) => {
    if (data !== undefined) {
      console.log(`[DEBUG-PROJECT-${id}] ${message}`, data);
    } else {
      console.log(`[DEBUG-PROJECT-${id}] ${message}`);
    }
  };

  // Log component mount and updates
  useEffect(() => {
    debugLog(`ProjectBox mounted/updated with ${employees.length} employees`);
  });

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
    
    // Debug log employee ordering
    debugLog("Sorted employees by display_order", sorted);
    
    setOrderedEmployees(sorted);
  }, [employees]);

  // Enhanced drop position calculation
  const calculateDropIndex = useCallback((monitor) => {
    if (!boxRef.current || !monitor.getClientOffset()) {
      debugLog("No boxRef or client offset available");
      return orderedEmployees.length;
    }
  
    const boxRect = boxRef.current.getBoundingClientRect();
    const clientOffset = monitor.getClientOffset();
    
    // Debug measurements
    debugLog("Box measurements", {
      top: boxRect.top,
      height: boxRect.height,
      clientY: clientOffset.y
    });
    
    // Account for the header height
    const headerHeight = 40; 
    const contentY = clientOffset.y - boxRect.top - headerHeight;
    
    debugLog("Content Y position", contentY);
    
    // Get active employees
    const activeEmployees = orderedEmployees.filter(emp => emp.employee_status === true);
    debugLog("Active employee count", activeEmployees.length);
    
    // Empty project handling
    if (activeEmployees.length === 0) {
      debugLog("Empty project - returning index 0");
      return 0;
    }
    
    // If dropping above the first employee
    if (contentY < 5) {
      return 0;
    }
    
    // Calculate position using a consistent employee height
    const EMPLOYEE_HEIGHT = 22; // This should match the actual height in the UI
    
    // Calculate the index based on the Y position
    const calculatedIndex = Math.floor(contentY / EMPLOYEE_HEIGHT);
    
    // Ensure the index is within bounds
    const validIndex = Math.max(0, Math.min(calculatedIndex, activeEmployees.length));
    
    debugLog("Position calculations", {
      contentY,
      employeeHeight: EMPLOYEE_HEIGHT,
      calculatedIndex,
      validIndex,
      maxAllowed: activeEmployees.length
    });
    
    return validIndex;
  }, [orderedEmployees]);

  // Handle employee highlight toggle
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

  // Enhanced reordering function with debounce
  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    if (!isEditable || fromIndex === toIndex || isReordering) return;
    
    // Set reordering flag to prevent multiple simultaneous reorders
    setIsReordering(true);
    
    debugLog("Reordering", {fromIndex, toIndex});
    
    try {
      // Create a new array for the updated ordering
      const newOrder = [...orderedEmployees];
      const [movedEmployee] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedEmployee);
    
      // Update local state immediately for responsive UI
      setOrderedEmployees(newOrder);
      
      // Filter only active employees for the backend update
      const orderedEmployeeIds = newOrder
        .filter(emp => emp.employee_status === true)
        .map(emp => emp.id);
    
      debugLog("New employee order", orderedEmployeeIds);
      
      // Dispatch action to update employee order in backend
      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId: id,
          orderedEmployeeIds,
          date: selectedDate
        }
      });
      
      // Clear any hover state
      setHoverIndex(null);
    } catch (error) {
      console.error('Error updating employee order:', error);
      
      // Refresh from server on error
      dispatch({
        type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
        payload: { date: selectedDate }
      });
    } finally {
      // Reset reordering flag after a short delay
      setTimeout(() => {
        setIsReordering(false);
      }, 300);
    }
  }, [orderedEmployees, id, dispatch, selectedDate, isEditable, isReordering]);

  // Enhanced drop handling
  const handleDrop = useCallback((item, monitor) => {
    if (!item?.id || !isEditable) {
      debugLog("Drop ignored - item invalid or not editable", {
        itemId: item?.id, 
        isEditable
      });
      return;
    }

    const dropIndex = calculateDropIndex(monitor);
    
    debugLog("DROP EVENT", {
      employeeId: item.id,
      employeeName: item.name,
      sourceType: item.sourceLocation?.type,
      sourceId: item.sourceLocation?.id,
      targetProject: id,
      calculatedDropIndex: dropIndex
    });

    // Internal reordering vs. moving from outside
    if (item.sourceLocation?.type === 'project' && item.sourceLocation?.id === id) {
      // Internal reordering
      if (typeof item.index === 'number' && item.index !== dropIndex) {
        debugLog("Internal reordering", {
          fromIndex: item.index, 
          toIndex: dropIndex
        });
        
        handleReorder(item.index, dropIndex);
      }
    } else {
      // Moving from union to project or between projects
      moveEmployee({
        employeeId: item.id,
        targetProjectId: id,
        sourceLocation: item.sourceLocation,
        dropIndex: dropIndex,
        date: selectedDate
      });

      // Highlight the employee when moved to a project
      dispatch({
        type: 'SET_HIGHLIGHTED_EMPLOYEE',
        payload: {
          id: item.id,
          isHighlighted: true,
          date: selectedDate
        }
      });
    }
    
    // Clear hover indicator
    setHoverIndex(null);
    
    // Return true to signal successful drop
    return { moved: true };
  }, [id, moveEmployee, dispatch, selectedDate, isEditable, calculateDropIndex, handleReorder]);

  // Enhanced drop configuration with hover tracking
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    hover: (item, monitor) => {
      if (!isEditable) return;
      
      // Skip hover handling for internal dragging to prevent conflicts
      if (item.sourceLocation?.type === 'project' && 
          item.sourceLocation?.id === id && 
          typeof item.index === 'number') {
        return;
      }
      
      const index = calculateDropIndex(monitor);
      if (hoverIndex !== index) {
        setHoverIndex(index);
        debugLog("Hover position updated", {index});
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
  }), [handleDrop, calculateDropIndex, isEditable, hoverIndex, id]);

  const highlightedEmployees = useSelector(state =>
    state.employeeReducer.highlightedEmployeesByDate[selectedDate] || {}
  );

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
      ref={node => {
        boxRef.current = node;
        drop(node);
      }}
      className={`project-box ${isOver ? 'over' : ''}`}
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
        style={{ 
          backgroundColor: '#396a54', 
          color: 'white', 
          padding: '5px', 
          fontSize: '16px', 
          margin: '-5px -5px 5px -5px',
          position: 'relative',
          zIndex: 1
        }}>
        {job_name}
      </h4>
      
      <div className="employees-container" style={{ 
        flex: 1, 
        marginBottom: '10px',
        position: 'relative',
        minHeight: '40px'
      }}>
        {/* Drop position indicator */}
        {isEditable && isOver && hoverIndex !== null && !isReordering && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#4a90e2',
            top: hoverIndex === 0 ? 0 : `${hoverIndex * 22}px`,
            zIndex: 5,
            boxShadow: '0 0 4px rgba(74, 144, 226, 0.5)',
            pointerEvents: 'none',
            borderRadius: '2px',
            transition: 'top 0.1s ease'
          }}/>
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