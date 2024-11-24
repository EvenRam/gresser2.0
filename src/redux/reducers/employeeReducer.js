const initialState = {
  employeesByDate: {}, // Store employees keyed by date
  highlightedEmployees: {}, // Store highlighted employees keyed by their IDs
};

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_EMPLOYEES': {
      const { date, employees } = action.payload; // Ensure payload contains date and employees

      // Extract highlighted employees from the payload
      const highlightedEmployees = employees.reduce((acc, emp) => {
        if (emp.is_highlighted) {
          acc[emp.id] = true;
        }
        return acc;
      }, {});

      return {
        ...state,
        employeesByDate: {
          ...state.employeesByDate,
          [date]: employees, // Store employees for the specified date
        },
        highlightedEmployees: {
          ...state.highlightedEmployees,
          ...highlightedEmployees, // Merge highlighted employees
        },
      };
    }

    case 'MOVE_EMPLOYEE': {
      const { employeeId, targetProjectId, targetUnionId, date } = action.payload;

      const updatedEmployeesByDate = { ...state.employeesByDate };
      for (const date in updatedEmployeesByDate) {
        updatedEmployeesByDate[date] = updatedEmployeesByDate[date].map((emp) => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              current_location: targetProjectId ? 'project' : 'union',
              job_id: targetProjectId || null,
              union_id: targetUnionId || emp.union_id,
              display_order: null, // Reset display_order when moving to a new project
            };
          }
          return emp;
        });
      }

      return { ...state, employeesByDate: updatedEmployeesByDate };
    }

    case 'UPDATE_EMPLOYEE_ORDER': {
      const { projectId, employees, date } = action.payload;

      const updatedEmployeesByDate = {
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
      };

      return { ...state, employeesByDate: updatedEmployeesByDate };
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
        credentials: 'include', // Important for handling authentication
      }).catch((error) => {
        console.error('Error updating highlight status:', error);
      });

      // Update local state
      const newHighlightedEmployees = { ...state.highlightedEmployees, [id]: isHighlighted };

      // If highlighted is false, remove the key entirely
      if (!isHighlighted) {
        delete newHighlightedEmployees[id];
      }

      const updatedEmployeesByDate = { ...state.employeesByDate };
      for (const date in updatedEmployeesByDate) {
        updatedEmployeesByDate[date] = updatedEmployeesByDate[date].map((emp) => {
          if (emp.id === id) {
            return { ...emp, is_highlighted: isHighlighted };
          }
          return emp;
        });
      }

      return {
        ...state,
        highlightedEmployees: newHighlightedEmployees,
        employeesByDate: updatedEmployeesByDate,
      };
    }

    case 'CLEAR_HIGHLIGHTED_EMPLOYEES': {
      const clearedEmployeesByDate = { ...state.employeesByDate };
      for (const date in clearedEmployeesByDate) {
        clearedEmployeesByDate[date] = clearedEmployeesByDate[date].map((emp) => ({
          ...emp,
          is_highlighted: false,
        }));
      }

      return {
        ...state,
        highlightedEmployees: {},
        employeesByDate: clearedEmployeesByDate,
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
