const jobReducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_JOB':
      const newJob = action.payload;
      console.log('new job', newJob);
      return newJob;

    case 'SET_PROJECTS_WITH_EMPLOYEES':
      // Logging to inspect the payload
      console.log('SET_PROJECTS_WITH_EMPLOYEES payload:', JSON.stringify(action.payload, null, 2));

      // Check if the payload contains projects and employees with union_id
      action.payload.forEach((project) => {
        console.log(`Project: ${project.job_name}`);
        if (project.employees && project.employees.length > 0) {
          project.employees.forEach((employee) => {
            console.log(`Employee: ${employee.first_name} ${employee.last_name}, Union ID: ${employee.union_id}`);
          });
        } else {
          console.log(`No employees assigned to project: ${project.job_name}`);
        }
      });

      return action.payload;

    default:
      return state;
  }
};

export default jobReducer;
