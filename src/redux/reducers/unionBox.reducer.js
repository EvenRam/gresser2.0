const unionBoxReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_WITH_UNION':
            console.log('Setting employees with union:', action.payload);
            return action.payload.map(union => ({
                ...union,
                employees: union.employees.filter(emp => emp.employee_status)
            }));
        case 'UPDATE_UNION_EMPLOYEE':
            return state.map(union => {
                if (union.id === action.payload.targetUnionId) {
                    // Add the employee to this union
                    const updatedEmployees = [...(union.employees || [])];
                    const existingIndex = updatedEmployees.findIndex(emp => emp.id === action.payload.employeeId);
                    if (existingIndex !== -1) {
                        updatedEmployees[existingIndex] = action.payload.employee;
                    } else {
                        updatedEmployees.push(action.payload.employee);
                    }
                    return { ...union, employees: updatedEmployees };
                } else if (union.employees) {
                    // Remove the employee from other unions
                    return {
                        ...union,
                        employees: union.employees.filter(emp => emp.id !== action.payload.employeeId)
                    };
                }
                return union;
            });
        default:
            return state;
    }
};

export default unionBoxReducer;