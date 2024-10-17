const initialState = {
  // Only maintain a record of current employee locations
  // All employees to track their current locations
  employees: [] 
};

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
      case 'SET_EMPLOYEE_INFO':
          return { ...state, employees: action.payload }; 

      case 'MOVE_EMPLOYEE': {
          const { employeeId, targetProjectId } = action.payload;

          // Find the employee in the current list
          const employeeToMove = state.employees.find(emp => emp.id === employeeId);

          if (!employeeToMove) return state; 

          // Update the employee's location
          const updatedEmployee = {
              ...employeeToMove,
              current_location: targetProjectId ? 'project' : 'union',
              // Update job_id or set it to null
              job_id: targetProjectId || null 
          };

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
