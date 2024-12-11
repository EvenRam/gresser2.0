
import { takeLatest, call, put } from "redux-saga/effects";
import axios from 'axios';


function* fetchEmployees(action) {
    try {
        // Make API call to fetch employees for the given date
        const response = yield call(axios.get, '/api/schedule/employees', {
            params: { date: action.payload.date },
        });
        // Log the fetched data for debugging
        console.log("Fetched employees:", response.data);
        // Dispatch the data to the store
        yield put({
            type: 'SET_EMPLOYEES',
            payload: {
                date: response.data.date, // Selected date
                employees: response.data.employees, // List of employees
            },
        });
        // Debugging the API response structure
        console.log("API response data:", response.data);
    } catch (error) {
        console.error('Error fetching employees:', error);
    }
}

function* fetchUnionsWithEmployees(action) {
    try {
      const response = yield call(axios.get, '/api/schedule/withunions', {
    })
      console.log("Response for fetchUnionsWithEmployees", action.payload.date);
      yield put({ type: 'SET_EMPLOYEE_WITH_UNION', payload: response.data });
        console.log("API response data:", response.data)
    } catch (error) {
      console.error('Error fetching unions with employees:', error);
    }
  }
// Saga to fetch projects with employees for a selected date
function* fetchProjectsWithEmployees(action) {
    try {
      // The `action.payload` should include the selected date if provided
      const selectedDate = action.payload?.date || new Date().toISOString().split('T')[0];
  
      // Make a GET request with the selected date as a query parameter
      const response = yield call(axios.get, '/api/project/withEmployees', {
        params: { date: selectedDate }
      });
  
      console.log("Response for fetchProjectsWithEmployees:", response.data);
  
      // Dispatch the results to the reducer with the date and jobs payload
      yield put({
        type: 'SET_PROJECTS_WITH_EMPLOYEES',
        payload: {
          date: response.data.date, // Ensure the date is tracked
          jobs: response.data.jobs // Jobs data with nested employees
        }
      });
    } catch (error) {
      console.error('Error fetching projects with employees:', error);
    }
  }

  function* addEmployeeSchedule(action) {
    try {
        console.log('Payload to server:', action.payload);
        yield call(axios.post, '/api/schedule', action.payload);
        console.log("add employee action.payload:", action.payload);
        // Re-fetch the employees after successful addition
        yield put({ type: 'FETCH_EMPLOYEES', payload: { date: action.payload.selected_date } });
    } catch (error) {
        console.error('Error adding employee information:', error);
        yield put({ type: 'ADD_EMPLOYEE_FAILED', error: error.message });
    }
}
function* handleMoveEmployee(action) {
  try {
    const { employeeId, targetProjectId, sourceUnionId } = action.payload;
    // Make an API call to move the employee
    yield call(axios.post, '/api/moveemployee', { 
      employeeId, 
      targetProjectId,
      sourceUnionId
    });
    // Fetch updated projects and employee information 
    yield put({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' });
    yield put({ type: 'FETCH_EMPLOYEE' });
    yield put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });
  } catch (error) {
    console.error('Error moving employee:', error);
    yield put({ type: 'MOVE_EMPLOYEE_FAILURE', error });
  }
}
export default function* scheduleSaga(){
    yield takeLatest('FETCH_EMPLOYEES', fetchEmployees);
    yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
    yield takeLatest('ADD_EMPLOYEE_SCHEDULE', addEmployeeSchedule);
    yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);  
    yield takeLatest('MOVE_EMPLOYEE', handleMoveEmployee);

}