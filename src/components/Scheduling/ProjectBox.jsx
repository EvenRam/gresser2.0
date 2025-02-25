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

  // Debug helper
  const debugLog = (message, data) => {
    console.log(`[DEBUG-PROJECT-${id}] ${message}`, data);
  };

  // Log component mount and updates
  useEffect(() => {
    debugLog(`ProjectBox mounted/updated with ${employees.length} employees`);
  });

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
    debugLog("Sorted employees by display_order", 
      sorted.map(e => ({id: e.id, name: e.first_name + ' ' + e.last_name, order: e.display_order}))
    );
    
    setOrderedEmployees(sorted);
  }, [employees]);

  // Improved and debugged drop position calculation
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
    
    // Calculate position with header offset
    const headerHeight = 30;
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
    
    // Calculate index using employee height
    const EMPLOYEE_HEIGHT = 22;
    const calculatedIndex = Math.floor(contentY / EMPLOYEE_HEIGHT);
    const validIndex = Math.max(0, Math.min(calculatedIndex, activeEmployees.length));
    
    debugLog("Position calculations", {
      contentY,
      employeeHeight: EMPLOYEE_HEIGHT,
      calculatedIndex,
      validIndex,
      maxAllowed: activeEmployees.length
    });
    
    return validIndex;
  }, [orderedEmployees, id]);

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

  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    if (!isEditable) return;
    
    debugLog("Reordering", {fromIndex, toIndex});
    
    const newOrder = [...orderedEmployees];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    try {
      const orderedEmployeeIds = newOrder
        .filter(emp => emp.employee_status === true)
        .map(emp => emp.id);

      debugLog("New employee order", orderedEmployeeIds);
      
      dispatch({
        type: 'UPDATE_EMPLOYEE_ORDER',
        payload: {
          projectId: id,
          orderedEmployeeIds,
          date: selectedDate
        }
      });

      setOrderedEmployees(newOrder);
    } catch (error) {
      console.error('Error updating employee order:', error);
      setOrderedEmployees(orderedEmployees);
    }
  }, [orderedEmployees, id, dispatch, selectedDate, isEditable]);

  // Enhanced drop handling with debug
  const handleDrop = useCallback((item, monitor) => {
    if (!item?.id || !isEditable) {
      debugLog("Drop ignored - item invalid or not editable", {itemId: item?.id, isEditable});
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

    if (item.sourceLocation?.type === 'union' || 
        (item.sourceLocation?.type === 'project' && item.sourceLocation?.id !== id)) {
      
      moveEmployee({
        employeeId: item.id,
        targetProjectId: id,
        sourceLocation: item.sourceLocation,
        dropIndex,
        date: selectedDate
      });

      dispatch({
        type: 'SET_HIGHLIGHTED_EMPLOYEE',
        payload: {
          id: item.id,
          isHighlighted: true,
          date: selectedDate
        }
      });
    }
    
    setHoverIndex(null);
  }, [id, moveEmployee, dispatch, selectedDate, isEditable, calculateDropIndex]);

  // Enhanced drop configuration with hover tracking
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    hover: (item, monitor) => {
      if (!isEditable) return;
      const index = calculateDropIndex(monitor);
      if (hoverIndex !== index) {
        setHoverIndex(index);
        debugLog("Hover position updated", {index});
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
  }), [handleDrop, calculateDropIndex, isEditable, hoverIndex]);

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
        {/* Debug marker */}
        {isEditable && isOver && hoverIndex !== null && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: 'red',
            top: `${hoverIndex * 22}px`,
            zIndex: 5
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