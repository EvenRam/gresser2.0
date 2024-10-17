const initialState = {

    employees: []
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
              union_id: targetUnionId || emp.union_id
            };
          }
          return emp;
        });
  
        return { ...state, employees: updatedEmployees };


      }
  
      default:

        return state;
    }
  };
  
  export default employeeReducer;

