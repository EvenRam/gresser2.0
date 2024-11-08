const initialState = {
  employees: [],
  highlightedEmployees: JSON.parse(localStorage.getItem('highlightedEmployees') || '{}')
};

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_EMPLOYEE_INFO':
      return { ...state, employees: action.payload };

    case 'MOVE_EMPLOYEE': {
      const { employeeId, targetProjectId, targetUnionId } = action.payload;

      const updatedEmployees = state.employees.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            current_location: targetProjectId ? 'project' : 'union',
            job_id: targetProjectId || null,
            union_id: targetUnionId || emp.union_id,
            display_order: null // Reset display_order when moving to new project
          };
        }
        return emp;
      });

      return { ...state, employees: updatedEmployees };
    }

    case 'UPDATE_EMPLOYEE_ORDER': {
      const { projectId, employees } = action.payload;
      
      const updatedEmployees = state.employees.map(emp => {
        const updatedEmployee = employees.find(e => e.id === emp.id);
        if (updatedEmployee && emp.job_id === projectId) {
          return {
            ...emp,
            display_order: updatedEmployee.display_order
          };
        }
        return emp;
      });

      return { ...state, employees: updatedEmployees };
    }

    case 'SET_HIGHLIGHTED_EMPLOYEE':
      const newHighlightedEmployees = {
        ...state.highlightedEmployees,
        [action.payload.id]: action.payload.isHighlighted
      };
      localStorage.setItem('highlightedEmployees', JSON.stringify(newHighlightedEmployees));
      return {
        ...state,
        highlightedEmployees: newHighlightedEmployees
      };

    default:
      return state;
  }
};

export default employeeReducer;