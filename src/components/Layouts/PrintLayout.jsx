import React from 'react';
import Scheduling from '../Scheduling/Scheduling';
import Trades from '../Trades/Trades';

const PrintLayout = () => {
  return (
    <div className="print-layout">
      <div className="print-page print-page-1">
        <Scheduling />
      </div>
      <div className="print-page print-page-2">
        <Trades />
      </div>
    </div>
  );
};

export default PrintLayout;