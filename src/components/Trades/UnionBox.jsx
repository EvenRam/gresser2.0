import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import Employee from '../Scheduling/Employee';
import './Box.css';

const UnionBox = ({ id, union_name, color }) => {
 const dispatch = useDispatch();
 const allEmployees = useSelector((state) => state.employeeReducer.employees);
 const employees = allEmployees.filter(emp => emp.current_location === 'union' && emp.union_id === id);

 const moveEmployee = (employeeId, targetProjectId, sourceUnionId, targetUnionId) => {
   return {
     type: 'MOVE_EMPLOYEE',
     payload: { employeeId, targetProjectId, sourceUnionId, targetUnionId }
   };
 };

 const [{ isOver }, drop] = useDrop(() => ({
   accept: 'EMPLOYEE',
   drop: (item, monitor) => {
     const didDrop = monitor.didDrop();
     if (didDrop) return;
     
     if (item.union_id !== id || item.current_location !== 'union') {
       dispatch(moveEmployee(item.id, null, item.union_id, id));
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
       minHeight: '100px',
       margin: '1px',
       padding: '1px',
       backgroundColor: isOver ? '#f0f0f0' : '#fff',
       '@media print': {
         width: '160px',
         minHeight: '80px',
         margin: '0',
         padding: '1px',
         breakInside: 'avoid',
         pageBreakInside: 'avoid',
       }
     }}
   >
     <h4 className='small-text' style={{ 
       color,
       margin: '0',
       padding: '2px',
       fontSize: window.matchMedia('print').matches ? '8pt' : '16px'
     }}>
       {union_name}
     </h4>
     <div className="separator"></div>
     <div className='union_box'> 
       {employees.length === 0 ? (
         <p style={{ margin: '2px', fontSize: window.matchMedia('print').matches ? '7pt' : 'inherit' }}>
           No employees assigned
         </p>
       ) : (
         employees
           .filter(employee => employee.employee_status === true)
           .map(employee => (
             <Employee
               key={employee.id}
               {...employee}
               className="employee-name"
               name={`${employee.first_name} ${employee.last_name}`}
               union_id={id}
               union_name={union_name}
               current_location="union"
             />
           ))
       )}
     </div>
   </div>
 );
};

export default React.memo(UnionBox);