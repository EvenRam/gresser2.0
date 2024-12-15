const initialState = {
    employeesByDate: {},
    highlightedEmployees: {},
};

const employeeReducer = (state = initialState, action) => {
    console.log('Employee Reducer - Action received:', action.type);

    switch (action.type) {
        case 'SET_EMPLOYEES': {
            const { date, employees } = action.payload;
            console.log('Setting employees for date:', date);
            
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

        case 'INITIALIZE_HIGHLIGHTED_EMPLOYEES': {
            return {
                ...state,
                highlightedEmployees: action.payload
            };
        }

        case 'MOVE_EMPLOYEE': {
            const { employeeId, targetProjectId, targetUnionId, date } = action.payload;
            console.log('Moving employee:', { employeeId, targetProjectId, targetUnionId, date });

            if (!date || !employeeId) {
                console.warn('Missing required data for MOVE_EMPLOYEE:', { employeeId, date });
                return state;
            }

            // Only update the specific date's employees
            const updatedEmployees = state.employeesByDate[date]?.map((emp) => {
                if (emp.id === employeeId) {
                    return {
                        ...emp,
                        current_location: targetProjectId ? 'project' : 'union',
                        job_id: targetProjectId || null,
                        union_id: targetUnionId || emp.union_id,
                        is_highlighted: targetProjectId ? true : false,
                        display_order: null,
                    };
                }
                return emp;
            }) || [];

            return {
                ...state,
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: updatedEmployees
                }
            };
        }

        case 'UPDATE_EMPLOYEE_ORDER': {
            const { projectId, employees, date } = action.payload;
            console.log('Updating employee order:', { projectId, employeeCount: employees?.length, date });

            if (!date || !state.employeesByDate[date] || !Array.isArray(employees)) {
                console.warn('Invalid data for UPDATE_EMPLOYEE_ORDER:', { date, hasEmployees: !!employees });
                return state;
            }

            return {
                ...state,
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: state.employeesByDate[date].map((emp) => {
                        const updatedEmployee = employees.find((e) => e.id === emp.id);
                        if (updatedEmployee && emp.job_id === projectId) {
                            return {
                                ...emp,
                                display_order: updatedEmployee.display_order,
                            };
                        }
                        return emp;
                    }),
                }
            };
        }

        case 'SET_HIGHLIGHTED_EMPLOYEE': {
            const { id, isHighlighted, date } = action.payload;
            console.log('Setting employee highlight:', { id, isHighlighted, date });

            // Update local state
            const newHighlightedEmployees = { ...state.highlightedEmployees };
            if (isHighlighted) {
                newHighlightedEmployees[id] = true;
            } else {
                delete newHighlightedEmployees[id];
            }

            // Update employees for only the specific date
            return {
                ...state,
                highlightedEmployees: newHighlightedEmployees,
                employeesByDate: {
                    ...state.employeesByDate,
                    [date]: state.employeesByDate[date]?.map((emp) => 
                        emp.id === id ? { ...emp, is_highlighted: isHighlighted } : emp
                    ) || []
                }
            };
        }

        case 'CLEAR_HIGHLIGHTED_EMPLOYEES': {
            const updatedEmployeesByDate = {};
            Object.entries(state.employeesByDate).forEach(([date, employees]) => {
                updatedEmployeesByDate[date] = employees.map(emp => ({
                    ...emp,
                    is_highlighted: false
                }));
            });

            return {
                ...state,
                highlightedEmployees: {},
                employeesByDate: updatedEmployeesByDate
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