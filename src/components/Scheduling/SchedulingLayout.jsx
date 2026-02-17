import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Scheduling from './Scheduling';
import Trades from '../Trades/Trades';
import './SchedulingLayout.css';

const SchedulingLayout = () => {
  const dispatch = useDispatch();
  const isEditable = useSelector((state) => state.scheduleReducer.isEditable);
  const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);

  // Define toggleHighlight HERE at the parent level
  // So BOTH Scheduling and Trades can use it
  const toggleHighlight = useCallback(async (employeeId, isHighlighted) => {
    if (!isEditable) return;

    console.log('🚨 toggleHighlight called:', { employeeId, isHighlighted, selectedDate });

    try {
      console.log('🚨 About to make API call...');
      await axios.put(`/api/schedule/${selectedDate}/${employeeId}/highlight`, {
        isHighlighted
      });
      console.log('🚨 API call completed');

      dispatch({
        type: 'SET_HIGHLIGHTED_EMPLOYEE',
        payload: { id: employeeId, isHighlighted, date: selectedDate }
      });
    } catch (error) {
      console.error('Error toggling highlight:', error);
    }
  }, [dispatch, selectedDate, isEditable]);

  return (
    <div className="scheduling-layout-wrapper">
      <div className="print-page-1">
        <Scheduling toggleHighlight={toggleHighlight} />
      </div>
      <div className="print-page-2">
        <Trades 
          isEditable={isEditable} 
          toggleHighlight={toggleHighlight}
        />
      </div>
    </div>
  );
};

export default SchedulingLayout;