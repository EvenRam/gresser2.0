import React, { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const DateSchedule = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const employeesByDate = useSelector((state) => state.scheduleReducer.employeesByDate)
    console.log("Schedule Reducer State:", { selectedDate, employeesByDate });

    const [date, setDate] = useState(selectedDate);



useEffect(() => {
    if (date){
        console.log("Dispatching FETCH_SCHEUDLES with date:", date);
        dispatch({ type: 'FETCH_EMPLOYEES', payload: {date} });
    }
}, [dispatch, date]);

const handleDateChange = (event) => {
    const newDate = event.target.value;
    setDate(newDate);
    console.log("Selected new date:", newDate);
    dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
};


return(
<div className='date-schedule'>
    <input 
    className='date-schedule-input'
    id='date'
    type='date'
    value={date}
    onChange={handleDateChange}
    />



</div>

)

}

export default DateSchedule;