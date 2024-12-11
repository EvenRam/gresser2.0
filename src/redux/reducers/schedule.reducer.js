

const initialState = {
    selectedDate: new Date().toISOString().split('T')[0], // Default to today's date
    employeesByDate: {}, // Object where keys are dates, and values are arrays of employees
  };
  
  function scheduleReducer(state = initialState, action) {
    console.log("Action received in scheduleReducer:", action);
  
    switch (action.type) {
      case 'SET_SELECTED_DATE':
        console.log("Setting selected date:", action.payload);
        return {
          ...state,
          selectedDate: action.payload, // Set the selected date
        };
  
      case 'SET_EMPLOYEES':
        const { date, employees } = action.payload;
        console.log(`Setting employees for date: ${date}`, employees);
        return {
          ...state,
          employeesByDate: {
            ...state.employeesByDate,
            [date]: employees, // Store employees under the specific date
          },
        };
  
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
