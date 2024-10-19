const projectReducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_JOB':
      console.log('SET_JOB payload:', action.payload);
      return action.payload;

    case 'SET_PROJECTS_WITH_EMPLOYEES':
      console.log('SET_PROJECTS_WITH_EMPLOYEES payload:', action.payload);
      return action.payload.map(project => ({
        ...project,
        employees: project.employees || []
      }));

    case 'MOVE_EMPLOYEE':
      const { employeeId, targetProjectId, sourceProjectId } = action.payload;
      console.log('MOVE_EMPLOYEE payload:', action.payload);
      
      return state.map(project => {
        if (project.id === sourceProjectId) {
          return {
            ...project,
            employees: project.employees.filter(emp => emp.id !== employeeId)
          };
        }
        if (project.id === targetProjectId) {
          const movedEmployee = state
            .find(p => p.id === sourceProjectId)
            ?.employees.find(emp => emp.id === employeeId);
          
          if (movedEmployee) {
            return {
              ...project,
              employees: [...project.employees, {...movedEmployee, job_id: targetProjectId}]
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