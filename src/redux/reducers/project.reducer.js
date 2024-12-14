const initialState = {
    date: null,
    projects: [],
    projectsByDate: {},
    error: null
};

const findProjectWithEmployee = (projects, employeeId) => {
    return projects.find(project => 
        project.employees?.some(emp => emp.id === employeeId)
    );
};

const projectReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_PROJECTS_WITH_EMPLOYEES': {
            const processedProjects = (action.payload.jobs || []).map(project => ({
                ...project,
                job_id: project.job_id || project.id,
                id: project.id || project.job_id,
                employees: Array.isArray(project.employees) ? project.employees : []
            }));

            return {
                ...state,
                date: action.payload.date,
                projects: processedProjects,
                projectsByDate: {
                    ...state.projectsByDate,
                    [action.payload.date]: processedProjects
                }
            };
        }

        case 'MOVE_EMPLOYEE': {
            const { employeeId, targetProjectId, date } = action.payload;
            
            if (!date) {
                console.warn('No date provided for MOVE_EMPLOYEE action');
                return state;
            }

            const currentProjects = state.projectsByDate[date] || state.projects;
            const sourceProject = findProjectWithEmployee(currentProjects, employeeId);
            const employeeToMove = sourceProject?.employees.find(emp => emp.id === employeeId);

            if (!employeeToMove && targetProjectId) {
                console.log('Employee not found in any project, might be coming from union');
                return state;
            }

            const updatedProjects = currentProjects.map(project => {
                // Remove from source project
                if (project.id === sourceProject?.id) {
                    return {
                        ...project,
                        employees: project.employees.filter(emp => emp.id !== employeeId)
                    };
                }
                // Add to target project
                if (project.id === targetProjectId && employeeToMove) {
                    return {
                        ...project,
                        employees: [...project.employees, employeeToMove]
                    };
                }
                return project;
            });

            return {
                ...state,
                projects: date === state.date ? updatedProjects : state.projects,
                projectsByDate: {
                    ...state.projectsByDate,
                    [date]: updatedProjects
                }
            };
        }

        case 'UPDATE_EMPLOYEE_ORDER': {
            const { projectId, employees, date } = action.payload;
            
            if (!date || !projectId) return state;

            const currentProjects = state.projectsByDate[date] || state.projects;
            const updatedProjects = currentProjects.map(project => {
                if (project.id === projectId) {
                    return {
                        ...project,
                        employees: employees.map((emp, index) => ({
                            ...emp,
                            display_order: index
                        }))
                    };
                }
                return project;
            });

            return {
                ...state,
                projects: date === state.date ? updatedProjects : state.projects,
                projectsByDate: {
                    ...state.projectsByDate,
                    [date]: updatedProjects
                }
            };
        }

        default:
            return state;
    }
};

export default projectReducer;