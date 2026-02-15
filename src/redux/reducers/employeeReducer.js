
const initialState = {
    employeesByDate: {},
    highlightedEmployeesByDate: {},
};
const employeeReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_EMPLOYEES': {
            const { date, employees } = action.payload;
            if (!Array.isArray(employees)) {
                console.warn('SET_EMPLOYEES received invalid employees data:', employees);
                return state;
            }
            return {
                ...state,
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: employees
                }
            };
        }
        case 'SET_HIGHLIGHTED_EMPLOYEE': {
            const { id, isHighlighted, date } = action.payload;
            console.log('🔴 SET_HIGHLIGHTED_EMPLOYEE reducer called:', { id, isHighlighted, date });
            
            if (!date || !id) {
                console.warn('Invalid payload for SET_HIGHLIGHTED_EMPLOYEE');
                return state;
            }
        
            const dateHighlights = state.highlightedEmployeesByDate[date] || {};
            const newDateHighlights = {
                ...dateHighlights,
                [id]: isHighlighted
            };
        
            if (!isHighlighted) {
                delete newDateHighlights[id];
            }
            
            console.log('🔴 New highlights for date:', date, newDateHighlights);
        
            return {
                ...state,
                highlightedEmployeesByDate: {
                    ...state.highlightedEmployeesByDate,
                    [date]: newDateHighlights
                },
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: state.employeesByDate[date]?.map((emp) => 
                        emp.id === id ? { ...emp, is_highlighted: isHighlighted } : emp
                    ) || []
                }
            };
        }
        
        // ADD THIS:
case 'SET_HIGHLIGHTED_EMPLOYEES': {
    const { date, highlights } = action.payload;
    
    if (!date || typeof highlights !== 'object') {
        console.warn('Invalid payload for SET_HIGHLIGHTED_EMPLOYEES');
        return state;
    }

    // Get existing highlights for this date
    const existingHighlights = state.highlightedEmployeesByDate[date] || {};
    
    // MERGE new highlights with existing ones
    const mergedHighlights = {
        ...existingHighlights,  // ← Keep what we have
        ...highlights           // ← Add new ones
    };
    
    console.log('✅ MERGING highlights:', { 
        existing: existingHighlights, 
        new: highlights, 
        merged: mergedHighlights 
    });

    return {
        ...state,
        highlightedEmployeesByDate: {
            ...state.highlightedEmployeesByDate,
            [date]: mergedHighlights  // ← Use merged version!
        },
        employeesByDate: {
            ...state.employeesByDate,
            [date]: state.employeesByDate[date]?.map((emp) => ({
                ...emp,
                is_highlighted: !!mergedHighlights[emp.id]
            })) || []
        }
    };
}
        case 'CLEAR_HIGHLIGHTED_EMPLOYEES': {
            const { date } = action.payload;
            if (!date) return state;
            return {
                ...state,
                highlightedEmployeesByDate: {
                    ...state.highlightedEmployeesByDate,
                    [date]: {}
                },
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: state.employeesByDate[date]?.map(emp => ({
                        ...emp,
                        is_highlighted: false
                    })) || []
                }
            };
        }
        case 'RESET_EMPLOYEE_STATE': {
            return initialState;
        }
        default:
            return state;
    }
};
export default employeeReducer;
