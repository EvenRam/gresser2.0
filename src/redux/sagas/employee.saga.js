import { put, takeLatest, call } from 'redux-saga/effects';
import axios from 'axios';

function* fetchEmployeeInfo() {
  try {
    const response = yield call(axios.get, '/api/addemployee');
    yield put({ type: 'SET_EMPLOYEE_INFO', payload: response.data });
  } catch (error) {
    console.error('Error fetching employee information:', error);
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
    const response = yield call(axios.get, '/api/addemployee/employeecard?status=active');
    console.log('Fetched active employees:', response.data);
    yield put({ type: 'SET_EMPLOYEE_CARD', payload: response.data });
  } catch (error) {
    console.error('Error fetching employee card:', error);
  }
}

function* fetchProjectsWithEmployees() {
  try {
    const response = yield call(axios.get, '/api/project/withEmployees');
    console.log("Response for fetchProjectsWithEmployees", response.data);
    yield put({ type: 'SET_PROJECTS_WITH_EMPLOYEES', payload: response.data });
  } catch (error) {
    console.error('Error fetching projects with employees:', error);
  }
}

function* handleMoveEmployee(action) {
  try {
    const { employeeId, targetProjectId, targetUnionId } = action.payload;
    yield call(axios.post, '/api/moveEmployee', { 
      employeeId, 
      targetProjectId, 
      targetUnionId 
    });
    yield put({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
    yield put({ type: 'FETCH_EMPLOYEE_CARD' });
    yield put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });
  } catch (error) {
    console.error('Error moving employee:', error);
  }
}

function* statusToggle(action) {
  try {
    const { id, employee_status } = action.payload;
    yield call(axios.put, `/api/addemployee/${id}`, { employee_status });
    yield put({ type: 'EMPLOYEE_TOGGLE_STATUS', payload: { id, employee_status } });
    yield put({ type: 'FETCH_EMPLOYEE_INFO' });
    yield put({ type: 'FETCH_EMPLOYEE_CARD' });
    yield put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });
  } catch (error) {
    console.error("Error toggling employee status:", error);
  }
}

function* fetchEmployeeUnion() {
  try {
    const response = yield call(axios.get, '/api/addemployee/union');
    yield put({ type: 'SET_EMPLOYEE_UNION', payload: response.data });
  } catch (error) {
    console.error('Error fetching employee union information:', error);
  }
}

function* fetchUnionsWithEmployees() {
  try {
    const response = yield call(axios.get, '/api/addemployee/withunions');
    console.log("Response for fetchUnionsWithEmployees", response.data);
    const activeEmployeesUnions = response.data.map(union => ({
      ...union,
      employees: union.employees.filter(emp => emp.employee_status)
    }));
    yield put({ type: 'SET_EMPLOYEE_WITH_UNION', payload: activeEmployeesUnions });
  } catch (error) {
    console.error('Error fetching unions with employees:', error);
  }
}

function* employeeSaga() {
  yield takeLatest('FETCH_EMPLOYEE_INFO', fetchEmployeeInfo);
  yield takeLatest('ADD_EMPLOYEE_INFO', addEmployeeInfo);
  yield takeLatest('FETCH_EMPLOYEE_CARD', fetchEmployeeCard);
  yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);
  yield takeLatest('MOVE_EMPLOYEE', handleMoveEmployee);
  yield takeLatest('EMPLOYEE_TOGGLE_STATUS', statusToggle);
  yield takeLatest('FETCH_EMPLOYEE_UNION', fetchEmployeeUnion);
  yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
}

export default employeeSaga;