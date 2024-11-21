const initialState = {
    finalizedDates: {},
    rainDays: {},
    error: null
};

const scheduleReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_SCHEDULE_FINALIZED':
            return {
                ...state,
                finalizedDates: {
                    ...state.finalizedDates,
                    [action.payload.date]: true
                }
            };
            
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload
            };

        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };

        default:
            return state;
    }
};

export default scheduleReducer;