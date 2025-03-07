import React, { useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
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
  const ref = useRef(null);
  
  // Configure drag source
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
      isDragging: monitor.isDragging(),
    }),
  }), [actualId, union_id, union_name, current_location, index, projectId]);
  
  // Configure drop target for reordering
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    canDrop: (item) => {
      // Only allow drops from same project (for reordering)
      return item.projectId === projectId && item.id !== actualId;
    },
    hover: (item, monitor) => {
      if (!ref.current || !projectId) return;
      if (item.projectId !== projectId) return;
      if (typeof onReorder !== 'function') return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      onReorder(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    }),
  }), [index, projectId, actualId, onReorder]);
  
  // Handle right-click to toggle highlighting
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (typeof onClick === 'function') {
      onClick(actualId, isHighlighted);
    }
  }, [actualId, isHighlighted, onClick]);
  
  // Combine refs if in a project box (for both drag and drop)
  const attachRef = (el) => {
    if (projectId) {
      drag(drop(el));
    } else {
      drag(el);
    }
    ref.current = el;
  };
  
  // Create employee modal
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

  // Use smaller visual height but maintain original drag target size
  return (
    <>
      <div
        ref={attachRef}
        onContextMenu={handleContextMenu}
        style={{
          opacity: isDragging ? 0.5 : 1,
          padding: '0px',
          margin: '0',
          cursor: 'move',
          borderRadius: '2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          backgroundColor: isHighlighted ? 'yellow' : (isOver ? '#f0f0f0' : 'transparent'),
          // Keep original element height for drag calculation
          height: '14px',
          // This ensures the drop area extends beyond the visible content
          // for better drag and drop positioning
          position: 'relative'
        }}
        data-employee-id={actualId}
      >
        <h6
          className="primary"
          data-toggle="modal"
          data-target={`#${modalId}`}
          style={{ 
            color: unionColor, 
            margin: 0, 
            padding: 0, 
            fontSize: '12px',
            lineHeight: '14px',
            fontWeight: 'normal'
          }}
        >
          {name}
        </h6>
      </div>
      
      {ReactDOM.createPortal(
        modalContent,
        document.body
      )}
    </>
  );
};

export default React.memo(Employee);