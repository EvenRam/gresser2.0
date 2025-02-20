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
        const orderA = a.display_order ?? Infinity;
        const orderB = b.display_order ?? Infinity;
        return orderA - orderB;
    });
};

const insertEmployeeAtPosition = (employees, employeeToMove, targetIndex) => {
    // Create a new array without the employee (in case they're moving within same project)
    const filteredEmployees = employees.filter(emp => emp.id !== employeeToMove.id);
    
    // Insert the employee at the target position
    const newEmployees = [...filteredEmployees];
    newEmployees.splice(targetIndex, 0, employeeToMove);
    
    // Update display orders
    return newEmployees.map((emp, index) => ({
        ...emp,
        display_order: index
    }));
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
                display_order: project.display_order ?? null,
                rain_day: project.rain_day ?? false
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

        case 'MOVE_EMPLOYEE': {
            const { employeeId, targetProjectId, date, dropIndex, sourceLocation } = action.payload;
            if (!date) return state;

            const currentProjects = state.projectsByDate[date] || [];
            const sourceProject = sourceLocation?.type === 'project' 
                ? currentProjects.find(p => p.id === sourceLocation.id)
                : findProjectWithEmployee(currentProjects, employeeId);

            const employeeToMove = sourceProject?.employees.find(emp => emp.id === employeeId) || { id: employeeId };

            const updatedProjects = currentProjects.map(project => {
                // Remove from source project
                if (project.id === sourceProject?.id) {
                    return {
                        ...project,
                        employees: project.employees.filter(emp => emp.id !== employeeId)
                    };
                }
                
                // Add to target project at specific position
                if (project.id === targetProjectId) {
                    const updatedEmployee = {
                        ...employeeToMove,
                        current_location: 'project',
                        is_highlighted: true,
                        display_order: dropIndex
                    };

                    const currentEmployees = [...(project.employees || [])];
                    const updatedEmployees = insertEmployeeAtPosition(
                        currentEmployees,
                        updatedEmployee,
                        typeof dropIndex === 'number' ? dropIndex : currentEmployees.length
                    );

                    return {
                        ...project,
                        employees: updatedEmployees
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
            const { projectId, orderedEmployeeIds, date } = action.payload;
            if (!date || !projectId || !Array.isArray(orderedEmployeeIds)) return state;
            
            const currentProjects = state.projectsByDate[date] || [];
            const updatedProjects = currentProjects.map(project => {
                if (project.id === projectId) {
                    const currentEmployees = project.employees || [];
                    const employeeMap = currentEmployees.reduce((map, emp) => {
                        map[emp.id] = emp;
                        return map;
                    }, {});

                    const updatedEmployees = orderedEmployeeIds
                        .filter(id => employeeMap[id])
                        .map((id, index) => ({
                            ...employeeMap[id],
                            display_order: index
                        }));

                    return {
                        ...project,
                        employees: updatedEmployees
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

        case 'REORDER_PROJECTS': {
            const { sourceIndex, targetIndex, date } = action.payload;
            if (!date) return state;
            
            const currentProjects = [...(state.projectsByDate[date] || [])];
            if (!currentProjects.length) return state;
            
            const [movedProject] = currentProjects.splice(sourceIndex, 1);
            currentProjects.splice(targetIndex, 0, movedProject);
            
            const updatedProjects = currentProjects.map((project, index) => ({
                ...project,
                display_order: index
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

        case 'UPDATE_RAIN_DAY_STATUS': {
            const { jobId, isRainDay, date } = action.payload;
            if (!date) return state;
            
            const currentProjects = state.projectsByDate[date] || [];
            const updatedProjects = currentProjects.map(project => {
                if (project.id === jobId) {
                    return {
                        ...project,
                        rain_day: isRainDay
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