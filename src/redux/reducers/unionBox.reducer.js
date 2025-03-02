const unionBoxReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_WITH_UNION': {
            const { date, unions } = action.payload;
            if (!Array.isArray(unions)) {
                console.warn('Invalid unions data received:', unions);
                return state;
            }
            // Keep array structure but ensure date is attached
            return unions.map(union => ({
                ...union,
                date,
                employees: Array.isArray(union.employees) ? 
                    union.employees.map(emp => ({...emp, date})) : 
                    []
            }));
        }

        case 'MOVE_EMPLOYEE': {
            const { employeeId, targetProjectId, sourceUnionId, targetUnionId, date } = action.payload;
            if (!employeeId || !date) return state;

            // If moving to a project, remove the employee from their union
            if (targetProjectId) {
                return state.map(union => {
                    if (union.id === sourceUnionId) {
                        return {
                            ...union,
                            date,
                            employees: union.employees.filter(emp => emp.id !== employeeId)
                        };
                    }
                    return union;
                });
            }

            // If moving between unions
            if (sourceUnionId && targetUnionId) {
                return state.map(union => {
                    if (union.id === sourceUnionId) {
                        return {
                            ...union,
                            date,
                            employees: union.employees.filter(emp => emp.id !== employeeId)
                        };
                    }
                    if (union.id === targetUnionId) {
                        const employeeToMove = state
                            .find(u => u.id === sourceUnionId)
                            ?.employees.find(emp => emp.id === employeeId);

                        if (employeeToMove) {
                            return {
                                ...union,
                                date,
                                employees: [...union.employees, {...employeeToMove, date}]
                            };
                        }
                    }
                    return union;
                });
            }

            return state;
        }

        default:
            return state;
    }
};

export default unionBoxReducer;