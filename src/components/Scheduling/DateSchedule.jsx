import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const DateSchedule = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);

    useEffect(() => {
        const now = new Date();
        const todayStr = now.toISOString().substring(0, 10);
        if (!selectedDate) {
            console.log('Setting initial date:', todayStr);
            dispatch({ type: 'SET_SELECTED_DATE', payload: todayStr });
        }
    }, [dispatch, selectedDate]);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const maxDateStr = maxDate.toISOString().substring(0, 10);

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
    };

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