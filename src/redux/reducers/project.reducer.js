const projectReducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_JOB':
      return action.payload;

    case 'SET_PROJECTS_WITH_EMPLOYEES':
      return action.payload.map(project => ({
        ...project,
        employees: project.employees || []
      }));

    case 'MOVE_EMPLOYEE':
      const { employeeId, targetProjectId, sourceProjectId } = action.payload;
      
      return state.map(project => {
        // Remove employee from source project
        if (project.id === sourceProjectId) {
          return {
            ...project,
            employees: project.employees.filter(emp => emp.id !== employeeId)
          };
        }
        
        // Add employee to target project
        if (project.id === targetProjectId) {
          const employeeToMove = state
            .find(p => p.id === sourceProjectId)
            ?.employees.find(emp => emp.id === employeeId);

          if (employeeToMove) {
            return {
              ...project,
              employees: [...project.employees, employeeToMove]
            };
          }
        }
        
        return project;
      });

    default:
      return state;
  }
};

export default projectReducer;