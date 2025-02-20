import React, { useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
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
  const dispatch = useDispatch();
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
  const ref = useRef(null);
  const actualId = employee_id || id;
  const unionColor = unionColors[union_name] || 'black';
  const modalId = `employee-modal-${actualId}`;

  // Enhanced drag configuration with unified move handling
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE',
    item: () => ({
      id: actualId,
      employee_id: actualId,
      union_id,
      union_name,
      current_location,
      projectId, // Current project ID (if in a project)
      index,
      type: 'EMPLOYEE',
      sourceLocation: {
        type: current_location,
        id: current_location === 'project' ? projectId : union_id
      }
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [actualId, union_id, union_name, current_location, index, projectId]);

  // Drop configuration for reordering within same project
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    canDrop: (item) => {
      // Only allow drops within projects for reordering
      if (!projectId) return false;
      return item.projectId === projectId;
    },
    hover: (item, monitor) => {
      if (!ref.current || !projectId || item.projectId !== projectId) return;
      if (typeof onReorder !== 'function') return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
  }), [index, onReorder, projectId]);

  // Handle right-click for highlighting
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (current_location === 'project') {
      dispatch({
        type: 'SET_HIGHLIGHTED_EMPLOYEE',
        payload: {
          id: actualId,
          isHighlighted: !isHighlighted,
          date: selectedDate
        }
      });
    }
  }, [actualId, isHighlighted, current_location, dispatch, selectedDate]);

  // Combine drag and drop refs
  const dragDropRef = (el) => {
    drag(el);
    drop(el);
    ref.current = el;
  };

  return (
    <>
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
          backgroundColor: projectId ? (
            isHighlighted ? 'yellow' : 
            isDragging ? '#f0f0f0' : 
            isOver ? 'lightblue' : 'transparent'
          ) : (
            isDragging ? '#f0f0f0' : 'transparent'
          ),
          position: 'relative',
          zIndex: isDragging ? 1000 : 1,
          transition: 'all 0.2s ease',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isDragging ? '0 5px 10px rgba(0,0,0,0.15)' : 'none'
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

      {ReactDOM.createPortal(
        <div className="modal fade" id={modalId} tabIndex="-1" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Employee Name: {name}</h5>
                <button type="button" className="close" data-dismiss="modal">
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Email: {email || 'N/A'}</p>
                <p>Number: {phone_number || 'N/A'}</p>
                <p>Address: {address || 'N/A'}</p>
                <p>Union: {union_name || 'N/A'}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default React.memo(Employee);