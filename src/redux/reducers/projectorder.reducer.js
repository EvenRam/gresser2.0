const projectOrderReducer = (state = [], action) => {
    switch (action.type) {
      case 'SET_PROJECT_ORDER':
        return action.payload;
      case 'UPDATE_PROJECT_ORDER':
        return action.payload;
      default:
        return state;
    }
  };
  
  export default projectOrderReducer;