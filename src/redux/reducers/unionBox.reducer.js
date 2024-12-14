const unionBoxReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_WITH_UNION': {
            const { date, unions } = action.payload;
            return unions.map(union => ({
                ...union,
                date,
            }));
        }

        case 'MOVE_EMPLOYEE': {
            const { employeeId, targetProjectId, sourceUnionId, targetUnionId, date } = action.payload;

            // If moving to a project, remove the employee from their union
            if (targetProjectId) {
                return state.map(union => {
                    if (union.id === sourceUnionId) {
                        return {
                            ...union,
                            employees: union.employees.filter(emp => emp.id !== employeeId),
                            date
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
                            employees: union.employees.filter(emp => emp.id !== employeeId),
                            date
                        };
                    }
                    if (union.id === targetUnionId) {
                        const employeeToMove = state
                            .find(u => u.id === sourceUnionId)
                            ?.employees.find(emp => emp.id === employeeId);

                        if (employeeToMove) {
                            return {
                                ...union,
                                employees: [...union.employees, employeeToMove],
                                date
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