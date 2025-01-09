import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';

const UnionBox = ({ id, union_name, color }) => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const allEmployees = useSelector((state) => 
        state.employeeReducer.employeesByDate?.[selectedDate] || []
    );

    const employees = allEmployees.filter(
        emp => emp.current_location === 'union' && emp.union_id === id
    );

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'EMPLOYEE',
        drop: (item, monitor) => {
            const didDrop = monitor.didDrop();
            if (didDrop) return;

            if (!item || !item.id) {
                console.error('Invalid drop item:', item);
                return;
            }

            if (item.union_id !== id || item.current_location !== 'union') {
                console.log(`Moving employee ${item.id} to union ${id} for date ${selectedDate}`);
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
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver()
        }),
    }), [id, dispatch, selectedDate]);

    // Get union number for styling
    const unionNumber = union_name.match(/^\d+/)?.[0];
    
    return (
        <div 
            ref={drop}
            className={`union-box union-${unionNumber}`}
            data-union-id={unionNumber}
            style={{
                border: '1px solid gray',
                width: '190px',
                minHeight: unionNumber >= 26 ? 'auto' : '150px',
                margin: '1px',
                padding: '1px',
                backgroundColor: isOver ? '#f0f0f0' : '#fff',
            }}
        >
            <h4 className='small-text' style={{ 
                color,
                backgroundColor: '#f8f8f8',
                borderBottom: '1px solid #ddd',
                margin: '-1px -1px 5px -1px',
                padding: '4px 8px'
            }}>
                {union_name}
            </h4>
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
                            />
                        ))
                )}
            </div>
        </div>
    );
};

export default React.memo(UnionBox);