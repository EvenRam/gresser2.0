const projectReducer = (state = [], action) => {

        switch (action.type) {
          case 'SET_JOB':
            return action.payload;
      
          case 'SET_PROJECTS_WITH_EMPLOYEES':
            return action.payload.map(project => ({
              ...project,
              employees: project.employees || []
            }));
      
          default:
            return state;
        }
      };
      
        
  
  export default projectReducer