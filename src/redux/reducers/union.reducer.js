// unionReducer.js
const unionReducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_EMPLOYEE_INFO':
      return action.payload;
      case 'SET_UNIONS':
        return [action.payload];
              default:
          return state;
  }
};

export default unionReducer;

  
