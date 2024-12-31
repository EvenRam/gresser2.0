import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ProjectBox from './ProjectBox';
import './EmployeeStyles.css';

const DraggableJobBox = ({ job, index, moveJob, moveEmployee, isEditable }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB',
    item: { 
      job_id: job.job_id,
      index,
      type: 'JOB'
    },
    canDrag: () => isEditable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'JOB',
    canDrop: () => isEditable,
    hover: (draggedItem) => {
      if (!draggedItem || draggedItem.type !== 'JOB') {
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
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const ref = (node) => {
    drag(drop(node));
  };

  const opacity = isDragging ? 0.5 : 1;
  const cursor = isEditable ? 'move' : 'default';

  return (
    <div
      ref={ref}
      className={`draggable-job-box ${isOver ? 'job-over' : ''}`}
      style={{
        opacity,
        cursor,
        position: 'relative',
        marginBottom: '10px',
        backgroundColor: isOver ? '#f0f0f0' : 'transparent',
      }}
    >
      <ProjectBox
        id={job.job_id}
        job_name={job.job_name}
        employees={job.employees || []}
        moveEmployee={moveEmployee}
        display_order={job.display_order}
      />
    </div>
  );
};

export default React.memo(DraggableJobBox);