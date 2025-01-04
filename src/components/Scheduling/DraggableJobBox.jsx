import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ProjectBox from './ProjectBox';
import './EmployeeStyles.css';

const DraggableJobBox = ({ job, index, moveJob, moveEmployee, isEditable }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB',
    item: () => {
      console.log('Drag Started:', { id: job.job_id, index });
      return {
        job_id: job.job_id,
        index,
        type: 'JOB',
        originalIndex: index
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        console.log('Drag cancelled - returning to original position');
        moveJob(item.index, item.originalIndex);
      }
    }
  });

  const [{ handlerId, isOver }, drop] = useDrop({
    accept: 'JOB',
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
      isOver: monitor.isOver()
    }),
    hover: (item, monitor) => {
      if (!ref.current || !isEditable) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Get rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Get pixels to top
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      console.log('Hover state:', {
        dragIndex,
        hoverIndex,
        hoverClientY,
        hoverMiddleY
      });

      // Only perform the move when the mouse has crossed half of the item's height
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveJob(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
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
      />
    </div>
  );
};

export default React.memo(DraggableJobBox);