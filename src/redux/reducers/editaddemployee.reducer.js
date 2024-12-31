const initialState = {
    first_name: '',
    last_name: '',
    employee_number: '',
    union_id: '',
    union_name: '',
    employee_status: 0,
    phone_number: '',
    email: '',
    address: ''
};

const editEmployeeReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_EDIT_EMPLOYEE':
            return { 
                ...initialState, 
                ...action.payload 
            };
        case 'EDIT_ONCHANGE':
            return {
                ...state,
                [action.payload.property]: action.payload.value || ''
            };
        case 'UPDATE_UNION':
            return {
                ...state,
                union_id: action.payload.union_id || '',
                union_name: action.payload.union_name || ''
            };
        case 'EDIT_CLEAR':
            return initialState;
        default:
            return state;
    }
};
export default editEmployeeReducer;
