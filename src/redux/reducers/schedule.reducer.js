const initialState = {
    selectedDate: null,  
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
            
            // Get current date in Central Time
            const centralTime = new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago"
            });
            const today = new Date(centralTime);
            today.setHours(12, 0, 0, 0);
            
            
            const maxDate = new Date(today);
            maxDate.setDate(maxDate.getDate() + 7);
            maxDate.setHours(12, 0, 0, 0);
            
            // Convert to strings for comparison
            const maxDateStr = maxDate.toISOString().split('T')[0];
            
            //Editable from 2 days back through 7 days ahead. 
            // Must match PAST_DAYS_EDITABLE in date-validation.middleware.js

            const minDate = new Date(today);
            minDate.setDate(minDate.getDate() - 2);
            minDate.setHours(12,0,0,0);
            const minDateStr = minDate.toISOString().split('T')[0];
            
            const isEditable = newDate >= minDateStr && newDate <= maxDateStr;

        
            return {
                ...state,
                selectedDate: newDate,
                isEditable,
                error: null
            };
            
            console.log('Date comparison:', {
    selectedDate: newDate,
    minDate: minDateStr,
    maxDate: maxDateStr,
    isEditable
});
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
                selectedDate: state.selectedDate 
            };
        }
 
        case 'RESET_SCHEDULE_STATE': {
            return initialState;
        }
 
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