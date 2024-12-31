import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const DateSchedule = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);

    useEffect(() => {
        if (!selectedDate) {
            // Get current date in Central Time
            const centralTime = new Date().toLocaleString("en-US", {
                timeZone: "America/Chicago"
            });
            const now = new Date(centralTime);
            now.setHours(12, 0, 0, 0);
            const todayStr = now.toISOString().split('T')[0];
            
            console.log('Setting initial MN date:', todayStr);
            dispatch({ type: 'SET_SELECTED_DATE', payload: todayStr });
        }
    }, [dispatch, selectedDate]);

    const handleDateChange = (event) => {
        const selectedValue = event.target.value;
        dispatch({ type: 'SET_SELECTED_DATE', payload: selectedValue });
    };

    // Set range based on current MN date
    const centralTime = new Date().toLocaleString("en-US", {
        timeZone: "America/Chicago"
    });
    const today = new Date(centralTime);
    today.setHours(12, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    return (
        <div className='date-schedule'>
            <input 
                className='date-schedule-input'
                type='date'
                value={selectedDate || ''}
                onChange={handleDateChange}
                max={maxDateStr}
            />
        </div>
    );
};

export default DateSchedule;