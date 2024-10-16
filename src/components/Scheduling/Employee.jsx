import React from 'react'; // Importing React to use its features
import { useDrag } from 'react-dnd'; // Importing the useDrag hook from react-dnd for drag-and-drop functionality

// Employee component definition
const Employee = ({ id, name, number,employee_status, email, address, union_id, union_name }) => {
  // Logging employee data for debugging purposes
  console.log('Employee DATA:', id, name, number, " employee status:" ,employee_status, email, address, union_id, union_name);

  // Using the useDrag hook to make the employee component draggable
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE', // The type of draggable item
    item: { id: id }, // The item being dragged (in this case, just the employee ID)
    collect: (monitor) => ({
      // Collecting the dragging state
      isDragging: !!monitor.isDragging(), // Boolean value to check if the item is currently being dragged
    }),
  }));

  // Unique ID for each modal based on the employee ID
  const modalId = `employee-modal-${id}`;

  return (
    <div
      ref={drag} // Attaching the drag ref to this div to enable dragging
      style={{
        opacity: isDragging ? 0.5 : 1, // Change opacity when dragging
        padding: '1px', // Padding for the employee item
        margin: '-8px 0 0 2px', // Margin for positioning
        cursor: 'move', // Change cursor to indicate draggable item
        borderRadius: '4px', // Rounded corners for the item
        whiteSpace: 'nowrap', // Prevent text wrapping
        overflow: 'hidden', // Hide overflowing text
        textOverflow: 'ellipsis', // Add ellipsis for overflowing text
      }}
    >
      {/* Displaying employee name and triggering modal on click */}
      <h6
        className="primary" // Bootstrap class for styling
        data-toggle="modal" // Bootstrap attribute to toggle modal
        data-target={`#${modalId}`} // Target modal by ID
      >
        {name} {/* Employee name displayed here */}
      </h6>

      {/* Modal component that appears when the employee name is clicked */}
      <div className="modal fade" id={modalId} tabIndex="-1" role="dialog" aria-labelledby={`${modalId}-label`} aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              {/* Modal title showing the employee name */}
              <h5 className="modal-title" id={`${modalId}-label`}>Employee Name: {name}</h5>
              {/* Close button for the modal */}
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              {/* Displaying employee details in the modal */}
              <p>Email: {email}</p>
              <p>Number: {number}</p>
              <p>Address: {address}</p>
            </div>
            <div className="modal-footer">
              {/* Close button for the modal */}
              <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exporting the Employee component to be used in other parts of the application
export default Employee;
