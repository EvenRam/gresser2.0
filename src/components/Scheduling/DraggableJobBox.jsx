
import React from 'react'; 
import { useDrag, useDrop } from 'react-dnd'; 
import ProjectBox from './ProjectBox'; 
import './EmployeeStyles.css'; 

const DraggableJobBox = ({ job, index, moveJob, moveEmployee }) => {
  console.log('DraggableJobBox rendering:', {
    job_id: job.job_id,
    job_name: job.job_name,
    employeesCount: job.employees?.length || 0,
    employees: job.employees
  });
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB', 
    item: () => ({ 
      id: job.job_id,  
      index, 
      type: 'JOB' 
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(), 
    }),
  });
  const [{ isOver }, drop] = useDrop({
    accept: 'JOB', 
    hover: (draggedItem, monitor) => {
      if (!monitor.canDrop() || !monitor.isOver({ shallow: true })) {
        return;
      }
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveJob(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true })
    }),
  });
  const ref = (node) => {
    drag(drop(node));
  };
  return (
    <div 
      ref={ref} 
      className={`draggable-job-box ${isOver ? 'job-over' : ''}`}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        position: 'relative',
      }}
    >
      <ProjectBox
        id={job.job_id}
        job_name={job.job_name}
        employees={job.employees || []} // Ensure we always pass an array
        moveEmployee={moveEmployee}
      />
    </div>
  );
};
export default React.memo(DraggableJobBox);
