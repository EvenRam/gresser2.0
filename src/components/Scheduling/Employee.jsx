import React, { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import ReactDOM from 'react-dom';
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
  onClick,
  index,
  onReorder,
  projectId
}) => {
  const actualId = employee_id || id;
  const unionColor = unionColors[union_name] || 'black';
  const modalId = `employee-modal-${actualId}`;
  
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
    if (isHighlighted && typeof onClick === 'function') {
      onClick(actualId, isHighlighted);
    }
  }, [actualId, isHighlighted, onClick]);

  // Render the modal markup
  const modalContent = (
    <div 
      className="modal fade" 
      id={modalId} 
      tabIndex="-1" 
      role="dialog" 
      aria-labelledby={`${modalId}-label`} 
      aria-hidden="true"
      style={{ zIndex: 1050 }}
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}-label`}>Employee Name: {name}</h5>
            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
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
            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={drag}
        onContextMenu={handleContextMenu}
        style={{
          opacity: isDragging ? 0.5 : 1,
          padding: '1px',
          margin: '-8px 0 0 2px',
          cursor: 'move',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          backgroundColor: isHighlighted ? 'yellow' : (isDragging ? '#f0f0f0' : 'transparent'),
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
      </div>
      {/* Render modal at document body level */}
      {ReactDOM.createPortal(
        modalContent,
        document.body
      )}
    </>
  );
};

export default React.memo(Employee);