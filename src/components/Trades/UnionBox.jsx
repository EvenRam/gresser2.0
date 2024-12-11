import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';
const UnionBox = ({ id, union_name, color }) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate); 
  const allEmployees = useSelector((state) =>
    state.employeeReducer.employeesByDate?.[selectedDate] || []
  );
  if (!allEmployees) {
    console.warn('No employees data found for the selected date:', selectedDate);
  }
  const employees = allEmployees.filter(
    (emp) => emp.current_location === 'union' && emp.union_id === id
  );
  console.log(`UnionBox Render - ${union_name} (id: ${id})`);
  console.log('Filtered Employees:', employees);
  const moveEmployee = (employeeId, targetProjectId, sourceUnionId, targetUnionId, date) => {
    console.log('moveEmployee called with:', { employeeId, targetProjectId, sourceUnionId, targetUnionId, date });
    return {
      type: 'MOVE_EMPLOYEE',
      payload: { employeeId, targetProjectId, sourceUnionId, targetUnionId, date }
    };
  };
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      
      if (item.union_id !== id || item.current_location !== 'union') {
        console.log(`Moving employee ${item.id} to union ${id} for date ${selectedDate}`);
        dispatch(moveEmployee(item.id, null, item.union_id, id, selectedDate));
      } else {
        console.log(`Employee ${item.id} is already in this union. No action taken.`);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [id, union_name, dispatch, allEmployees]);
  return (
    <div 
      ref={drop}
      style={{
        border: '1px solid gray',
        width: '190px',
        minHeight: '150px',
        margin: '1px',
        padding: '1px',
        backgroundColor: isOver ? '#f0f0f0' : '#fff',
      }}
    >
      <h4 className='small-text' style={{ color }}>{union_name}</h4>
      <div className="separator"></div>
      <div className='union_box'> 
      {employees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        employees
          .filter(employee => employee.employee_status === true)
          .map((employee, index) => (
            <Employee
              key={employee.id}
              {...employee}
              className="employee-name"
              name={`${employee.first_name} ${employee.last_name}`}
              union_id={id}
              union_name={union_name}
              current_location="union"
              index={index}
            />
          ))
      )}
      </div>
    </div>
  );
};
export default React.memo(UnionBox);


