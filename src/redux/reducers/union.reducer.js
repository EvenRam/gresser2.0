// unionReducer.js
const unionReducer = (state = [], action) => {
  switch (action.type) {
      case 'SET_UNIONS':
          return action.payload;  // Store all unions in Redux state
      default:
          return state;
  }
};

export default unionReducer;

  
