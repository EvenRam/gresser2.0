const initialState = {
  employees: [],
  highlightedEmployees: {}
};

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_EMPLOYEE_INFO': {
      // Convert the highlighted status from the database into our state format
      const highlightedEmployees = action.payload.reduce((acc, emp) => {
        if (emp.is_highlighted) {
          acc[emp.id] = true;
        }
        return acc;
      }, {});
      
      return { 
        ...state, 
        employees: action.payload,
        highlightedEmployees
      };
    }

    case 'MOVE_EMPLOYEE': {
      const { employeeId, targetProjectId, targetUnionId } = action.payload;

      const updatedEmployees = state.employees.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            current_location: targetProjectId ? 'project' : 'union',
            job_id: targetProjectId || null,
            union_id: targetUnionId || emp.union_id,
            display_order: null // Reset display_order when moving to new project
          };
        }
        return emp;
      });

      return { ...state, employees: updatedEmployees };
    }

    case 'UPDATE_EMPLOYEE_ORDER': {
      const { projectId, employees } = action.payload;
      
      const updatedEmployees = state.employees.map(emp => {
        const updatedEmployee = employees.find(e => e.id === emp.id);
        if (updatedEmployee && emp.job_id === projectId) {
          return {
            ...emp,
            display_order: updatedEmployee.display_order
          };
        }
        return emp;
      });

      return { ...state, employees: updatedEmployees };
    }

    case 'SET_HIGHLIGHTED_EMPLOYEE': {
      const { id, isHighlighted } = action.payload;
      
      // Make API call to update the database
      fetch(`/api/addemployee/${id}/highlight`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHighlighted }),
        credentials: 'include' // Important for handling authentication
      }).catch(error => {
        console.error('Error updating highlight status:', error);
      });

      // Update local state
      const newHighlightedEmployees = {
        ...state.highlightedEmployees,
        [id]: isHighlighted
      };

      // If highlighted is false, remove the key entirely
      if (!isHighlighted) {
        delete newHighlightedEmployees[id];
      }

      return {
        ...state,
        highlightedEmployees: newHighlightedEmployees,
        employees: state.employees.map(emp => {
          if (emp.id === id) {
            return {
              ...emp,
              is_highlighted: isHighlighted
            };
          }
          return emp;
        })
      };
    }

    case 'CLEAR_HIGHLIGHTED_EMPLOYEES': {
      // Optionally add this case if you want to clear all highlights
      return {
        ...state,
        highlightedEmployees: {},
        employees: state.employees.map(emp => ({
          ...emp,
          is_highlighted: false
        }))
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