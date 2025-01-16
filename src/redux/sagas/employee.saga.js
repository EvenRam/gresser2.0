import { put, takeLatest, call } from 'redux-saga/effects';
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

function* statusToggle(action) {
  try {
    const { id, employee_status } = action.payload;
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
  } catch (error) {
    console.error('Error fetching employee union information:', error);
  }
}

function* updateHighlightState(action) {
  try {
    const { id, isHighlighted, date, projectId } = action.payload;
    console.log('Attempting to update highlight state:', { id, isHighlighted, date, projectId });
    
    const response = yield call(axios.put, `/api/schedule/${date}/${id}/highlight`, {
      isHighlighted,
      projectId
    });
    
    console.log('Server response:', response.data);
    
    // First update local state
    yield put({
      type: 'SET_HIGHLIGHTED_EMPLOYEE',
      payload: action.payload
    });
    
    // Then refresh all data
    yield put({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
    yield put({ type: 'FETCH_EMPLOYEE_INFO' });
    yield put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });
  } catch (error) {
    console.error('Error updating highlight state:', error);
    console.log('Error details:', error.response?.data);
  }
}

function* handleEmployeeMove(action) {
  try {
    const { employeeId, targetProjectId, sourceUnionId } = action.payload;

    // Make API call to move the employee
    yield call(axios.post, '/api/moveemployee', { 
      employeeId, 
      targetProjectId,
      sourceUnionId
    });

    // If moving to a project, set highlight state
    if (targetProjectId) {
      const date = new Date().toISOString().split('T')[0];
      yield put({
        type: 'UPDATE_HIGHLIGHT_STATE',
        payload: {
          id: employeeId,
          isHighlighted: true,
          date,
          projectId: targetProjectId
        }
      });
    }

    // Fetch updated data
    yield put({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
    yield put({ type: 'FETCH_EMPLOYEE_INFO' });
    yield put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });
  } catch (error) {
    console.error('Error moving employee:', error);
    yield put({ type: 'MOVE_EMPLOYEE_FAILURE', error });
  }
}

export default function* rootSaga() {
  yield takeLatest('FETCH_EMPLOYEE_INFO', fetchEmployeeInfo);
  yield takeLatest('ADD_EMPLOYEE_INFO', addEmployeeInfo);
  yield takeLatest('EMPLOYEE_TOGGLE_STATUS', statusToggle);
  yield takeLatest('FETCH_UNION', fetchUnion);
  yield takeLatest('UPDATE_HIGHLIGHT_STATE', updateHighlightState);
  yield takeLatest('MOVE_EMPLOYEE', handleEmployeeMove);
}