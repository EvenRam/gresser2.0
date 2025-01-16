import { put, takeLatest, call } from 'redux-saga/effects';
import axios from 'axios';

function* fetchEmployeeInfo() {
  try {
    const response = yield call(axios.get, '/api/addemployee');
    console.log('Fetched employee info:', response.data);
    yield put({ type: 'SET_EMPLOYEE_INFO', payload: response.data });
    console.log('Fetched employee response.data:', response.data);

  } catch (error) {
    console.error('Error fetching employee information:', error);
    yield put({ type: 'FETCH_ERROR', payload: 'Failed to fetch employee information.' });
  }
}
function* addEmployeeInfo(action) {
  try {
    console.log('Payload to server:', action.payload); 
    yield call(axios.post, '/api/addemployee', action.payload);
    console.log("add employee actiopn.payload:", action.payload)
    yield put({ type: 'FETCH_EMPLOYEE_INFO' });
  } catch (error) {
    console.error('Error adding employee information:', error);
  }
}



function* statusToggle(action) {
  try {
    console.log("action.payload", action.payload);
    const { id, employee_status } = action.payload;
    console.log("Toggling employee status:", employee_status, "for employee ID:", id);
    yield call(axios.put, `/api/addemployee/${id}`, { employee_status });
    yield put({ type: 'FETCH_EMPLOYEE_INFO' });
  } catch (error) {
    console.error("Error toggling employee status:", error);
  }
}

function* fetchUnion() {
  try {
    const response = yield call(axios.get, '/api/addemployee/union');
    yield put({ type: 'SET_UNIONS', payload: response.data });
    console.log("fetch union payload", response.data);
  } catch (error) {
    console.error('Error fetching employee union information:', error);
  }
}



export default function* rootSaga() {
  yield takeLatest('FETCH_EMPLOYEE_INFO', fetchEmployeeInfo);
  yield takeLatest('ADD_EMPLOYEE_INFO', addEmployeeInfo);
  yield takeLatest('EMPLOYEE_TOGGLE_STATUS', statusToggle);
  yield takeLatest('FETCH_UNION', fetchUnion);
}