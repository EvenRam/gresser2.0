import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ProjectBox from './ProjectBox';
import './EmployeeStyles.css';

const DraggableJobBox = ({ 
  job, 
  index, 
  moveJob, 
  moveEmployee, 
  isEditable 
}) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'JOB',
    item: () => ({
      job_id: job.job_id,
      index,
      type: 'JOB',
      originalIndex: index
    }),
    canDrag: () => isEditable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop && isEditable) {
        moveJob(item.index, item.originalIndex);
      }
    }
  });

  const [{ isOver, handlerId }, drop] = useDrop({
    accept: 'JOB',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      handlerId: monitor.getHandlerId()
    }),
    hover: (item, monitor) => {
      if (!ref.current || !isEditable) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveJob(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`draggable-job-box ${isOver ? 'job-over' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isEditable ? 'move' : 'default',
        position: 'relative',
        marginBottom: '10px',
        backgroundColor: isOver ? '#f0f0f0' : 'transparent',
        transition: 'all 0.2s ease',
        border: isOver ? '2px dashed #666' : '2px solid transparent',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)'
      }}
      data-handler-id={handlerId}
    >
      <ProjectBox
        id={job.job_id}
        job_name={job.job_name}
        employees={job.employees || []}
        moveEmployee={moveEmployee}
        display_order={job.display_order}
        rain_day={job.rain_day}
        isEditable={isEditable}
      />
    </div>
  );
};

export default React.memo(DraggableJobBox);