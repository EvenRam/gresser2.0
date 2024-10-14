// DraggableJobBox.js
import React from 'react'; // Import React
import { useDrag, useDrop } from 'react-dnd'; // Import drag-and-drop hooks
import ProjectBox from './ProjectBox'; // Import the ProjectBox component
import './EmployeeStyles.css'; // Import necessary styles

// DraggableJobBox component for rendering individual job boxes
const DraggableJobBox = ({ job, index, moveJob, moveEmployee }) => {
  // Set up drag-and-drop functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB', // Define the type of draggable item
    item: { id: job.id, index }, // The item to be dragged includes its id and index
    collect: (monitor) => ({
      isDragging: monitor.isDragging(), // Collect whether the item is currently being dragged
    }),
  });

  // Set up drop functionality
  const [, drop] = useDrop({
    accept: 'JOB', // Define what types of items this drop zone accepts
    hover: (draggedItem, monitor) => {
      // When an item is hovered over this drop zone
      if (draggedItem.index !== index) { // Check if the dragged item is not already in the correct position
        moveJob(draggedItem.index, index); // Move the job to the new position
        draggedItem.index = index; // Update the index of the dragged item
      }
    },
  });

  // Render the draggable job box with the drop functionality
  return (
    <div ref={(node) => drag(drop(node))} className="draggable-job-box" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <ProjectBox
        id={job.id}
        job_name={job.job_name}
        employees={job.employees || []} // Use empty array if employees is undefined
        moveEmployee={moveEmployee} // Pass down moveEmployee function for employee dragging
      />
    </div>
  );
};

export default DraggableJobBox; // Export the DraggableJobBox component
