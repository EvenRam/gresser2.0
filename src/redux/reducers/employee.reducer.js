const initialState = {
    allEmployees: [],
    employeesByUnion: {},
    employeesByProject: {}
  };
  
  const employeeReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_ALL_EMPLOYEES':
        return {
          ...state,
          allEmployees: action.payload
        };
      case 'SET_EMPLOYEES_BY_UNION':
        return {
          ...state,
          employeesByUnion: action.payload
        };
      case 'SET_EMPLOYEES_BY_PROJECT':
        return {
          ...state,
          employeesByProject: action.payload
        };
      case 'MOVE_EMPLOYEE':
        const { employeeId, fromUnionId, toProjectId } = action.payload;
        const updatedUnions = { ...state.employeesByUnion };
        const updatedProjects = { ...state.employeesByProject };
        
        // Remove from union
        if (fromUnionId) {
          updatedUnions[fromUnionId] = updatedUnions[fromUnionId].filter(id => id !== employeeId);
        }
        
        // Add to project
        if (toProjectId) {
          if (!updatedProjects[toProjectId]) {
            updatedProjects[toProjectId] = [];
          }
          updatedProjects[toProjectId].push(employeeId);
        } else {
          // If toProjectId is null, move back to union
          const employee = state.allEmployees.find(emp => emp.id === employeeId);
          if (employee && employee.union_id) {
            if (!updatedUnions[employee.union_id]) {
              updatedUnions[employee.union_id] = [];
            }
            updatedUnions[employee.union_id].push(employeeId);
          }
        }
  
        return {
          ...state,
          employeesByUnion: updatedUnions,
          employeesByProject: updatedProjects
        };
      default:
        return state;
    }
  };
  
  export default employeeReducer;