import { put, takeLatest, call } from 'redux-saga/effects';
import axios from 'axios';

function* fetchProjectsWithEmployees(action) {
  try {
    const { date } = action.payload;
    const response = yield call(axios.get, `/api/project/withEmployees?date=${date}`);
    yield put({ type: 'SET_PROJECTS_WITH_EMPLOYEES', payload: response.data });
  } catch (error) {
    console.error('Error fetching projects with employees:', error);
  }
}

export function* projectSaga() {
  yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);
}

export default projectSaga;