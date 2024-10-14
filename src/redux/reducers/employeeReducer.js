const initialState = {
  // Only maintain a record of current employee locations
  employees: [] // All employees to track their current locations
};

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
      case 'SET_EMPLOYEE_INFO':
          return { ...state, employees: action.payload }; // Set all employees

      case 'MOVE_EMPLOYEE': {
          const { employeeId, targetProjectId } = action.payload;

          // Find the employee in the current list
          const employeeToMove = state.employees.find(emp => emp.id === employeeId);

          if (!employeeToMove) return state; // If not found, return current state

          // Update the employee's location
          const updatedEmployee = {
              ...employeeToMove,
              current_location: targetProjectId ? 'project' : 'union',
              job_id: targetProjectId || null // Update job_id or set it to null
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
          return state; // Always return current state for unrecognized actions
  }
};

export default employeeReducer;
