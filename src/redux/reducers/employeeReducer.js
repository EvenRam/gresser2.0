const initialState = {
    employees: [] // All employees with their current locations
  };
  
  const employeeReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_EMPLOYEE_INFO':
        return { ...state, employees: action.payload };
  
      case 'MOVE_EMPLOYEE': {
        const { employeeId, targetProjectId, sourceUnionId, targetUnionId } = action.payload;
  
        // Find the employee in the current list
        const employeeToMove = state.employees.find(emp => emp.id === employeeId);
  
        if (!employeeToMove) return state; // If not found, return current state
  
        let updatedEmployee = { ...employeeToMove };
  
        if (targetProjectId) {
          // Moving to a project
          updatedEmployee = {
            ...updatedEmployee,
            current_location: 'project',
            job_id: targetProjectId,
            union_id: updatedEmployee.union_id // Maintain union affiliation
          };
        } else if (targetUnionId) {
          // Moving to a union
          updatedEmployee = {
            ...updatedEmployee,
            current_location: 'union',
            job_id: null,
            union_id: targetUnionId
          };
        }
  
        // Update the employees array
        return {
          ...state,
          employees: state.employees.map(emp =>
            emp.id === employeeId ? updatedEmployee : emp
          )
        };
      }
  
      default:
        return state;
    }
  };
  
  export default employeeReducer;