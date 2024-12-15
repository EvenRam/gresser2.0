import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const DateSchedule = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const today = new Date().toISOString().split('T')[0];
    
    // Only initialize date state once when component mounts
    const [date, setDate] = useState(selectedDate || today);

    // Check if date is in the future
    const isDateInFuture = (dateStr) => {
        const inputDate = new Date(dateStr);
        inputDate.setHours(0, 0, 0, 0);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        return inputDate > currentDate;
    };

    // Initialize with today's date when component mounts
    useEffect(() => {
        if (!selectedDate) {
            dispatch({ type: 'SET_SELECTED_DATE', payload: today });
        }
    }, [dispatch, selectedDate, today]);

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        
        // Prevent selecting future dates
        if (isDateInFuture(newDate)) {
            alert("Cannot select future dates");
            return;
        }

        setDate(newDate);
        dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });

        // Fetch data for the new date
        dispatch({ 
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
            payload: { date: newDate } 
        });
        dispatch({ 
            type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
            payload: newDate 
        });
        dispatch({ 
            type: 'FETCH_EMPLOYEES', 
            payload: { date: newDate } 
        });
    };

    return (
        <div className='date-schedule'>
            <input 
                className='date-schedule-input'
                id='date'
                type='date'
                value={date}
                onChange={handleDateChange}
                max={today} // Prevent selecting future dates in the datepicker
            />
        </div>
    );
};

export default DateSchedule;