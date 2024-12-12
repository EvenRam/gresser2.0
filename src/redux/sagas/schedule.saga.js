
import { takeLatest, call, put } from "redux-saga/effects";
import axios from 'axios';

// Fetch employees for a specific date
function* fetchEmployees(action) {
  try {
      const date = action.payload?.date || new Date().toISOString().split('T')[0];
      console.log("Fetching employees for date:", date);

      const response = yield call(
          axios.get, 
          `/api/schedule/employees/${date}`
      );

      console.log("Fetched employees:", response.data);

      yield put({
          type: 'SET_EMPLOYEES',
          payload: {
              date: response.data.date,
              employees: response.data.employees
          }
      });
  } catch (error) {
      console.error('Error fetching employees:', error);
      yield put({ 
          type: 'FETCH_ERROR', 
          payload: 'Failed to fetch employees' 
      });
  }
}

// Fetch unions with employees for a specific date
function* fetchUnionsWithEmployees(action) {
  try {
      // Ensure we have a valid date string
      const date = typeof action.payload === 'string' 
          ? action.payload 
          : new Date().toISOString().split('T')[0];

      console.log('Fetching unions with employees for date:', date);

      const response = yield call(
          axios.get, 
          `/api/schedule/withunions/${date}`
      );

      yield put({ 
          type: 'SET_EMPLOYEE_WITH_UNION', 
          payload: response.data 
      });
  } catch (error) {
      console.error('Error fetching unions with employees:', error);
      yield put({ 
          type: 'FETCH_ERROR', 
          payload: error.message 
      });
  }
}
// Modify fetchProjectsWithEmployees in schedule.saga.js
function* fetchProjectsWithEmployees(action) {
  try {
      const date = action.payload?.date || new Date().toISOString().split('T')[0];
      console.log("Fetching projects with employees for date:", date);

      const response = yield call(
          axios.get, 
          `/api/project/withEmployees/${date}`
      );

      // Update this part to match your backend response
      yield put({
          type: 'SET_PROJECTS_WITH_EMPLOYEES',
          payload: {
              date,
              jobs: response.data  // Your backend sends the jobs array directly
          }
      });
  } catch (error) {
      console.error('Error fetching projects with employees:', error);
      yield put({ 
          type: 'FETCH_ERROR', 
          payload: error.message 
      });
  }
}

// Add new employee with schedule
function* addEmployeeSchedule(action) {
  try {
      console.log('Adding employee schedule:', action.payload);

      const response = yield call(
          axios.post, 
          '/api/schedule', 
          action.payload
      );

      console.log("Add employee response:", response.data);

      // Refresh all data for the date
      yield put({ 
          type: 'FETCH_EMPLOYEES', 
          payload: { date: action.payload.selected_date } 
      });
      yield put({ 
          type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
          payload: { date: action.payload.selected_date } 
      });
      yield put({ 
          type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
          payload: { date: action.payload.selected_date } 
      });
  } catch (error) {
      console.error('Error adding employee schedule:', error);
      yield put({ 
          type: 'ADD_EMPLOYEE_FAILED', 
          payload: error.response?.data || 'Failed to add employee schedule' 
      });
  }
}

// Handle moving employee between projects/unions
function* handleMoveEmployee(action) {
  try {
      const { employeeId, targetProjectId, sourceUnionId, date } = action.payload;
      console.log("Moving employee:", action.payload);

      yield call(
          axios.post, 
          '/api/schedule/move',
          { employeeId, targetProjectId, date }
      );

      // Refresh all data for the date
      yield put({ 
          type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
          payload: { date } 
      });
      yield put({ 
          type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
          payload: { date } 
      });
  } catch (error) {
      console.error('Error moving employee:', error);
      yield put({ 
          type: 'MOVE_EMPLOYEE_FAILURE', 
          payload: error.response?.data || 'Failed to move employee' 
      });
  }
}

// Handle updating employee highlight status
function* updateEmployeeHighlight(action) {
  try {
      const { id, isHighlighted, date } = action.payload;
      console.log("Updating employee highlight:", action.payload);

      yield call(
          axios.put,
          `/api/schedule/${id}/highlight`,
          { isHighlighted, date }
      );

      // No need to refresh all data, the reducer handles the UI update
  } catch (error) {
      console.error('Error updating employee highlight:', error);
      yield put({ 
          type: 'HIGHLIGHT_UPDATE_FAILED', 
          payload: error.response?.data || 'Failed to update highlight status' 
      });
  }
}

export default function* scheduleSaga() {
  yield takeLatest('FETCH_EMPLOYEES', fetchEmployees);
  yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
  yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);
  yield takeLatest('ADD_EMPLOYEE_SCHEDULE', addEmployeeSchedule);
  yield takeLatest('MOVE_EMPLOYEE', handleMoveEmployee);
  yield takeLatest('UPDATE_EMPLOYEE_HIGHLIGHT', updateEmployeeHighlight);
}
