const initialState = {
    selectedDate: null,  // Change to null initially
    employeesByDate: {},
    isEditable: true,
    error: null,
    loading: false
};
 
 function scheduleReducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_SELECTED_DATE': {
            const newDate = action.payload;
            console.log('SET_SELECTED_DATE received:', newDate);
            const today = new Date();
            const maxDate = new Date(today);
            maxDate.setDate(maxDate.getDate() + 7);
        
            // Format dates for comparison
            const formattedNewDate = new Date(newDate);
            formattedNewDate.setHours(0, 0, 0, 0);
        
            const formattedToday = new Date(today);
            formattedToday.setHours(0, 0, 0, 0);
        
            // Allow viewing past dates, but only editing today and future dates
            const isViewable = true;  // Allow all dates to be viewable
            const isEditable = formattedNewDate >= formattedToday && formattedNewDate <= maxDate;
        
            return {
                ...state,
                selectedDate: newDate,
                isEditable,
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
 
        // New cases for finalize functionality
        case 'FINALIZE_SCHEDULE_SUCCESS': {
            return {
                ...state,
                selectedDate: action.payload.nextDate,
                error: null
            };
        }
 
        case 'FINALIZE_SCHEDULE_ERROR': {
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        }
 
        default:
            return state;
    }
 }
 
 export default scheduleReducer;