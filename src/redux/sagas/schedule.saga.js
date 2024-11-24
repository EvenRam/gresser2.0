import { takeLatest, call, put } from "redux-saga/effects";
import axios from 'axios';

function* fetchEmployees(action){
    try{
        const response = yield call (axios.get, '/api/schedule/employees', {
            params: {date: action.payload.date}
        })
        console.log("Fetched employees:", response.data);
        yield put ({ type: 'SET_EMPLOYEES', payload: response.data});
        console.log("API response data:", response.data)

    } catch(error){
        console.error('Error fetching :', error);
    
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

// function* fetchUnionsWithEmployees(action) {
//     try {
//       const response = yield call(axios.get, '/api/schedule/withunions', {
//         params: { date: action.payload.date }
//     })
//       console.log("Response for fetchUnionsWithEmployees", action.payload.date);
//       yield put({ type: 'SET_EMPLOYEE_WITH_UNION', payload: response.data });
//         console.log("API response data:", response.data)
//     } catch (error) {
//       console.error('Error fetching unions with employees:', error);
//       yield put({ type: 'FETCH_UNIONS_FAILED', error: error.message });
//     }
//   }


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



export default function* scheduleSaga(){
    yield takeLatest('FETCH_EMPLOYEES', fetchEmployees);
    yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
    yield takeLatest('ADD_EMPLOYEE_SCHEDULE', addEmployeeSchedule)

}