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

const sortProjectsByOrder = (projects) => {
    return [...projects].sort((a, b) => {
        // Handle null/undefined display_order
        const orderA = a.display_order ?? Infinity;
        const orderB = b.display_order ?? Infinity;
        return orderA - orderB;
    });
};

const projectReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_PROJECTS_WITH_EMPLOYEES': {
            const { date, jobs } = action.payload;
            if (!date) {
                console.warn('No date provided for SET_PROJECTS_WITH_EMPLOYEES');
                return state;
            }

            const processedProjects = (jobs || []).map(project => ({
                ...project,
                job_id: project.job_id || project.id,
                id: project.id || project.job_id,
                employees: Array.isArray(project.employees) ? project.employees : [],
                display_order: project.display_order ?? null
            }));

            const sortedProjects = sortProjectsByOrder(processedProjects);

            return {
                ...state,
                date,
                projects: sortedProjects,
                projectsByDate: {
                    ...state.projectsByDate,
                    [date]: sortedProjects
                },
                error: null
            };
        }

        case 'REORDER_PROJECTS': {
            const { sourceIndex, targetIndex, date } = action.payload;
            if (!date) return state;

            const currentProjects = [...(state.projectsByDate[date] || [])];
            const [movedProject] = currentProjects.splice(sourceIndex, 1);
            currentProjects.splice(targetIndex, 0, movedProject);

            // Update display_order for all projects
            const updatedProjects = currentProjects.map((project, index) => ({
                ...project,
                display_order: index
            }));

            return {
                ...state,
                projects: date === state.date ? updatedProjects : state.projects,
                projectsByDate: {
                    ...state.projectsByDate,
                    [date]: updatedProjects
                }
            };
        }

        case 'UPDATE_PROJECT_ORDER': {
            const { orderedProjectIds, date } = action.payload;
            if (!date || !Array.isArray(orderedProjectIds)) return state;

            const currentProjects = state.projectsByDate[date] || [];
            const updatedProjects = currentProjects.map(project => ({
                ...project,
                display_order: orderedProjectIds.indexOf(project.job_id)
            }));

            const sortedProjects = sortProjectsByOrder(updatedProjects);

            return {
                ...state,
                projects: date === state.date ? sortedProjects : state.projects,
                projectsByDate: {
                    ...state.projectsByDate,
                    [date]: sortedProjects
                }
            };
        }

        case 'MOVE_EMPLOYEE': {
            const { employeeId, targetProjectId, date } = action.payload;
            if (!date) {
                console.warn('No date provided for MOVE_EMPLOYEE action');
                return state;
            }

            const currentProjects = state.projectsByDate[date] || [];
            const sourceProject = findProjectWithEmployee(currentProjects, employeeId);
            const employeeToMove = sourceProject?.employees.find(emp => emp.id === employeeId);

            if (!employeeToMove && targetProjectId) {
                console.log('Employee not found in any project, might be coming from union');
                return state;
            }

            const updatedProjects = currentProjects.map(project => {
                if (project.id === sourceProject?.id) {
                    return {
                        ...project,
                        employees: project.employees.filter(emp => emp.id !== employeeId)
                    };
                }
                if (project.id === targetProjectId && employeeToMove) {
                    return {
                        ...project,
                        employees: [...project.employees, {
                            ...employeeToMove,
                            current_location: 'project',
                            is_highlighted: true
                        }]
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

            const currentProjects = state.projectsByDate[date] || [];
            const updatedProjects = currentProjects.map(project => {
                if (project.id === projectId) {
                    const updatedEmployees = project.employees.map(emp => {
                        const newOrder = employees.findIndex(e => e.id === emp.id);
                        return {
                            ...emp,
                            display_order: newOrder >= 0 ? newOrder : emp.display_order
                        };
                    });
                    return {
                        ...project,
                        employees: updatedEmployees.sort((a, b) => 
                            (a.display_order ?? Infinity) - (b.display_order ?? Infinity)
                        )
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