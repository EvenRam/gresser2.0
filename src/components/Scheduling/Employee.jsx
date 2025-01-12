import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDrag } from 'react-dnd';
import { useDispatch } from 'react-redux';
import unionColors from '../Trades/UnionColors';

const Employee = ({
  id,
  employee_id,
  name,
  phone_number,
  email,
  address,
  union_id,
  union_name,
  current_location,
  isHighlighted = false,  // Default to false if undefined
  index,
  projectId
}) => {
  const dispatch = useDispatch();
  const actualId = id || employee_id;
  const unionColor = unionColors[union_name] || 'black';

  console.log('Employee render:', { 
    name, 
    isHighlighted, 
    actualId, 
    projectId,
    current_location 
  }); 
 
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE',
    item: {  
      id: actualId,
      employee_id: actualId,
      union_id, 
      union_name, 
      current_location, 
      index,
      projectId
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [actualId, union_id, union_name, current_location, index, projectId]);
 
  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Right click event triggered for:', name);
    console.log('Current highlight state:', isHighlighted);
    console.log('Current location:', current_location);
    
    // If in a project, allow un-highlighting
    if (current_location === 'project') {
        const date = new Date().toISOString().split('T')[0];
        console.log('Dispatching unhighlight action for:', name);
        
        dispatch({
            type: 'UPDATE_HIGHLIGHT_STATE',
            payload: {
                id: actualId,
                isHighlighted: false,
                date,
                projectId,
                current_location
            }
        });
    }
  }, [actualId, name, isHighlighted, projectId, current_location, dispatch]);

  const modalId = `employee-modal-${actualId}`;
  const modalContainer = document.getElementById('global-modal-container');

  return (
    <div
      ref={drag}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        // For Mac users, check if control key is pressed during click
        if (e.ctrlKey) {
            handleContextMenu(e);
        }
      }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '1px',
        margin: '-8px 0 0 2px',
        cursor: 'move',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        backgroundColor: isHighlighted ? '#ffeb3b' : (isDragging ? '#f0f0f0' : 'transparent'),
        userSelect: 'none',
        position: 'relative',  // Make sure the element can receive clicks/context menu events
        zIndex: 1,  // Ensure it's above other elements
      }}
    >
      <h6
        className="primary"
        data-toggle="modal"
        data-target={`#${modalId}`}
        style={{ 
          color: unionColor,
          pointerEvents: 'none' // Prevent text from interfering with drag
        }}
      >
        {name}
      </h6>

      {modalContainer && createPortal(
        <div 
          className="modal fade" 
          id={modalId} 
          tabIndex="-1" 
          role="dialog" 
          aria-labelledby={`${modalId}-label`} 
          aria-hidden="true"
          style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1060 }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id={`${modalId}-label`}>
                  Employee Name: {name}
                </h5>
                <button 
                  type="button" 
                  className="close" 
                  data-dismiss="modal" 
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Email: {email || 'N/A'}</p>
                <p>Number: {phone_number || 'N/A'}</p>
                <p>Address: {address || 'N/A'}</p>
                <p>Union: {union_name || 'N/A'}</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  data-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        modalContainer
      )}
    </div>
  );
};

export default Employee;