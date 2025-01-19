import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';

const UnionBox = ({ id, union_name, color, employees = [] }) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  const isEditable = useSelector((state) => state.scheduleReducer.isEditable);

  // Safely get employees from state, with a fallback
  const employeesByDate = useSelector((state) => 
    state.employeeReducer?.employeesByDate || {});
  const dateEmployees = employeesByDate[selectedDate] || [];

  // Filter employees for this union and in union location
  const unionEmployees = dateEmployees.filter(emp => 
    emp && emp.current_location === 'union' && emp.union_id === id
  ) || [];

  // Handle employee drops back to union
  const handleDrop = (item) => {
    if (!isEditable) return;

    if (item.current_location === 'project') {
      dispatch({ 
        type: 'MOVE_EMPLOYEE', 
        payload: { 
          employeeId: item.id,
          targetProjectId: null,
          sourceUnionId: item.union_id,
          date: selectedDate
        }
      });
    }
  };

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    canDrop: (item) => {
      return item.union_id === id && item.current_location === 'project';
    },
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    }),
  }), [id, selectedDate, isEditable]);

  return (
    <div
      ref={drop}
      style={{
        border: '1px solid gray',
        width: '190px',
        minHeight: '150px',
        margin: '1px',
        padding: '1px',
        backgroundColor: isOver && canDrop ? '#f0f0f0' : '#fff',
        transition: 'background-color 0.2s ease',
        boxShadow: isOver && canDrop ? '0 0 5px rgba(57, 106, 84, 0.5)' : 'none'
      }}
    >
      <h4 className='small-text' style={{ color }}>
        {union_name}
      </h4>
      <div className="separator"></div>
      {unionEmployees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        unionEmployees
          .filter(employee => employee && employee.employee_status === true)
          .map((employee, index) => (
            <Employee
              key={employee.id}
              {...employee}
              index={index}
              name={`${employee.first_name} ${employee.last_name}`}
              union_id={id}
              union_name={union_name}
              current_location="union"
            />
          ))
      )}
    </div>
  );
};

export default React.memo(UnionBox);