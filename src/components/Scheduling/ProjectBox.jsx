import React, { useCallback, useState, useEffect } from 'react';
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
 
  return (
    <>
      <div
        ref={drop}
        className="project-box-container" 
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
          style={{ backgroundColor: '#396a54', color: 'white', padding: '5px', fontSize: '16px', margin: '-5px -5px 5px -5px' }}>
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
      <div id="project-box-modals-container" style={{ position: 'relative', zIndex: 1050 }}></div>
    </>
  );
};

export default React.memo(ProjectBox);