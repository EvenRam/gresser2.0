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
        collect: (monitor) => ({
            isOver: !!monitor.isOver()
        }),
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
                        sourceLocation: {
                            type: 'union',
                            id: item.union_id
                        },
                        dropIndex: null,
                        date: selectedDate
                    }
                });
            }
        }
    }), [id, dispatch, selectedDate]);

    // Get union number for styling
    const unionNumber = union_name.match(/^\d+/)?.[0];
    
    return (
        <div 
            ref={drop}
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
                            />
                        ))
                )}
            </div>
        </div>
    );
};

export default React.memo(UnionBox);