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

  // Debug helper
  const debugLog = (message, data) => {
    if (data !== undefined) {
      console.log(`[DEBUG-EMPLOYEE-${actualId}] ${message}`, data);
    } else {
      console.log(`[DEBUG-EMPLOYEE-${actualId}] ${message}`);
    }
  };

  // Enhanced drag configuration with position tracking and debug
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'EMPLOYEE',
    item: (monitor) => {
      const sourceRect = ref.current?.getBoundingClientRect();
      const initialOffset = monitor.getClientOffset();
      
      debugLog('Starting drag', {
        id: actualId,
        name,
        current_location,
        projectId,
        index,
        sourceRect: {
          top: sourceRect?.top,
          left: sourceRect?.left,
          height: sourceRect?.height,
          width: sourceRect?.width
        },
        initialOffset
      });
      
      return {
        id: actualId,
        employee_id: actualId,
        union_id,
        union_name,
        current_location,
        projectId,
        index,
        name,
        type: 'EMPLOYEE',
        sourceLocation: {
          type: current_location,
          id: current_location === 'project' ? projectId : union_id,
          rect: sourceRect,
          offset: initialOffset
        }
      };
    },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      debugLog('Drag ended', {
        id: actualId,
        name,
        didDrop,
        dropResult: monitor.getDropResult()
      });
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
  }), [actualId, union_id, union_name, current_location, index, projectId, name]);

  // Enhanced drop configuration for reordering within projects
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    canDrop: (item) => {
      // Can only drop if same project and not the same position
      const canDrop = !!(
        projectId && 
        item.projectId === projectId && 
        item.index !== index
      );
      
      if (canDrop) {
        debugLog('Can drop item for reordering', { 
          itemId: item.id, 
          itemName: item.name,
          fromIndex: item.index,
          toIndex: index 
        });
      }
      return canDrop;
    },
    hover: (item, monitor) => {
      if (!ref.current || !projectId || item.projectId !== projectId) return;
      if (typeof onReorder !== 'function') return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
  
      // Get the rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Get mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
  
      // Only perform the move when the mouse has crossed half of the item's height
      
      // Dragging downwards - only move when cursor is below 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards - only move when cursor is above 50%
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
  
      // Time to actually perform the action
      debugLog('Reordering', { 
        dragIndex, 
        hoverIndex, 
        direction: dragIndex > hoverIndex ? 'up' : 'down',
        mousePosition: {
          hoverClientY,
          hoverMiddleY
        }
      });
      
      // Call the reordering function
      onReorder(dragIndex, hoverIndex);
      
      // Update the index in the item so we can keep track of it
      item.index = hoverIndex;
    },
    drop: (item) => {
      debugLog('Drop complete - internal reorder', { 
        fromIndex: item.originalIndex || item.index, 
        toIndex: index,
        employeeId: item.id
      });
      
      return { moved: true, internal: true };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    }),
  }), [index, onReorder, projectId]);

  // Preserve highlight handling
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (current_location === 'project') {
      debugLog('Right-click highlight toggle', { isHighlighted });
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
          padding: isHighlighted ? '2px 4px' : '1px 4px',
          margin: isHighlighted ? '1px 0' : '1px 0',
          cursor: 'move',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          backgroundColor: projectId ? (
            isHighlighted ? 'rgba(255, 255, 0, 0.3)' : 
            isDragging ? '#f0f0f0' : 
            isOver ? 'rgba(173, 216, 230, 0.5)' : 'transparent'
          ) : (
            isDragging ? '#f0f0f0' : 'transparent'
          ),
          position: 'relative',
          zIndex: isDragging ? 1000 : 1,
          transition: 'all 0.2s ease',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          border: isHighlighted ? '1px solid #edd800' : '1px solid transparent',
          boxShadow: isDragging ? '0 5px 10px rgba(0,0,0,0.15)' : 'none'
        }}
        data-employee-id={actualId}
        data-location={current_location}
        data-index={index}
      >
        <h6
          className="primary"
          data-toggle="modal"
          data-target={`#${modalId}`}
          style={{ color: unionColor, margin: 0, padding: 0 }}
        >
          {name}
          <span style={{ fontSize: '8px', color: '#999', marginLeft: '4px' }}>[{index}]</span>
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
                <p>Position Index: {index}</p> {/* Debug info */}
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