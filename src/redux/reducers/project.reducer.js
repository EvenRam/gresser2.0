const initialState = {
  date: null,
  projects: [],
  projectsByDate: {},
  error: null
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
    case 'SET_PROJECTS_WITH_EMPLOYEES': {
      console.log("Setting projects with employees:", action.payload);
      
      // Map the projects to include both id and job_id
      const processedJobs = (action.payload.jobs || []).map(project => ({
          ...project,
          job_id: project.job_id || project.id, // Add job_id if it doesn't exist
          id: project.id || project.job_id, // Keep id for consistency
          employees: project.employees || []
      }));
  
      console.log("Processed projects:", processedJobs);
  
      return {
          date: action.payload.date,
          projects: processedJobs.map(project => ({
              ...project,
              employees: Array.isArray(project.employees) ? project.employees : []
          }))
      };
  }

      case 'MOVE_EMPLOYEE': {
          const { employeeId, targetProjectId, sourceProjectId, date } = action.payload;
          console.log("Moving employee:", {
              employeeId,
              targetProjectId,
              sourceProjectId,
              date
          });

          // Ensure we're operating on the correct date
          if (state.date !== date) {
              console.warn(`Date mismatch: reducer date (${state.date}) vs action date (${date})`);
              return state;
          }

          const employeeToMove = findEmployeeToMove(state.projects, sourceProjectId, employeeId);
          if (!employeeToMove) {
              console.error(`Employee with ID ${employeeId} not found in source project ${sourceProjectId}`);
              return state;
          }

          const updatedProjects = state.projects.map(project => {
              if (project.id === sourceProjectId) {
                  return updateProjectEmployees(
                      project,
                      project.employees.filter(emp => emp.id !== employeeId)
                  );
              }
              if (project.id === targetProjectId) {
                  return updateProjectEmployees(
                      project,
                      [...project.employees, employeeToMove]
                  );
              }
              return project;
          });

          return {
              ...state,
              projects: updatedProjects,
              projectsByDate: {
                  ...state.projectsByDate,
                  [date]: updatedProjects
              }
          };
      }

      case 'REORDER_PROJECTS': {
          const { sourceIndex, targetIndex, date } = action.payload;
          console.log("Reordering projects:", {
              sourceIndex,
              targetIndex,
              date
          });

          if (state.date !== date) {
              console.warn(`Date mismatch: reducer date (${state.date}) vs action date (${date})`);
              return state;
          }

          const reorderedProjects = [...state.projects];
          const [movedProject] = reorderedProjects.splice(sourceIndex, 1);
          reorderedProjects.splice(targetIndex, 0, movedProject);

          const projectsWithNewOrder = reorderedProjects.map((project, index) => ({
              ...project,
              display_order: index
          }));

          return {
              ...state,
              projects: projectsWithNewOrder,
              projectsByDate: {
                  ...state.projectsByDate,
                  [date]: projectsWithNewOrder
              }
          };
      }

      case 'UPDATE_EMPLOYEE_ORDER': {
          const { projectId, employees, date } = action.payload;
          console.log("Updating employee order:", {
              projectId,
              employeeCount: employees?.length,
              date
          });

          if (state.date !== date) {
              console.warn(`Date mismatch: reducer date (${state.date}) vs action date (${date})`);
              return state;
          }

          const updatedProjects = state.projects.map(project => {
              if (project.id === projectId) {
                  return updateProjectEmployees(project, employees);
              }
              return project;
          });

          return {
              ...state,
              projects: updatedProjects,
              projectsByDate: {
                  ...state.projectsByDate,
                  [date]: updatedProjects
              }
          };
      }

      case 'FETCH_ERROR': {
          return {
              ...state,
              error: action.payload
          };
      }

      case 'RESET_PROJECTS': {
          return initialState;
      }

      default:
          return state;
  }
};

export default projectReducer;