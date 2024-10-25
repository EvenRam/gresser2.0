const initialState = {
  employees: [],
  highlightedEmployees: JSON.parse(localStorage.getItem('highlightedEmployees') || '{}')
};

const employeeReducer = (state = initialState, action) => {
  console.log('employeeReducer called with action:', action.type);
  console.log('Current state:', JSON.parse(JSON.stringify(state)));

  switch (action.type) {
    case 'SET_EMPLOYEE_INFO':
      console.log('Setting employee info:', action.payload);
      const newState = { ...state, employees: action.payload };
      console.log('New state after SET_EMPLOYEE_INFO:', JSON.parse(JSON.stringify(newState)));
      return newState;

    case 'MOVE_EMPLOYEE': {
      console.log('Moving employee:', action.payload);
      const { employeeId, targetProjectId, targetUnionId } = action.payload;

      const updatedEmployees = state.employees.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            current_location: targetProjectId ? 'project' : 'union',
            job_id: targetProjectId || null,
            union_id: targetUnionId || emp.union_id
          };
        }
        return emp;
      });

      const newState = { ...state, employees: updatedEmployees };
      console.log('New state after MOVE_EMPLOYEE:', JSON.parse(JSON.stringify(newState)));
      return newState;
    }

    case 'SET_HIGHLIGHTED_EMPLOYEE':
      console.log('Setting highlighted employee:', action.payload);
      const newHighlightedEmployees = {
        ...state.highlightedEmployees,
        [action.payload.id]: action.payload.isHighlighted
      };
      localStorage.setItem('highlightedEmployees', JSON.stringify(newHighlightedEmployees));
      const newHighlightedState = {
        ...state,
        highlightedEmployees: newHighlightedEmployees
      };
      console.log('New state after SET_HIGHLIGHTED_EMPLOYEE:', JSON.parse(JSON.stringify(newHighlightedState)));
      return newHighlightedState;

    case 'CLEAR_ALL_HIGHLIGHTS':
      console.log('Clearing all highlights');
      localStorage.removeItem('highlightedEmployees');
      const clearedState = {
        ...state,
        highlightedEmployees: {}
      };
      console.log('New state after CLEAR_ALL_HIGHLIGHTS:', JSON.parse(JSON.stringify(clearedState)));
      return clearedState;

    case 'INITIALIZE_HIGHLIGHTED_EMPLOYEES':
      console.log('Initializing highlighted employees:', action.payload);
      return {
        ...state,
        highlightedEmployees: action.payload
      };

    default:
      return state;
  }
};

export default employeeReducer;