const jobReducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_JOB':
      return action.payload;
    case 'SET_PROJECTS_WITH_EMPLOYEES':
      return action.payload;
    case 'UPDATE_JOB_EMPLOYEE':
      return state.map(job => {
        if (job.job_id === action.payload.targetProjectId) {
          // Add the employee to this job
          const updatedEmployees = [...(job.employees || [])];
          const existingIndex = updatedEmployees.findIndex(emp => emp.id === action.payload.employeeId);
          if (existingIndex !== -1) {
            updatedEmployees[existingIndex] = action.payload.employee;
          } else {
            updatedEmployees.push(action.payload.employee);
          }
          return { ...job, employees: updatedEmployees };
        } else if (job.employees) {
          // Remove the employee from other jobs
          return {
            ...job,
            employees: job.employees.filter(emp => emp.id !== action.payload.employeeId)
          };
        }
        return job;
      });
    default:
      return state;
  }
};

export default jobReducer;