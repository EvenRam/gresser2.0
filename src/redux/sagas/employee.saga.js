import { put, takeLatest, call, select } from 'redux-saga/effects';
import axios from 'axios';

function* fetchEmployeeInfo() {
  try {
    const response = yield call(axios.get, '/api/addemployee');
    console.log('Fetched employee info:', response.data);
    yield put({ type: 'SET_EMPLOYEE_INFO', payload: response.data });
  } catch (error) {
    console.error('Error fetching employee information:', error);
    yield put({ type: 'FETCH_ERROR', payload: 'Failed to fetch employee information.' });
  }
}

function* addEmployeeInfo(action) {
  try {
    yield call(axios.post, '/api/addemployee', action.payload);
    yield put({ type: 'FETCH_EMPLOYEE_INFO' });
  } catch (error) {
    console.error('Error adding employee information:', error);
  }
}

function* fetchEmployeeCard() {
  try {
    const response = yield call(axios.get, '/api/addemployee/employeecard');
    yield put({ type: 'SET_EMPLOYEE_CARD', payload: response.data });
  } catch (error) {
    console.error('Error fetching employee card information:', error);
  }
}

function* fetchProjectsWithEmployees() {
  try {
    const response = yield call(axios.get, '/api/project/withEmployees');
    console.log("Fetched projects with employees:", response.data);
    yield put({ type: 'SET_PROJECTS_WITH_EMPLOYEES', payload: response.data });
  } catch (error) {
    console.error('Error fetching projects with employees:', error);
    console.log('Projects fetched:', response.data);
    yield put({ type: 'FETCH_PROJECTS_FAILURE', error: error.message });
  }
}

function* handleMoveEmployee(action) {
  try {
    const { employeeId, targetProjectId, sourceUnionId, sourceProjectId } = action.payload;
    console.log('Moving employee:', { employeeId, targetProjectId, sourceUnionId, sourceProjectId });

    yield call(axios.post, '/api/moveemployee', { 
      employeeId, 
      targetProjectId,
      sourceUnionId,
      sourceProjectId
    });

    yield put({ 
      type: 'MOVE_EMPLOYEE_SUCCESS', 
      payload: { employeeId, targetProjectId, sourceProjectId } 
    });

    yield put({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
    yield put({ type: 'FETCH_EMPLOYEE_INFO' });
    yield put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });

    console.log('Employee moved successfully');
  } catch (error) {
    console.error('Error moving employee:', error);
    yield put({ type: 'MOVE_EMPLOYEE_FAILURE', error: error.message });
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

function* fetchEmployeeUnion() {
  try {
    const response = yield call(axios.get, '/api/addemployee/union');
    yield put({ type: 'SET_EMPLOYEE_UNION', payload: response.data });
    yield put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });
  } catch (error) {
    console.error('Error fetching employee union information:', error);
  }
}

function* fetchUnionsWithEmployees() {
  try {
    const response = yield call(axios.get, '/api/addemployee/withunions');
    console.log("Response for fetchUnionsWithEmployees", response.data);
    yield put({ type: 'SET_EMPLOYEE_WITH_UNION', payload: response.data });
  } catch (error) {
    console.error('Error fetching unions with employees:', error);
  }
}

export default function* rootSaga() {
  yield takeLatest('FETCH_EMPLOYEE_INFO', fetchEmployeeInfo);
  yield takeLatest('ADD_EMPLOYEE_INFO', addEmployeeInfo);
  yield takeLatest('FETCH_EMPLOYEE_CARD', fetchEmployeeCard);
  yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);
  yield takeLatest('MOVE_EMPLOYEE', handleMoveEmployee);
  yield takeLatest('EMPLOYEE_TOGGLE_STATUS', statusToggle);
  yield takeLatest('FETCH_EMPLOYEE_UNION', fetchEmployeeUnion);
  yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
}