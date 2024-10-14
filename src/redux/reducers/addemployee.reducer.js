const addEmployeeReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_INFO':
            return action.payload;
        case 'ADD_EMPLOYEE_INFO':
            return [...state, action.payload];
        case 'EMPLOYEE_TOGGLE_STATUS':
            return state.map(employee =>
                employee.id === action.payload.id
                    ? { ...employee, employee_status: action.payload.employee_status }
                    : employee
            );
        default:
            return state;
    }
};

export default addEmployeeReducer;