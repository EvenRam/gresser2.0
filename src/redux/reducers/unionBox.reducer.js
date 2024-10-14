const unionBoxReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_WITH_UNION':
            return action.payload;
        default:
            return state;
    }
};

export default unionBoxReducer;

// const unionBoxReducer = (state = [], action) => {
//     switch (action.type) {
//         case 'SET_EMPLOYEE_WITH_UNION':
//             return action.payload; // Initializes or updates the state with unions and their employees

//         case 'MOVE_EMPLOYEE':
//             const { employeeId, targetUnionId } = action.payload;

//             // Update the unions: remove the employee from the old union and add to the new one
//             return state.map(union => {
//                 if (union.id === targetUnionId) {
//                     // Add employee to the target union
//                     return { ...union, employees: [...union.employees, employeeId] };
//                 } else {
//                     // If it's the union that previously held the employee, remove them
//                     return { ...union, employees: union.employees.filter(emp => emp.id !== employeeId) };
//                 }
//             });

//         default:
//             return state; // Return current state for unhandled actions
//     }
// };

// export default unionBoxReducer;
