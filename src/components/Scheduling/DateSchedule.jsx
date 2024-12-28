import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const formatLocalDate = (date) => {
    return date.toISOString().split('T')[0];
};

const DateSchedule = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);

    useEffect(() => {
        if (!selectedDate) {
            const now = new Date();
            // Set to noon to avoid timezone issues
            now.setHours(12, 0, 0, 0);
            const todayStr = formatLocalDate(now);
            console.log('Setting initial date:', todayStr);
            dispatch({ type: 'SET_SELECTED_DATE', payload: todayStr });
        }
    }, [dispatch, selectedDate]);

    const handleDateChange = (event) => {
        const selectedValue = event.target.value;
        console.log('Raw selected date:', selectedValue);
        
        // Create date object at noon to avoid timezone shifts
        const selectedDate = new Date(selectedValue + 'T12:00:00');
        console.log('Adjusted date object:', selectedDate);
        
        const formattedDate = formatLocalDate(selectedDate);
        console.log('Formatted date being dispatched:', formattedDate);
        
        dispatch({ type: 'SET_SELECTED_DATE', payload: formattedDate });
    };

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    maxDate.setHours(12, 0, 0, 0);
    const maxDateStr = formatLocalDate(maxDate);

    if (!selectedDate) {
        return <div>Loading...</div>;
    }

    return (
        <div className='date-schedule'>
            <input 
                className='date-schedule-input'
                type='date'
                value={selectedDate}
                onChange={handleDateChange}
                max={maxDateStr}
            />
        </div>
    );
};

export default DateSchedule;