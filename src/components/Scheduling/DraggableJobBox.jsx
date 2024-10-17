
import React from 'react'; 
import { useDrag, useDrop } from 'react-dnd'; 
import ProjectBox from './ProjectBox'; 
import './EmployeeStyles.css'; 

// DraggableJobBox component for rendering individual job boxes
const DraggableJobBox = ({ job, index, moveJob, moveEmployee }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB', 
    item: { id: job.id, index }, 
    collect: (monitor) => ({
      isDragging: monitor.isDragging(), 
    }),
  });

  const [, drop] = useDrop({
    accept: 'JOB', 
    hover: (draggedItem, monitor) => {
      if (draggedItem.index !== index) { 
        moveJob(draggedItem.index, index); 
        draggedItem.index = index; 
      }
    },
  });

  return (
    <div ref={(node) => drag(drop(node))} className="draggable-job-box" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <ProjectBox
        id={job.id}
        job_name={job.job_name}
        employees={job.employees || []} 
        moveEmployee={moveEmployee} 
      />
    </div>
  );
};

export default DraggableJobBox; 
