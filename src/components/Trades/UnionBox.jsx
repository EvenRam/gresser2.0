import React from 'react';
import { useDispatch } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';

const UnionBox = ({ id, employees, union_name, color }) => {
  // console.log('NAME in union box:', union_name);
  // console.log('id in union box', id);
  // console.log("employees", employees);
  // console.log("what is the color", color);

  const dispatch = useDispatch();

  const moveEmployee = (employeeId, targetProjectId, targetUnionId) => ({
    type: 'MOVE_EMPLOYEE',
    payload: { employeeId, targetProjectId, targetUnionId }
  });

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: (item) => {
        
        // Dispatch the action when an employee is dropped
      dispatch(moveEmployee(item.id, null, id)); // Move to union
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
        employees
                  .filter(employee => employee.employee_status === true) // Filter out inactive employees
.map(employee => (
          <Employee
            key={employee.id}
            id={employee.id}
            name={`${employee.first_name} ${employee.last_name}`}
            number={`${employee.phone_number}`}
            email={`${employee.email}`}
            address={`${employee.address}`}
            employee_status={`${employee.employee_status}`}
            union_id={`${employee.union_id}`} 
          union_name={`${employee.union_name}`} 
          />
        ))
      )}
    </div>
  );
};

export default UnionBox;


