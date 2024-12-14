import React, { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import unionColors from '../Trades/UnionColors';

const Employee = ({
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
  const unionColor = unionColors[union_name] || 'black';
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE',
    item: {  
      employee_id,
      union_id, 
      union_name, 
      current_location, 
      index,
      projectId
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [employee_id, union_id, union_name, current_location, index, projectId]);
  
  const handleDragStart = useCallback((e) => {
    if (typeof index === 'number') {
      e.dataTransfer.setData('text/plain', index.toString());
    }
    e.dataTransfer.effectAllowed = 'move';
  }, [index]);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    return false;
  }, []);
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (typeof onReorder !== 'function') return;
    
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(draggedIndex) && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
  }, [index, onReorder]);
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (isHighlighted && typeof onClick === 'function') {
      onClick(employee_id, isHighlighted);
    }
  }, [employee_id, isHighlighted, onClick]);
  const modalId = `employee-modal-${employee_id}`;
  return (
    <div
      ref={drag}
      draggable
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
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
    </div>
  );
};
export default React.memo(Employee);
