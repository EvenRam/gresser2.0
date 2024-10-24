const initialState = {
    first_name: '',
    last_name: '',
    employee_number: '',
    union_id: '',
    union_name: "",
    employee_status: 0,
    phone_number: '',
    email: '',
    address: ''
};

const editEmployeeReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_EDIT_EMPLOYEE':
            // Set the state to the payload, which should be the employee being edited
            return { ...state, ...action.payload }; // Merge with existing state
        case 'EDIT_ONCHANGE':
            // Update a specific property in the state
            return {
                ...state,
                [action.payload.property]: action.payload.value
            };
        case 'EDIT_UNION':
            // Update union_id specifically
            return {
                ...state,
                union_id: action.payload.union_id // Ensure union_id is updated
            };
        case 'EDIT_CLEAR':
            return initialState;
        default:
            return state;
    }
};

export default editEmployeeReducer;
