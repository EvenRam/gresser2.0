import React from 'react';
import { useDrop } from 'react-dnd';
import Employee from './Employee';
import '../Trades/Box.css'

const ProjectBox = ({ id, employees, moveEmployee, job_name, unionColorMapping, unionIdToName, logEmployeeData }) => {
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

  const employeeCount = employees.length;

  return (
    <div
      ref={drop}
      style={{
        border: '1px solid gray',
        width: '170px',
        minHeight: '100px',
        margin: '-5px',
        padding: '5px',
        backgroundColor: isOver ? 'white' : 'white',
      }}
    >
      <h4 className='projectboxname'>{job_name}</h4>
      <hr className='namelinebreak'/>
      {employees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        employees.map(employee => {
          const unionName = unionIdToName[employee.union_id] || 'Unknown Union';
          const color = unionColorMapping[unionName] || unionColorMapping.default;
          logEmployeeData(employee);
          return (
            <Employee
              key={employee.id}
              id={employee.id}
              name={`${employee.first_name} ${employee.last_name}`}
              number={employee.phone_number}
              email={employee.email}
              address={employee.address}
              unionId={employee.union_id}
              unionName={unionName}
              color={color}
            />
          );
        })
      )}
      <hr className='breakline'/>
      <h6 className='employee-count'>Employees: {employeeCount}</h6>
    </div>
  );
};

export default ProjectBox;