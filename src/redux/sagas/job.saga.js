import { put, takeLatest, call } from 'redux-saga/effects';
import axios from 'axios';

// Fetch jobs from the server and update the redux store 
function* fetchJob() {
    try {
        console.log('Fetching jobs...');
        const jobResponse = yield call(axios.get, '/api/jobs');
        console.log('Jobs fetched successfully:', jobResponse.data);
        // update the store with fetched jobs
        yield put({ type: 'SET_JOB', payload: jobResponse.data });
    } catch (error) {
        console.error('Error with the job fetch request:', error);
        yield put({ type: 'SET_ERROR', payload: 'Failed to fetch jobs' });
    }
}

// Add a new job and update the store
function* addJob(action) {
    try {
        console.log("Adding new job:", action.payload);
        // Send Post Request
        const response = yield call(axios.post, '/api/jobs', action.payload);
        console.log("Job added successfully:", response.data);
        // fetch updated job list
        yield put({ type: 'FETCH_JOB' });
    } catch (error) {
        console.error('Error with add job post request:', error);
        yield put({ type: 'SET_ERROR', payload: 'Failed to add job' });
    }
}

function* toggleJobStatus(action) {
    try {
        const { job_id, status } = action.payload;
        console.log(`Toggling job status. Job ID: ${job_id}, New Status: ${status}`);
        const response = yield call(axios.put, `/api/jobs/${job_id}`, { status });
        console.log("Job status updated successfully:", response.data);
        yield put({ type: 'UPDATE_JOB_STATUS', payload: { jobId: job_id, status } });
        yield put({ type: 'FETCH_JOB' });
    } catch (error) {
        console.error('Error toggling job status:', error);
        yield put({ type: 'SET_ERROR', payload: 'Failed to update job status' });
    }
}

// Delete a job from the server and update the redux store
function* deleteJob(action) {
    try {
        console.log("Deleting job. Job ID:", action.payload.jobid);
        yield call(axios.delete, `/api/jobs/${action.payload.jobid}`);
        console.log("Job deleted successfully");
        yield put({ type: "FETCH_JOB" });
    } catch (error) {
        console.error("Error with the Job delete request:", error);
        yield put({ type: 'SET_ERROR', payload: 'Failed to delete job' });
    }
}

function* jobSaga() {
    try {
        yield takeLatest('FETCH_JOB', fetchJob);
        yield takeLatest('ADD_JOB', addJob);
        yield takeLatest('TOGGLE_JOB_STATUS', toggleJobStatus);
        yield takeLatest('DELETE_JOB', deleteJob);
    } catch (error) {
        console.error("Unexpected error in jobSaga:", error);
        yield put({ type: 'SET_ERROR', payload: 'An unexpected error occurred' });
    }
}

export default jobSaga;