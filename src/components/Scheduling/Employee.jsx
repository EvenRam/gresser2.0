import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDrag, useDrop } from 'react-dnd';
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
  projectId,
  onReorder
}) => {
  const dispatch = useDispatch();
  const actualId = id || employee_id;
  const unionColor = unionColors[union_name] || 'black';
  const ref = React.useRef(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE',
    item: () => {
      return {
        id: actualId,
        employee_id: actualId,
        union_id,
        union_name,
        current_location,
        index,
        projectId,
        type: 'EMPLOYEE',
        originalIndex: index
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop && item.projectId === projectId && onReorder) {
        onReorder(item.index, item.originalIndex);
      }
    },
  }), [actualId, union_id, union_name, current_location, index, projectId]);

  const [{ isOver, canDrop, dropPosition }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    canDrop: (item) => {
      return true;
    },
    hover: (item, monitor) => {
      if (!ref.current) return;
      
      if (item.projectId === projectId && onReorder) {
        if (item.index === index) return;

        const dragIndex = item.index;
        const hoverIndex = index;

        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

        onReorder(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      dropPosition: monitor.isOver() ? 
        monitor.getClientOffset()?.y < ref.current?.getBoundingClientRect().top + 
        (ref.current?.getBoundingClientRect().height / 2) ? 'top' : 'bottom' 
        : null
    }),
  }), [index, onReorder, projectId]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (current_location === 'project') {
      const date = new Date().toISOString().split('T')[0];
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

  const dragDropRef = (element) => {
    drag(element);
    drop(element);
    ref.current = element;
  };

  return (
    <div
      ref={dragDropRef}
      onContextMenu={handleContextMenu}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: isHighlighted ? '2px 4px' : '1px',
        margin: isHighlighted ? '0 0 4px 2px' : '-8px 0 0 2px',
        cursor: 'move',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        backgroundColor: isHighlighted 
          ? 'yellow' 
          : (isDragging ? '#f0f0f0' : isOver ? '#e0e0e0' : 'transparent'),
        position: 'relative',
        zIndex: isDragging ? 1000 : 1,
        transition: 'all 0.2s ease',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isDragging ? '0 5px 10px rgba(0,0,0,0.15)' : 'none',
        borderTop: isOver && dropPosition === 'top' ? '2px solid #396a54' : 'none',
        borderBottom: isOver && dropPosition === 'bottom' ? '2px solid #396a54' : 'none'
      }}
    >
      <h6
        className="primary"
        data-toggle="modal"
        data-target={`#${modalId}`}
        style={{ 
          color: unionColor,
          margin: '4px 0',
          pointerEvents: isDragging ? 'none' : 'auto'
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
          style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 1060 
          }}
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