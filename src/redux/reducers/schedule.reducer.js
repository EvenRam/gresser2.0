
const initialState = {
    selectedDate: new Date().toISOString().split('T')[0],
    employeesByDate: {},
};

function scheduleReducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_SELECTED_DATE':
            return {
                ...state,
                selectedDate: action.payload,
            };

        case 'SET_EMPLOYEES': {
            const { date, employees } = action.payload;
            return {
                ...state,
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: employees,
                },
            };
        }

        default:
            return state;
    }
}

export default scheduleReducer;

// const initialState = {
//     selectedDate: new Date().toISOString().split('T')[0], // Default to today's date
//     employeesByDate: {}, // Object where keys are dates, and values are arrays of employees
// };

// function scheduleReducer(state = initialState, action) {
//     switch (action.type) {
//         case 'SET_SELECTED_DATE':
//             return {
//                 ...state,
//                 selectedDate: action.payload, // Update selected date
//             };
//         case 'SET_EMPLOYEES':
//             const { date, employees } = action.payload;
//             return {
//                 ...state,
//                 employeesByDate: {
//                     ...state.employeesByDate,
//                     [date]: employees, // Store employees for the specific date
//                 },
//             };
//         default:
//             return state;
//     }
// }

// export default scheduleReducer;
