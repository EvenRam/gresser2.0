import React, { useCallback, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';

const UnionBox = ({ id, union_name, color }) => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const allEmployees = useSelector((state) => 
        state.employeeReducer.employeesByDate?.[selectedDate] || []
    );
    const boxRef = useRef(null);
    const [sourcePosition, setSourcePosition] = useState(null);

    // Filter employees for this union
    const employees = allEmployees.filter(
        emp => emp.current_location === 'union' && emp.union_id === id
    );

    // Track drag start position
    const handleDragStart = useCallback((employeeId, event) => {
        const boxRect = boxRef.current?.getBoundingClientRect();
        const initialPosition = {
            x: event.clientX - boxRect?.left,
            y: event.clientY - boxRect?.top
        };
        setSourcePosition(initialPosition);
        return {
            type: 'union',
            id: employeeId,
            unionId: id,
            initialPosition
        };
    }, [id]);

    // Position-aware drop handling
    const handleDrop = useCallback((item, monitor) => {
        const didDrop = monitor.didDrop();
        if (didDrop) return;

        if (!item || !item.id) {
            console.error('Invalid drop item:', item);
            return;
        }

        // Calculate relative drop position
        const dropClientOffset = monitor.getClientOffset();
        const sourceClientOffset = monitor.getInitialClientOffset();
        const dropPosition = {
            x: dropClientOffset.x - sourceClientOffset.x,
            y: dropClientOffset.y - sourceClientOffset.y
        };

        // Only handle drops if moving to a different union or from a project
        if (item.union_id !== id || item.current_location !== 'union') {
            console.log(`Moving employee ${item.id} to union ${id} for date ${selectedDate}`);
            dispatch({
                type: 'MOVE_EMPLOYEE',
                payload: {
                    employeeId: item.id,
                    targetProjectId: null,
                    sourceLocation: {
                        type: item.current_location,
                        id: item.current_location === 'project' ? item.projectId : item.union_id
                    },
                    sourcePosition: item.initialPosition,
                    dropPosition,
                    date: selectedDate
                }
            });
        }
    }, [id, dispatch, selectedDate]);

    // Enhanced drop configuration with position tracking
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'EMPLOYEE',
        collect: (monitor) => ({
            isOver: !!monitor.isOver()
        }),
        drop: handleDrop,
        hover: (item, monitor) => {
            if (!monitor.isOver({ shallow: true })) return;

            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;

            const boxRect = boxRef.current?.getBoundingClientRect();
            if (!boxRect) return;

            // Track hover position relative to box
            const hoverPosition = {
                x: clientOffset.x - boxRect.left,
                y: clientOffset.y - boxRect.top
            };

            // Could be used for visual feedback or position calculations
            if (item.union_id !== id) {
                // Hovering from different union or project
                // Could add visual feedback here
            }
        }
    }), [handleDrop]);

    // Get union number for styling
    const unionNumber = union_name.match(/^\d+/)?.[0];
    
    return (
        <div 
            ref={node => {
                boxRef.current = node;
                drop(node);
            }}
            className={`union-box union-${unionNumber}`}
            data-union-id={unionNumber}
        >
            <div className='union-label small-text' style={{ color }}>
                {union_name}
            </div>

            <div className="union_box"> 
                {employees.length === 0 ? (
                    <p className="no-employees">No employees assigned</p>
                ) : (
                    employees
                        .filter(employee => employee.employee_status === true)
                        .map((employee, index) => (
                            <Employee
                                key={employee.id}
                                {...employee}
                                id={employee.id} 
                                className={`employee-name union-${unionNumber}`}
                                name={`${employee.first_name} ${employee.last_name}`}
                                union_id={id}
                                union_name={union_name}
                                current_location="union"
                                index={index}
                                onDragStart={handleDragStart}
                            />
                        ))
                )}
            </div>
        </div>
    );
};

export default React.memo(UnionBox);