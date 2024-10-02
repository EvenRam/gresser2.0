const initialState = {
    allEmployees: [],
    employeesByUnion: {},
    employeesByProject: {},
    unionEmployees: [],
    projectEmployees: []
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
          employeesByUnion: action.payload,
          unionEmployees: Object.values(action.payload).flat()
        };
  
      case 'SET_EMPLOYEES_BY_PROJECT':
        return {
          ...state,
          employeesByProject: action.payload,
          projectEmployees: Object.values(action.payload).flat()
        };
  
      case 'SET_EMPLOYEE_CARD':
        return {
          ...state,
          unionEmployees: action.payload
        };
  
      case 'MOVE_EMPLOYEE':
        const { employeeId, fromUnionId, toProjectId } = action.payload;
        const movingEmployee = state.allEmployees.find(emp => emp.id === employeeId);
  
        if (!movingEmployee) return state;
  
        const updatedUnions = { ...state.employeesByUnion };
        const updatedProjects = { ...state.employeesByProject };
  
        // Remove from union
        if (fromUnionId) {
          updatedUnions[fromUnionId] = (updatedUnions[fromUnionId] || []).filter(emp => emp.id !== employeeId);
        }
  
        // Add to project or back to union
        if (toProjectId) {
          updatedProjects[toProjectId] = [...(updatedProjects[toProjectId] || []), movingEmployee];
        } else if (movingEmployee.union_id) {
          updatedUnions[movingEmployee.union_id] = [...(updatedUnions[movingEmployee.union_id] || []), movingEmployee];
        }
  
        return {
          ...state,
          employeesByUnion: updatedUnions,
          employeesByProject: updatedProjects,
          unionEmployees: Object.values(updatedUnions).flat(),
          projectEmployees: Object.values(updatedProjects).flat()
        };
  
      default:
        return state;
    }
  };
  
  export default employeeReducer;