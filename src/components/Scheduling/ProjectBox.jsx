import React from 'react';
import { useDrop } from 'react-dnd';
import Employee from './Employee';
import '../Trades/Box.css'

const ProjectBox = ({ id, employees = [], moveEmployee, job_name }) => {
  console.log('Id in job box:', id)
  console.log("Employees in JobBox component:", employees)
  console.log("job_name", job_name)

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: (item) => {
      console.log('Dropped item:', item);
      moveEmployee(item.id, id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
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
      style={{ backgroundColor: '#396a54', color: 'white', padding: '5px' ,fontSize: '16px'   }}>{job_name}</h4>
      {employees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        employees
        .filter(employee => employee.employee_status === true) 
        .map(employee => (
          <Employee
            key={employee.id}
            id={employee.id}
            name={`${employee.first_name} ${employee.last_name}`}
            number={employee.phone_number}
            email={employee.email}
            address={employee.address}   
            employee_status={employee.employee_status}
          Location={employee.current_location}
            union_id={employee.union_id}       
            union_name={employee.union_name}
             />
        ))
      )}
      <h6 className='employee-count'>Employees: {employees.length}</h6>
    </div>
  );
};

export default ProjectBox;