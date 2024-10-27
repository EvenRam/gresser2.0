
const jobReducer = (state = [], action) => {
    if (action.type === "SET_JOB") {
        const newJob = action.payload
        console.log("new job", newJob)
        return newJob
    }
    return state;

}

export default jobReducer;
