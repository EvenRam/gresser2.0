// schedule.saga.js
import { takeLatest, call, put } from "redux-saga/effects";
import axios from 'axios';

// Helper function for default date
const getDefaultDate = () => new Date().toISOString().split('T')[0];

// Fetch employees for a specific date
function* fetchEmployees(action) {
    try {
        const date = action.payload?.date || getDefaultDate();
        console.log("Fetching employees for date:", date);

        const response = yield call(
            axios.get, 
            `/api/schedule/employees/${date}`
        );

        yield put({
            type: 'SET_EMPLOYEES',
            payload: {
                date,
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
        const date = typeof action.payload === 'string' 
            ? action.payload 
            : action.payload?.date || getDefaultDate();

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

function* fetchProjectsWithEmployees(action) {
    try {
        const date = action.payload?.date || getDefaultDate();
        console.log("Fetching projects with employees for date:", date);

        const response = yield call(
            axios.get, 
            `/api/project/withEmployees/${date}`
        );
        console.log("API Response:", response.data);

        yield put({
            type: 'SET_PROJECTS_WITH_EMPLOYEES',
            payload: {
                date,
                jobs: response.data
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

function* addEmployeeSchedule(action) {
  try {
      const { selected_date, ...employeeData } = action.payload;
      const currentDate = selected_date || getDefaultDate();

      console.log('Adding employee schedule:', { ...employeeData, selected_date: currentDate });

      const response = yield call(
          axios.post, 
          '/api/schedule', 
          { ...employeeData, selected_date: currentDate }
      );

      console.log("Add employee response:", response.data);

      // Refresh all data for the date
      yield put({ 
          type: 'FETCH_EMPLOYEES', 
          payload: { date: currentDate } 
      });
      yield put({ 
          type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
          payload: { date: currentDate } 
      });
      yield put({ 
          type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
          payload: { date: currentDate } 
      });
  } catch (error) {
      console.error('Error adding employee schedule:', error);
      yield put({ 
          type: 'ADD_EMPLOYEE_FAILED', 
          payload: error.response?.data || 'Failed to add employee schedule' 
      });
  }
}


function* handleMoveEmployee(action) {
    try {
        const { employeeId, targetProjectId, sourceUnionId, date } = action.payload;
        const currentDate = date || getDefaultDate();

        // Make the API call
        yield call(
            axios.post, 
            `/api/moveemployee/${currentDate}`, 
            { employeeId, targetProjectId }
        );

        // Refresh all data for the current date
        yield put({ 
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
            payload: { date: currentDate } 
        });

        yield put({ 
            type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
            payload: { date: currentDate } 
        });

        // Remove the MOVE_EMPLOYEE dispatch since it's already the action type
        // that triggered this saga

    } catch (error) {
        console.error('Error moving employee:', error);
        yield put({ 
            type: 'MOVE_EMPLOYEE_FAILURE', 
            payload: error.response?.data || 'Failed to move employee' 
        });
    }
}
export default function* scheduleSaga() {
    yield takeLatest('FETCH_EMPLOYEES', fetchEmployees);
    yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
    yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);
    yield takeLatest('ADD_EMPLOYEE_SCHEDULE', addEmployeeSchedule);
    yield takeLatest('MOVE_EMPLOYEE', handleMoveEmployee);
}