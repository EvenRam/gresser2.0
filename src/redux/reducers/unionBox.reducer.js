// this reducer is responsible for all active employees in the union box.


const unionBoxReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_WITH_UNION':
            return action.payload;

        case 'MOVE_EMPLOYEE':
            const { employeeId, targetProjectId, sourceUnionId, targetUnionId } = action.payload;

            // If moving to a project, remove the employee from their union
            if (targetProjectId) {
                return state.map(union => {
                    if (union.id === sourceUnionId) {
                        return {
                            ...union,
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
                        // Remove employee from source union
                        return {
                            ...union,
                            employees: union.employees.filter(emp => emp.id !== employeeId)
                        };
                    }
                    if (union.id === targetUnionId) {
                        // Add employee to target union
                        const employeeToMove = state
                            .find(u => u.id === sourceUnionId)
                            ?.employees.find(emp => emp.id === employeeId);

                        if (employeeToMove) {
                            return {
                                ...union,
                                employees: [...union.employees, employeeToMove]
                            };
                        }
                    }
                    return union;
                });
            }

            // If neither moving to a project nor between unions, return state unchanged
            return state;

        default:
            return state;
    }
};

export default unionBoxReducer;

