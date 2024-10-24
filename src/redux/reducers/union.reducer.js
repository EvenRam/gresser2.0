// unionReducer.js
const unionReducer = (state = [], action) => {
  switch (action.type) {

      case 'SET_UNIONS':
          return action.payload;  
      default:
          return state;
  }
};

export default unionReducer;

  
