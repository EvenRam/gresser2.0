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
  isHighlighted,
  index,
  projectId
}) => {
  const dispatch = useDispatch();
  const actualId = id || employee_id;
  const unionColor = unionColors[union_name] || 'black';
 
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

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (current_location === 'project') {
        const date = new Date().toISOString().split('T')[0];
        console.log('Attempting to toggle highlight state for:', actualId);
        dispatch({
            type: 'SET_HIGHLIGHTED_EMPLOYEE',
            payload: {
                id: actualId,
                isHighlighted: !isHighlighted,
                projectId,
                date
            }
        });
    }
  }, [actualId, isHighlighted, current_location, dispatch, projectId]);

  const modalId = `employee-modal-${actualId}`;
  const modalContainer = document.getElementById('global-modal-container');

  return (
    <div
      ref={drag}
      onContextMenu={handleContextMenu}
// In the main div's style object in Employee.jsx, update or add:
style={{
  opacity: isDragging ? 0.5 : 1,
  padding: isHighlighted ? '2px 4px' : '1px', 
  margin: isHighlighted ? '0 0 4px 2px' : '-8px 0 0 2px', 
  cursor: 'move',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  backgroundColor: isHighlighted ? 'yellow' : (isDragging ? '#f0f0f0' : 'transparent'),
  position: 'relative',
  zIndex: 1,
}}
    >
      <h6
        className="primary"
        data-toggle="modal"
        data-target={`#${modalId}`}
        style={{ color: unionColor }}
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