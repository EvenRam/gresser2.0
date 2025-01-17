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

        case 'SET_HIGHLIGHTED_EMPLOYEES': {
            const { date, highlights } = action.payload;
            if (!date) return state;

            return {
                ...state,
                highlightedEmployeesByDate: {
                    ...state.highlightedEmployeesByDate,
                    [date]: highlights
                }
            };
        }

        case 'SET_HIGHLIGHTED_EMPLOYEE': {
            const { id, isHighlighted, date } = action.payload;
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

        case 'MOVE_EMPLOYEE': {
            const { employeeId, targetProjectId, sourceUnionId } = action.payload;
            const date = new Date().toISOString().split('T')[0];
            
            if (targetProjectId) {
                return {
                    ...state,
                    employeesByDate: {
                        ...state.employeesByDate,
                        [date]: state.employeesByDate[date]?.map((emp) =>
                            emp.id === employeeId ? { ...emp, is_highlighted: true } : emp
                        ) || []
                    }
                };
            }
            return state;
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