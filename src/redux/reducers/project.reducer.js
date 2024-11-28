const initialState = {
  date: null, // Currently selected date
  projects: [] // List of projects with employees
};

// Utility function to find an employee to move
const findEmployeeToMove = (projects, sourceProjectId, employeeId) => {
  return projects
    .find(project => project.id === sourceProjectId)
    ?.employees.find(emp => emp.id === employeeId);
};

// Utility function to update a project's employees
const updateProjectEmployees = (project, newEmployees) => ({
  ...project,
  employees: newEmployees
});

const projectReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_PROJECTS_WITH_EMPLOYEES':
      // Replace both date and projects
      return {
        date: action.payload.date, // Update the selected date
        projects: action.payload.projects.map(project => ({
          ...project,
          employees: project.employees || [] // Ensure employees array exists
        }))
      };

    case 'MOVE_EMPLOYEE': {
      const { employeeId, targetProjectId, sourceProjectId, date } = action.payload;

      // Ensure the action is scoped to the correct date
      if (state.date !== date) return state;

      // Find the employee to move
      const employeeToMove = findEmployeeToMove(state.projects, sourceProjectId, employeeId);
      if (!employeeToMove) {
        console.error(`Employee with ID ${employeeId} not found in source project ${sourceProjectId}`);
        return state; // No changes if employee not found
      }

      return {
        ...state,
        projects: state.projects.map(project => {
          // Remove the employee from the source project
          if (project.id === sourceProjectId) {
            return updateProjectEmployees(
              project,
              project.employees.filter(emp => emp.id !== employeeId)
            );
          }

          // Add the employee to the target project
          if (project.id === targetProjectId) {
            return updateProjectEmployees(project, [...project.employees, employeeToMove]);
          }

          return project; // No changes for other projects
        })
      };
    }

    case 'REORDER_PROJECTS': {
      const { sourceIndex, targetIndex, date } = action.payload;

      // Ensure the action is scoped to the correct date
      if (state.date !== date) return state;

      const reorderedProjects = [...state.projects];
      const [movedProject] = reorderedProjects.splice(sourceIndex, 1);
      reorderedProjects.splice(targetIndex, 0, movedProject);

      return {
        ...state,
        projects: reorderedProjects.map((project, index) => ({
          ...project,
          display_order: index // Update display order for all projects
        }))
      };
    }

    case 'UPDATE_EMPLOYEE_ORDER': {
      const { projectId, employees, date } = action.payload;

      // Ensure the action is scoped to the correct date
      if (state.date !== date) return state;

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
