import React from 'react';
import Scheduling from './Scheduling';
import Trades from '../Trades/Trades';
import './SchedulingPage.css'; 

const SchedulingPage = () => {
  return (
    <div className="scheduling-page-container">
      <div className="jobs-section">
        <Scheduling />
      </div>
      <div className="unions-section">
        <Trades />
      </div>
    </div>
  );
};

export default SchedulingPage;