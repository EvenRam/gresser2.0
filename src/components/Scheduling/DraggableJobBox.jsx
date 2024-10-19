import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Employee from './Employee';

const DraggableJobBox = ({ job, index, moveEmployee, moveProject, employees }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'PROJECT',
    item: { type: 'PROJECT', index, id: job.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ['EMPLOYEE', 'PROJECT'],
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (item.type === 'PROJECT') {
        if (dragIndex === hoverIndex) {
          return;
        }
        moveProject(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }
    },
    drop(item, monitor) {
      if (item.type === 'EMPLOYEE') {
        console.log('Employee dropped:', item);
        moveEmployee(item.id, job.id, item.union_id, item.jobId);
      }
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: '1px solid #ccc',
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#f9f9f9',
      }}
      className="job-box"
    >
      <h4>{job.job_name}</h4>
      <p>Job ID: {job.id}</p>
      <p>Employees: {employees.length}</p>
      {employees.map((employee) => (
        <Employee
          key={employee.id}
          id={employee.id}
          name={`${employee.first_name} ${employee.last_name}`}
          phone_number={employee.phone_number}
          email={employee.email}
          address={employee.address}
          union_id={employee.union_id}
          union_name={employee.union_name}
          job_id={job.id}
        />
      ))}
    </div>
  );
};

export default React.memo(DraggableJobBox);