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
    const newEmployees = employees.filter(emp => emp.id !== employeeToMove.id);
    newEmployees.splice(targetIndex, 0, employeeToMove);
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
            
            console.log('Processing projects:', jobs);
            
            const processedProjects = (jobs || []).map(project => ({
                ...project,
                job_id: project.job_id || project.id,
                id: project.id || project.job_id,
                employees: Array.isArray(project.employees) ? project.employees : [],
                display_order: project.display_order ?? null,
                rain_day: project.rain_day ?? false
            }));
            
            const sortedProjects = sortProjectsByOrder(processedProjects);
            console.log('Sorted projects:', sortedProjects);

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
            const { employeeId, targetProjectId, date, insertIndex } = action.payload;
            if (!date) {
                console.warn('No date provided for MOVE_EMPLOYEE action');
                return state;
            }
            
            const currentProjects = state.projectsByDate[date] || [];
            const sourceProject = findProjectWithEmployee(currentProjects, employeeId);
            const employeeToMove = sourceProject?.employees.find(emp => emp.id === employeeId);

            const updatedProjects = currentProjects.map(project => {
                // Remove from source project if it exists
                if (project.id === sourceProject?.id) {
                    return {
                        ...project,
                        employees: project.employees.filter(emp => emp.id !== employeeId)
                    };
                }
                
                // Add to target project
                if (project.id === targetProjectId) {
                    let currentEmployees = project.employees || [];
                    let updatedEmployee;

                    if (employeeToMove) {
                        // If moving from another project
                        updatedEmployee = {
                            ...employeeToMove,
                            current_location: 'project',
                            is_highlighted: true
                        };
                    } else {
                        // If moving from union, construct employee object
                        updatedEmployee = {
                            id: employeeId,
                            employee_id: employeeId,
                            current_location: 'project',
                            is_highlighted: true
                        };
                    }

                    let updatedEmployees;
                    if (insertIndex !== undefined) {
                        // Insert at specific position
                        updatedEmployees = insertEmployeeAtPosition(
                            currentEmployees,
                            updatedEmployee,
                            insertIndex
                        );
                    } else {
                        // Add to end
                        updatedEmployees = [
                            ...currentEmployees,
                            updatedEmployee
                        ].map((emp, index) => ({
                            ...emp,
                            display_order: index
                        }));
                    }

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
            if (!date || !projectId) return state;
            
            const currentProjects = state.projectsByDate[date] || [];
            const updatedProjects = currentProjects.map(project => {
                if (project.id === projectId) {
                    // Find the project being updated
                    const currentEmployees = project.employees || [];
                    
                    // Create a map of current employees for quick lookup
                    const employeeMap = {};
                    currentEmployees.forEach(emp => {
                        employeeMap[emp.id] = emp;
                    });
        
                    // Map the ordered IDs to full employee objects with updated display order
                    const updatedEmployees = orderedEmployeeIds.map((empId, index) => {
                        const employee = employeeMap[empId];
                        if (!employee) return null;
                        return {
                            ...employee,
                            display_order: index
                        };
                    }).filter(Boolean); // Remove any null values
        
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
            
            // Move the project
            const [movedProject] = currentProjects.splice(sourceIndex, 1);
            currentProjects.splice(targetIndex, 0, movedProject);
            
            // Update display_order for all projects
            const updatedProjects = currentProjects.map((project, index) => ({
                ...project,
                display_order: index
            }));

            // Sort the projects to ensure correct order
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
            
            console.log('Updating rain day status:', { jobId, isRainDay, date });
        
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