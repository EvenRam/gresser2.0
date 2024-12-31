
// addEmployeeReducer: Handles employee data for employee table 



const addEmployeeReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_INFO':
            return action.payload || [];
        case 'ADD_EMPLOYEE_INFO': 
            return [...state, action.payload];
        default:
            return state;
    }
};

export default addEmployeeReducer;