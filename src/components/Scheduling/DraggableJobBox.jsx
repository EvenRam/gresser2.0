import React from 'react'; 
import { useDrag, useDrop } from 'react-dnd'; 
import ProjectBox from './ProjectBox'; 
import './EmployeeStyles.css'; 

const DraggableJobBox = ({ 
  job, 
  index, 
  moveJob, 
  moveEmployee 
}) => {
  // Set up dragging for the entire job box
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB',
    item: { 
      type: 'JOB',
      id: job.id, 
      index,
      originalIndex: index 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      // If the drop wasn't successful, move back to original position
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        moveJob(item.index, item.originalIndex);
      }
    }
  });

  // Set up dropping for job reordering
  const [{ isOver }, drop] = useDrop({
    accept: 'JOB',
    canDrop: () => true,
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Move the job box
      moveJob(dragIndex, hoverIndex);
      
      // Update the dragged item's index
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });

  // Combine drag and drop refs
  const dragDropRef = (el) => {
    drag(el);
    drop(el);
  };

  return (
    <div 
      ref={dragDropRef} 
      className={`draggable-job-box ${isDragging ? 'dragging' : ''} ${isOver ? 'job-over' : ''}`}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.2s, opacity 0.2s, box-shadow 0.2s',
        boxShadow: isOver 
          ? '0 0 10px rgba(57, 106, 84, 0.5)' 
          : isDragging 
            ? '0 5px 10px rgba(0,0,0,0.15)' 
            : 'none'
      }}
    >
      <ProjectBox
        id={job.id}
        job_name={job.job_name}
        employees={job.employees || []}
        moveEmployee={moveEmployee}
        rain_day={job.rain_day}
      />
    </div>
  );
};

export default React.memo(DraggableJobBox);