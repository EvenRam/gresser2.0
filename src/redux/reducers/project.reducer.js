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

    case 'REORDER_PROJECTS':
      const { sourceIndex, targetIndex } = action.payload;
      const newProjects = [...state];
      const [movedProject] = newProjects.splice(sourceIndex, 1);
      newProjects.splice(targetIndex, 0, movedProject);
      
      // Update display_order for all projects
      return newProjects.map((project, index) => ({
        ...project,
        display_order: index
      }));

    case 'UPDATE_EMPLOYEE_ORDER':
      return state.map(project => {
        if (project.id === action.payload.projectId) {
          return {
            ...project,
            employees: action.payload.employees
          };
        }
        return project;
      });

    default:
      return state;
  }
};

export default projectReducer;