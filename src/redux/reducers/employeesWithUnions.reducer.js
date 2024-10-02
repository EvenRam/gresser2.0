const employeesWithUnionsReducer = (state = [], action) => {
    switch (action.type) {
      case 'SET_EMPLOYEES_WITH_UNIONS':
        return action.payload;
      default:
        return state;
    }
  };
  
  export default employeesWithUnionsReducer;