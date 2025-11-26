import React, { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';

const UnionBox = ({ 
  id, 
  union_name, 
  color,
  isEditable 
}) => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const allEmployees = useSelector((state) => 
        state.employeeReducer.employeesByDate?.[selectedDate] || []
    );

    // Get highlighted employees for this date
    const highlightedEmployees = useSelector(state => 
        state.employeeReducer.highlightedEmployeesByDate[selectedDate] || {}
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
        canDrop: () => isEditable,
        collect: (monitor) => ({
            isOver: !!monitor.isOver()
        })
    }), [handleDrop, isEditable]);

    // Handle employee click for highlighting toggle
    const handleEmployeeClick = useCallback((employeeId, currentHighlightState) => {
        if (!isEditable) return;
        
        dispatch({ 
            type: 'SET_HIGHLIGHTED_EMPLOYEE', 
            payload: { 
                id: employeeId, 
                isHighlighted: !currentHighlightState,
                date: selectedDate
            }
        });
    }, [dispatch, selectedDate, isEditable]);

    // Get union number for styling
    const unionNumber = union_name.match(/^\d+/)?.[0];

    const filtered = employees.filter(employee => {
        return isEditable ? employee.employee_status === true : true;
    });
    console.log(`🔵 UnionBox ${union_name} - After filter (active only):`, filtered.length);
       

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
                {employees.length === 0 ? (
                    <p className="no-employees" style={{ 
                        margin: '2px 0', 
                        fontSize: '11px', 
                        fontStyle: 'italic',
                        padding: '2px',
                        color: '#666'
                    }}>No employees assigned</p>
                ) : (
                    employees
                        .filter(employee => {
                            // For past dates: show all employees who were in unions
                            // For current/future dates: only show currently active employees
                            return isEditable ? employee.employee_status === true : true;
                        })
                        .map((employee, index) => {
                            //  Remove BOTH is_highlighted AND isHighlighted from spread
                            const { is_highlighted, isHighlighted, ...cleanProps } = employee;
                            
                            // Handle both employee_id and id
                            const employeeId = employee.employee_id || employee.id;
                            
                            // Get the CORRECT highlight status from Redux using employeeId
                            const shouldBeHighlighted = !!highlightedEmployees[employeeId];
                            
                        
                            
                            return (
                                <Employee
                                    key={`${employeeId}-${index}`}
                                    {...cleanProps}
                                    id={employeeId}
                                    employee_id={employeeId}
                                    className={`employee-name union-${unionNumber}`}
                                    name={`${employee.first_name} ${employee.last_name}`}
                                    union_id={id}
                                    union_name={union_name}
                                    current_location="union"
                                    index={index}
                                    isHighlighted={shouldBeHighlighted}
                                    onClick={handleEmployeeClick}
                                    isEditable={isEditable}
                                />
                            );
                        })
                )}
            </div>
        </div>
    );
};

export default React.memo(UnionBox);