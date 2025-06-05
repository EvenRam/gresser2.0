import { takeLatest, call, put, select, take } from "redux-saga/effects";
import axios from 'axios';

  
  // Fetch jobs from the server and update the redux store 
function* fetchJob() {
    try {
        const jobResponse = yield axios.get('/api/jobs')
        console.log('jobResponse', jobResponse.data)
        //update the store with fetched jobs
        yield put({ type: 'SET_JOB', payload: jobResponse.data })
    } catch (error) {
        console.log('error with the job fetch request, error')
    }
}
//Add a new job and update the store
function* addJob(action) {
    console.log("Inside addJob", action.payload);
    try {
        // Send Post Request
        yield axios.post('/api/jobs', action.payload);
        yield put({
            type: "SET_JOB",
            payload: action.payload  
        });
        // fetch updated job list
        yield put({ type: 'FETCH_JOB'})
    } catch (error) {
        console.log('error with add job post request', error);
    }
}

function* toggleJobStatus(action) {
    try {
        const { job_id, status } = action.payload;
        
        if (!job_id || !status) {
            throw new Error('Job ID and status are required');
        }
        
        console.log('Toggling job status:', { job_id, status });
        
        // Make API call to update the job status
        yield call(
            axios.put,
            `/api/jobs/${job_id}`,
            { status }
        );
        
        // Get current date to refresh schedule data
        const selectedDate = yield select(state => state.scheduleReducer.selectedDate);
        
        // Dispatch success notification
        yield put({
            type: 'SET_SUCCESS_MESSAGE',
            payload: `Project status updated to ${status}`
        });
        
        // Optimistic UI update for job list
        yield put({
            type: 'TOGGLE_JOB_STATUS_OPTIMISTIC',
            payload: { job_id, status }
        });
        
        // Refresh schedule data if we're on the scheduling page
        if (selectedDate) {
            yield put({ 
                type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
                payload: { date: selectedDate } 
            });
            
            yield put({ 
                type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
                payload: { date: selectedDate } 
            });
        }
        
        // Refresh job list
        yield put({ type: 'FETCH_JOBS' });
        
    } catch (error) {
        console.error('Error toggling job status:', error);
        
        yield put({ 
            type: 'PROJECT_ERROR', 
            payload: error.message || 'Failed to update project status' 
        });
    }
}

// Delete a job from the server and update the redux store
function* deleteJob(action){
    try{
        console.log("action.payload.id:",action.payload.jobid);
        yield axios.delete(`/api/jobs/${action.payload.jobid}`);
        yield put({type: "FETCH_JOB"})
    } catch(error){
        console.log("Error with the Job delete request", error)
    }
}

function* jobSaga() {
    yield takeLatest ('FETCH_JOB', fetchJob);
    yield takeLatest ('ADD_JOB', addJob);
    yield takeLatest('TOGGLE_JOB_STATUS', toggleJobStatus)
    yield takeLatest("DELETE_JOB",deleteJob);
  }

export default jobSaga;