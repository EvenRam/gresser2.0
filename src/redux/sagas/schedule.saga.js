import { put, takeLatest, call } from 'redux-saga/effects';
import axios from 'axios';

function* fetchScheduleByDate(action) {
    try {
        // Fetch projects with employees for the selected date
        const response = yield axios.get('/api/project/withEmployees', {
            params: { date: action.payload.date }
        });
        
        yield put({ 
            type: 'SET_PROJECTS_WITH_EMPLOYEES',
            payload: response.data
        });

        // Check if date is finalized
        const finalizedResponse = yield axios.get(`/api/project/finalized/${action.payload.date}`);
        yield put({
            type: 'SET_SCHEDULE_FINALIZED',
            payload: {
                date: action.payload.date,
                isFinalized: finalizedResponse.data.isFinalized
            }
        });
    } catch (error) {
        console.error('Error fetching schedule:', error);
    }
}

function* toggleRainDay(action) {
    try {
        yield axios.post('/api/project/rainday', {
            jobId: action.payload.jobId,
            date: action.payload.date
        });

        // Refetch projects to get updated rain day status
        yield put({ 
            type: 'FETCH_SCHEDULE_BY_DATE',
            payload: { date: action.payload.date }
        });
    } catch (error) {
        console.error('Error toggling rain day:', error);
    }
}

function* finalizeSchedule(action) {
    try {
        yield axios.post('/api/project/finalize', {
            date: action.payload.date
        });

        // Refetch projects to get updated finalization status
        yield put({ 
            type: 'FETCH_SCHEDULE_BY_DATE',
            payload: { date: action.payload.date }
        });
    } catch (error) {
        console.error('Error finalizing schedule:', error);
    }
}

function* scheduleSaga() {
    yield takeLatest('FETCH_SCHEDULE_BY_DATE', fetchScheduleByDate);
    yield takeLatest('TOGGLE_RAIN_DAY', toggleRainDay);
    yield takeLatest('FINALIZE_SCHEDULE', finalizeSchedule);
}

export default scheduleSaga;