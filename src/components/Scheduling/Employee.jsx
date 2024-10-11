import React from 'react';
import { useDrag } from 'react-dnd';


const Employee = ({ id, name, number, email, address, union_id, union_name }) => {
  console.log('Employee DATA:', id,name, number, email, address, union_id, union_name);



  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE',
    item: { id: id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

// Unique ID for each modal
  const modalId = `employee-modal-${id}`; 

 
  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '1px',
        margin: '-8px 0 0 2px',
        // border: '1px solid white',
        cursor: 'move',
        // backgroundColor: 'white',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
 <h6
        className="primary"
        data-toggle="modal"
        data-target={`#${modalId}`}
      >
        {name}
      </h6>

      <div className="modal fade" id={modalId} tabIndex="-1" role="dialog" aria-labelledby={`${modalId}-label`} aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id={`${modalId}-label`}>Employee Name: {name}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <p>Email: {email}</p>
              <p>Number: {number}</p>
              <p>Address: {address}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employee;