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
        console.error('Error fetching schedules:', error);
    
    }
}


// function* fetchUnionsWithEmployees(action) {
//     try {
//       const response = yield call(axios.get, '/api/schedule/withunions', {
//     })

//       console.log("Response for fetchUnionsWithEmployees", action.payload.date);
//       yield put({ type: 'SET_EMPLOYEE_WITH_UNION', payload: response.data });
//         console.log("API response data:", response.data)
//     } catch (error) {
//       console.error('Error fetching unions with employees:', error);
//     }
//   }


export default function* scheduleSaga(){
    yield takeLatest('FETCH_EMPLOYEES', fetchEmployees);
    // yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);

}