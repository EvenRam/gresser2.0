import React from 'react';
import { useSelector } from 'react-redux';
import Scheduling from './Scheduling';
import Trades from '../Trades/Trades';

const SchedulingLayout = () => {
  const isEditable = useSelector((state) => state.scheduleReducer.isEditable);

  return (
    <>
      <Scheduling />
      <Trades isEditable={isEditable} />
    </>
  );
};

export default SchedulingLayout;