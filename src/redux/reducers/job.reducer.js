const jobReducer = (state = [], action) => {
    switch (action.type) {
        case "SET_JOB":
            const newJob = action.payload;
            console.log("new job", newJob);
            return newJob;
            
        case "TOGGLE_JOB_STATUS_OPTIMISTIC":
            // Update job status optimistically in the UI
            const { job_id, status } = action.payload;
            return state.map(job => 
                job.job_id === job_id 
                    ? { ...job, status }
                    : job
            );
            
        default:
            return state;
    }
};

export default jobReducer;