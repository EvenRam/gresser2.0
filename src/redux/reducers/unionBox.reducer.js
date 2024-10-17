// this reducer is responsible for all active employees in the union box.


const unionBoxReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_WITH_UNION':
            return action.payload;
        default:
            return state;
    }
};

export default unionBoxReducer;


