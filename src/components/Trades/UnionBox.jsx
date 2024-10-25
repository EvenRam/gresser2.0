import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';

const UnionBox = ({ id, union_name, color }) => {
  const dispatch = useDispatch();
  const allEmployees = useSelector((state) => state.employeeReducer.employees);

  console.log(`UnionBox Render - ${union_name} (id: ${id})`);
  console.log('All Employees from Redux:', allEmployees);

  const employees = allEmployees.filter(emp => emp.current_location === 'union' && emp.union_id === id);

  console.log(`UnionBox ${union_name} (id: ${id}) - Current employees:`, employees);

  const moveEmployee = (employeeId, targetProjectId, sourceUnionId, targetUnionId) => {
    console.log('moveEmployee called with:', { employeeId, targetProjectId, sourceUnionId, targetUnionId });
    return {
      type: 'MOVE_EMPLOYEE',
      payload: { employeeId, targetProjectId, sourceUnionId, targetUnionId }
    };
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EMPLOYEE',
    drop: (item, monitor) => {
      console.log(`Drop detected in ${union_name} (id: ${id})`);
      console.log('Dropped item:', item);
      
      const didDrop = monitor.didDrop();
      if (didDrop) {
        console.log('Item was already dropped in a child component');
        return;
      }
      
      if (item.union_id !== id || item.current_location !== 'union') {
        console.log(`Moving employee ${item.id} to union ${id}`);
        dispatch(moveEmployee(item.id, null, item.union_id, id));
      } else {
        console.log(`Employee ${item.id} is already in this union. No action taken.`);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [id, union_name, dispatch, allEmployees]);

  return (
    <div 
      ref={drop}
      style={{
        border: '1px solid gray',
        width: '190px',
        minHeight: '150px',
        margin: '1px',
        padding: '1px',
        backgroundColor: isOver ? '#f0f0f0' : '#fff',
      }}
    >
      <h4 className='small-text' style={{ color }}>{union_name}</h4>
      <div className="separator"></div>
      <div className='union_box'> 
      {employees.length === 0 ? (
        <p>No employees assigned</p>
      ) : (
        employees
          .filter(employee => employee.employee_status === true)
          .map(employee => {
            console.log(`Employee in UnionBox - ${employee.first_name} ${employee.last_name}:`, employee);
            return (
              <Employee
                key={employee.id}
                {...employee}
                className="employee-name" name={`${employee.first_name} ${employee.last_name}`}
                union_id={id}
                union_name={union_name}
                current_location="union"
               

              />
            );
          })
      )}
      </div>
    </div>
  );
};

export default React.memo(UnionBox);