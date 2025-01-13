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
    yield call(axios.put, `/api/schedule/${date}/${id}/highlight`, {
      isHighlighted
    });
    
    yield put({ 
      type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
      payload: { date } 
    });
  } catch (error) {
    console.error('Error updating highlight state:', error);
  }
}

function* handleEmployeeMove(action) {
  try {
    const { employeeId, targetProjectId, sourceUnionId } = action.payload;
    const date = new Date().toISOString().split('T')[0];
    
    if (targetProjectId) {
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
  } catch (error) {
    console.error('Error handling employee move:', error);
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