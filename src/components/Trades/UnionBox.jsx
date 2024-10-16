import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';

const UnionBox = ({ id, union_name, color }) => {
  const dispatch = useDispatch();
  const allEmployees = useSelector((state) => state.employeeReducer.employees);

  const employees = allEmployees.filter(emp => emp.current_location === 'union' && emp.union_id === id);

  const moveEmployee = (employeeId, targetProjectId, sourceUnionId, targetUnionId) => ({
    type: 'MOVE_EMPLOYEE',
    payload: { employeeId, targetProjectId, sourceUnionId, targetUnionId }
  });

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      
      // If the employee is from a different union or a project, move them
      if (item.union_id !== id || item.current_location === 'project') {
        dispatch(moveEmployee(item.id, null, item.union_id, id));
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

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
      {employees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        employees.map(employee => (
          <Employee
            key={employee.id}
            id={employee.id}
            name={`${employee.first_name} ${employee.last_name}`}
            number={employee.phone_number}
            email={employee.email}
            address={employee.address}
            union_id={id}
            union_name={union_name}
          />
        ))
      )}
    </div>
  );
};

export default React.memo(UnionBox);