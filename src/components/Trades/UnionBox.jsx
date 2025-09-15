import React, { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';

const UnionBox = ({ 
  id, 
  union_name, 
  color,
  isEditable // NEW: Explicitly passed prop
}) => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const allEmployees = useSelector((state) => 
        state.employeeReducer.employeesByDate?.[selectedDate] || []
    );
    const boxRef = useRef(null);
    
    // Filter employees for this union
    const employees = allEmployees.filter(
        emp => emp.current_location === 'union' && emp.union_id === id
    );
    
    // Position-aware drop handling
    const handleDrop = useCallback((item, monitor) => {
        const didDrop = monitor.didDrop();
        if (didDrop) return;
        
        if (!item || !item.id) {
            console.error('Invalid drop item:', item);
            return;
        }

        // Only handle drops if moving to a different union or from a project
        if (item.union_id !== id || item.current_location !== 'union') {
            dispatch({
                type: 'MOVE_EMPLOYEE',
                payload: {
                    employeeId: item.id,
                    targetProjectId: null,
                    sourceUnionId: item.union_id,
                    date: selectedDate
                }
            });
        }
    }, [id, dispatch, selectedDate]);

    // Drop configuration
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'EMPLOYEE',
        drop: handleDrop,
        collect: (monitor) => ({
            isOver: !!monitor.isOver()
        })
    }), [handleDrop]);

    // Get union number for styling
    const unionNumber = union_name.match(/^\d+/)?.[0];
    
    // Filter employees based on editable state
    const visibleEmployees = employees.filter(employee => {
        // For past dates (not editable): show all employees who were in unions
        // For current/future dates (editable): only show currently active employees
        return isEditable ? employee.employee_status === true : true;
    });
    
    return (
        <div 
            ref={node => {
                boxRef.current = node;
                drop(node);
            }}
            className={`union-box union-${unionNumber}`}
            data-union-id={unionNumber}
            style={{
                backgroundColor: isOver ? 'rgba(200, 200, 255, 0.1)' : 'transparent',
                border: isOver ? '1px dashed #4a90e2' : 'none',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease'
            }}
        >
            <div 
                className='union-label small-text' 
                style={{ 
                    color, 
                    margin: '-2px -2px 2px -2px',
                    padding: '3px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: '#f8f8f8',
                    borderBottom: '1px solid #ddd'
                }}
            >
                {union_name}
            </div>
            
            <div className="union_box" style={{ 
                marginTop: '2px',
                padding: '0px'
            }}> 
                {visibleEmployees.length === 0 ? (
                    <p className="no-employees" style={{ 
                        margin: '2px 0', 
                        fontSize: '11px', 
                        fontStyle: 'italic',
                        padding: '2px',
                        color: '#666'
                    }}>No employees assigned</p>
                ) : (
                    visibleEmployees.map((employee, index) => (
                        <Employee
                            key={`${employee.id}-${index}`}
                            {...employee}
                            id={employee.id} 
                            className={`employee-name union-${unionNumber}`}
                            name={`${employee.first_name} ${employee.last_name}`}
                            union_id={id}
                            union_name={union_name}
                            current_location="union"
                            index={index}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default React.memo(UnionBox);