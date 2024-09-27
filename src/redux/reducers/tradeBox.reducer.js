
const tradeBoxReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_UNASSIGNED_EMPLOYEES':
            return action.payload;
        default:
            return state;
    }
};

export default tradeBoxReducer;