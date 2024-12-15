const initialState = {
    selectedDate: new Date().toISOString().split('T')[0],
    employeesByDate: {},
    isEditable: true,
    error: null,
    loading: false
};

function scheduleReducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_SELECTED_DATE': {
            const newDate = action.payload;
            const today = new Date().toISOString().split('T')[0];
            
            return {
                ...state,
                selectedDate: newDate,
                isEditable: newDate <= today,
                error: null
            };
        }

        case 'SET_EMPLOYEES': {
            const { date, employees } = action.payload;
            if (!date || !Array.isArray(employees)) {
                console.warn('Invalid payload for SET_EMPLOYEES:', action.payload);
                return state;
            }

            return {
                ...state,
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: employees
                },
                error: null
            };
        }

        case 'FETCH_ERROR': {
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        }

        case 'CLEAR_SCHEDULE_ERROR': {
            return {
                ...state,
                error: null
            };
        }

        case 'SET_LOADING': {
            return {
                ...state,
                loading: action.payload
            };
        }

        case 'CLEAR_SCHEDULE_STATE': {
            return {
                ...initialState,
                selectedDate: state.selectedDate // Preserve the selected date
            };
        }

        case 'RESET_SCHEDULE_STATE': {
            return initialState;
        }

        default:
            return state;
    }
}

export default scheduleReducer;