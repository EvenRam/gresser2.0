import React from 'react';

const DragPreview = ({ name, unionColor }) => {
  return (
    <div
      style={{
        padding: '4px 8px',
        backgroundColor: 'white',
        border: `2px solid ${unionColor}`,
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        fontSize: '14px',
        pointerEvents: 'none',
      }}
    >
      {name}
    </div>
  );
};
