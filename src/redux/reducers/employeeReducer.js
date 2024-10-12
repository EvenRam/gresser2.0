const initialState = {
    unionEmployees: [], // Employees in the union box
    projectEmployees: [] // Employees in the project box
};

const employeeReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_EMPLOYEE_INFO':
            return { ...state, unionEmployees: action.payload }; // Set union employees

        case 'ADD_EMPLOYEE':  // New action for adding an employee
            const newEmployee = action.payload;
            return {
                ...state,
                unionEmployees: [...state.unionEmployees, newEmployee], // Add the new employee
            };

        case 'MOVE_EMPLOYEE':
            const { employeeId, targetProjectId, targetUnionId } = action.payload;
            const movingEmployee = state.unionEmployees.find(emp => emp.id === employeeId);

            return {
                ...state,
                unionEmployees: state.unionEmployees.filter(emp => emp.id !== employeeId),
                projectEmployees: targetProjectId 
                    ? [...state.projectEmployees, { ...movingEmployee, current_location: 'project' }] // Update current location
                    : state.projectEmployees
            };
        
        default:
            return state;
    }
};


export default employeeReducer;
