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

  const calculateDropIndex = useCallback((monitor) => {
    if (!boxRef.current || !monitor.getClientOffset()) {
      return orderedEmployees.length;
    }

    const hoverBoundingRect = boxRef.current.getBoundingClientRect();
    const clientOffset = monitor.getClientOffset();
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Get only active employees for position calculation
    const activeEmployees = orderedEmployees.filter(emp => emp.employee_status === true);
    
    if (activeEmployees.length === 0) {
      return 0;
    }

    // Handle top drop zone
    if (hoverClientY < 20) {
      return 0;
    }

    const contentHeight = hoverBoundingRect.height - 20; // Subtract header space
    const itemHeight = contentHeight / (activeEmployees.length + 1);
    const index = Math.floor((hoverClientY - 20) / itemHeight);

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

  const handleReorder = useCallback(async (fromIndex, toIndex) => {
    if (!isEditable) return;
    
    const newOrder = [...orderedEmployees];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    try {
      const orderedEmployeeIds = newOrder
        .filter(emp => emp.employee_status === true)
        .map(emp => emp.id);

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

  const handleDrop = useCallback((item, monitor) => {
    if (!item?.id || !isEditable) return;

    const dropIndex = calculateDropIndex(monitor);

    // Handle external moves (from union or other projects)
    if (item.sourceLocation.type === 'union' || 
        (item.sourceLocation.type === 'project' && item.sourceLocation.id !== id)) {
        
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
  }, [id, moveEmployee, dispatch, selectedDate, isEditable, calculateDropIndex]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
  }), [handleDrop]);

  const dropRef = useCallback((node) => {
    boxRef.current = node;
    drop(node);
  }, [drop]);

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
      
      <div style={{ 
        flex: 1, 
        marginBottom: '10px',
        position: 'relative',
        minHeight: '40px'
      }}>
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