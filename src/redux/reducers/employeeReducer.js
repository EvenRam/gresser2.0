const initialState = {
  employeesByDate: {},
  highlightedEmployees: {},
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
    case 'INITIALIZE_HIGHLIGHTED_EMPLOYEES': {
      return {
        ...state,
        highlightedEmployees: action.payload
      };
    }
    case 'MOVE_EMPLOYEE': {
      const { employeeId, targetProjectId, targetUnionId, date } = action.payload;
      const updatedEmployeesByDate = { ...state.employeesByDate };
      for (const dateKey in updatedEmployeesByDate) {
        if (updatedEmployeesByDate[dateKey]) {
          updatedEmployeesByDate[dateKey] = updatedEmployeesByDate[dateKey].map((emp) => {
            if (emp.id === employeeId) {
              return {
                ...emp,
                current_location: targetProjectId ? 'project' : 'union',
                job_id: targetProjectId || null,
                union_id: targetUnionId || emp.union_id,
                display_order: null,
              };
            }
            return emp;
          });
        }
      }
      return { 
        ...state, 
        employeesByDate: updatedEmployeesByDate 
      };
    }
    case 'UPDATE_EMPLOYEE_ORDER': {
      const { projectId, employees, date } = action.payload;
      if (!date || !state.employeesByDate[date]) {
        return state;
      }
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
        credentials: 'include',
      }).catch((error) => {
        console.error('Error updating highlight status:', error);
      });
      const newHighlightedEmployees = { ...state.highlightedEmployees };
      if (isHighlighted) {
        newHighlightedEmployees[id] = true;
      } else {
        delete newHighlightedEmployees[id];
      }
      const updatedEmployeesByDate = { ...state.employeesByDate };
      for (const date in updatedEmployeesByDate) {
        if (updatedEmployeesByDate[date]) {
          updatedEmployeesByDate[date] = updatedEmployeesByDate[date].map((emp) => {
            if (emp.id === id) {
              return { ...emp, is_highlighted: isHighlighted };
            }
            return emp;
          });
        }
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
        if (clearedEmployeesByDate[date]) {
          clearedEmployeesByDate[date] = clearedEmployeesByDate[date].map((emp) => ({
            ...emp,
            is_highlighted: false,
          }));
        }
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



