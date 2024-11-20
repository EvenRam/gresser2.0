import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
//import axios from 'axios';

const DateSchedule = () => {
const dispatch = useDispatch();

const schedules = useSelector((state)=> state.scheduleReducer)
console.log("schedule Reducer", schedules)
  let [date, setDate]= useState(() => new Date().toISOString().split('T')[0]);

  console.log("schedules reducer", schedules)


useEffect(() => {
    if (date){
        console.log("Dispatching FETCH_SCHEUDLES with date:", date);
        dispatch({ type: 'FETCH_EMPLOYEES', payload: {date} });
    }
}, [dispatch, date]);



return(
<div className='date-schedule'>
    <input 
    className='date-schedule'
    id='date'
    type='date'
    value={date}
    onChange={(event) => setDate(event.target.value)}
    />



</div>

)

}

export default DateSchedule;