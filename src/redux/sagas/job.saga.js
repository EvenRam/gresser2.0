import { put, takeLatest } from 'redux-saga/effects';
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

function* toggleJobStatus(action){
    try {
        console.log("action paylod job status",action.payload)
        const {status} = action.payload;
        console.log("action paylod job status",action.payload)

        yield axios.put(`/api/jobs/${action.payload.job_id}`, {status});
        yield put ({
            type:'FETCH_JOB'
        });
    } catch(error){
        console.log('error toggliing job status,error',error);
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