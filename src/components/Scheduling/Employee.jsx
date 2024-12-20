import React, { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import unionColors from '../Trades/UnionColors';

const Employee = ({
  id,
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
  projectId // Add projectId to props
}) => {
  const unionColor = unionColors[union_name] || 'black';

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE',
    item: { 
      id, 
      union_id, 
      union_name, 
      current_location, 
      index,
      projectId // Include projectId in the drag item
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [id, union_id, union_name, current_location, index, projectId]);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    return false;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
  };

  const handleDragEnd = () => {
    // Clean up if needed
  };

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (isHighlighted) {
      onClick(id, isHighlighted);
    }
  }, [id, isHighlighted, onClick]);

  const modalId = `employee-modal-${id}`;

  return (
    <div
      ref={drag}
      draggable
      onContextMenu={handleContextMenu}
      onDragStart={(e) => {
        handleDragStart(e);
        e.dataTransfer.setData('text/plain', index.toString());
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
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