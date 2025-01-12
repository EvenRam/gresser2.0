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
    console.log("add employee action.payload:", action.payload);
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

function* updateHighlightState(action) {
  try {
    const { id, isHighlighted, date } = action.payload;
    
    // Use the existing schedule route for highlight updates
    yield call(axios.put, `/api/schedule/${date}/${id}/highlight`, {
      isHighlighted
    });
    
    yield put({ type: 'SET_HIGHLIGHTED_EMPLOYEE', payload: { id, isHighlighted, date } });
    yield put({ type: 'FETCH_EMPLOYEES' });
  } catch (error) {
    console.error('Error updating highlight state:', error);
  }
}

function* handleEmployeeMove(action) {
  try {
    const { employeeId, targetProjectId, sourceUnionId } = action.payload;
    const date = new Date().toISOString().split('T')[0];
    
    // If moving from union to project or between projects, highlight the employee
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