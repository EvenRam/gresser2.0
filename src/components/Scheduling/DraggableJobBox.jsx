import React from 'react'; 
import { useDrag, useDrop } from 'react-dnd'; 
import ProjectBox from './ProjectBox'; 
import './EmployeeStyles.css'; 

const DraggableJobBox = ({ job, index, moveJob, moveEmployee }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB', 
    item: () => ({ id: job.id, index, type: 'JOB' }), // Add type to help identify dragged item
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

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Time to actually perform the action
      moveJob(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      draggedItem.index = hoverIndex;
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true })
    }),
  });

  // Combine drag and drop refs using a callback ref
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
        id={job.id}
        job_name={job.job_name}
        employees={job.employees || []} 
        moveEmployee={moveEmployee}
        display_order={job.display_order} 
      />
    </div>
  );
};

export default React.memo(DraggableJobBox);