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

// Improved helper function for inserting employee at specific position
const insertEmployeeAtPosition = (employees, employeeToMove, dropIndex) => {
    // Remove employee if they already exist in the array
    const existingEmployees = employees.filter(emp => emp.id !== employeeToMove.id);
    
    // Create new array with employee inserted at correct position
    const newEmployees = [
        ...existingEmployees.slice(0, dropIndex),
        { ...employeeToMove, display_order: dropIndex },
        ...existingEmployees.slice(dropIndex)
    ];

    // Update all display orders sequentially
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
            const { employeeId, targetProjectId, sourceLocation, dropIndex, date } = action.payload;
            if (!date) {
                console.warn('No date provided for MOVE_EMPLOYEE action');
                return state;
            }
            
            console.log('Moving employee in reducer:', { 
                employeeId, 
                targetProjectId, 
                sourceLocation,
                dropIndex, 
                date 
            });
            
            const currentProjects = state.projectsByDate[date] || [];
            
            // Find source project if moving from project
            const sourceProject = sourceLocation?.type === 'project' 
                ? currentProjects.find(p => p.id === sourceLocation.id)
                : findProjectWithEmployee(currentProjects, employeeId);
            
            // Get employee to move
            const employeeToMove = sourceProject?.employees?.find(emp => emp.id === employeeId) || 
                { id: employeeId };
        
            // Update projects
            const updatedProjects = currentProjects.map(project => {
                // Remove from source project
                if (project.id === sourceProject?.id) {
                    return {
                        ...project,
                        employees: project.employees.filter(emp => emp.id !== employeeId)
                    };
                }
                
                // Add to target project at specified position
                if (project.id === targetProjectId) {
                    const updatedEmployees = [...(project.employees || [])];
                    
                    // Create updated employee with new location
                    const updatedEmployee = {
                        ...employeeToMove,
                        current_location: 'project',
                        is_highlighted: true,
                        display_order: dropIndex
                    };
                    
                    // If dropIndex is specified, insert at that position
                    if (typeof dropIndex === 'number') {
                        // Make a copy of employees without the current employee
                        const filteredEmployees = updatedEmployees.filter(
                            emp => emp.id !== employeeId
                        );
                        
                        // Insert at specified position
                        filteredEmployees.splice(dropIndex, 0, updatedEmployee);
                        
                        // Update display_order for all employees
                        return {
                            ...project,
                            employees: filteredEmployees.map((emp, index) => ({
                                ...emp,
                                display_order: index
                            }))
                        };
                    } else {
                        // Default to appending
                        return {
                            ...project,
                            employees: [...updatedEmployees, updatedEmployee]
                        };
                    }
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