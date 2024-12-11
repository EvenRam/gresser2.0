const initialState = {
    date: null, // Currently selected date
    projects: [] // List of projects with employees
  };
  // Utility functions
  const findEmployeeToMove = (projects, sourceProjectId, employeeId) => {
    return projects
      .find(project => project.id === sourceProjectId)
      ?.employees.find(emp => emp.id === employeeId);
  };
  const updateProjectEmployees = (project, newEmployees) => ({
    ...project,
    employees: newEmployees
  });
  const projectReducer = (state = initialState, action) => {
    console.log("Action received in projectReducer:", action);
    switch (action.type) {
      case 'SET_PROJECTS_WITH_EMPLOYEES':
        console.log("Setting projects with employees:", action.payload);
        return {
          date: action.payload.date,
          projects: (action.payload.jobs || []).map(project => ({
            ...project,
            employees: project.employees || [] // Ensure employees array exists
          }))
        };
      case 'MOVE_EMPLOYEE': {
        const { employeeId, targetProjectId, sourceProjectId, date } = action.payload;
        // Ensure the action is scoped to the correct date
        if (state.date !== date) {
          console.warn(`Date mismatch: reducer date (${state.date}) vs action date (${date})`);
          return state;
        }
        const employeeToMove = findEmployeeToMove(state.projects, sourceProjectId, employeeId);
        if (!employeeToMove) {
          console.error(`Employee with ID ${employeeId} not found in source project ${sourceProjectId}`);
          return state;
        }
        return {
          ...state,
          projects: state.projects.map(project => {
            if (project.id === sourceProjectId) {
              return updateProjectEmployees(
                project,
                project.employees.filter(emp => emp.id !== employeeId)
              );
            }
            if (project.id === targetProjectId) {
              return updateProjectEmployees(project, [...project.employees, employeeToMove]);
            }
            return project;
          })
        };
      }
      case 'REORDER_PROJECTS': {
        const { sourceIndex, targetIndex, date } = action.payload;
        if (state.date !== date) {
          console.warn(`Date mismatch: reducer date (${state.date}) vs action date (${date})`);
          return state;
        }
        const reorderedProjects = [...state.projects];
        const [movedProject] = reorderedProjects.splice(sourceIndex, 1);
        reorderedProjects.splice(targetIndex, 0, movedProject);
        return {
          ...state,
          projects: reorderedProjects.map((project, index) => ({
            ...project,
            display_order: index
          }))
        };
      }
      case 'UPDATE_EMPLOYEE_ORDER': {
        const { projectId, employees, date } = action.payload;
        if (state.date !== date) {
          console.warn(`Date mismatch: reducer date (${state.date}) vs action date (${date})`);
          return state;
        }
        return {
          ...state,
          projects: state.projects.map(project => {
            if (project.id === projectId) {
              return updateProjectEmployees(project, employees);
            }
            return project;
          })
        };
      }
      default:
        return state;
    }
  };
  export default projectReducer;
  