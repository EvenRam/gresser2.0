import React from 'react';
import { useSelector } from 'react-redux';
import Scheduling from './Scheduling';
import Trades from '../Trades/Trades';
import './SchedulingLayout.css'; // We'll create this

const SchedulingLayout = () => {
  const isEditable = useSelector((state) => state.scheduleReducer.isEditable);

  return (
    <div className="scheduling-layout-wrapper">
      <div className="print-page-1">
        <Scheduling />  {/* Projects - will print on page 1 */}
      </div>
      <div className="print-page-2">
        <Trades isEditable={isEditable} />  {/* Unions - will print on page 2 */}
      </div>
    </div>
  );
};

export default SchedulingLayout;