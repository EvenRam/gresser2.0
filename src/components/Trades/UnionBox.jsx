import React from 'react';
import { useDispatch } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';

const UnionBox = ({ id, employees, union_name, color }) => {
  const dispatch = useDispatch();

  const moveEmployee = (employeeId, targetProjectId, targetUnionId) => {
    dispatch({
      type: 'MOVE_EMPLOYEE',
      payload: { employeeId, targetProjectId, targetUnionId }
    });
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: (item) => moveEmployee(item.id, null, id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const activeEmployees = employees.filter(emp => emp.employee_status);

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
      {activeEmployees.length === 0 ? (
        <p>No active employees assigned</p>
      ) : (
        activeEmployees.map(employee => (
          <Employee
            key={employee.id}
            id={employee.id}
            name={`${employee.first_name} ${employee.last_name}`}
            number={employee.phone_number}
            email={employee.email}
            address={employee.address}
          />
        ))
      )}
    </div>
  );
};

export default UnionBox;