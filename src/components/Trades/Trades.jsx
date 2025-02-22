import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import UnionBox from './UnionBox';
import unionColors from './UnionColors';
import './Trades.css';

const Trades = () => {
    const dispatch = useDispatch();
    const unions = useSelector((state) => state.unionReducer);
    const unionBox = useSelector((state) => state.unionBoxReducer);
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);

    useEffect(() => {
        dispatch({ type: 'FETCH_EMPLOYEE_UNION' });
        dispatch({ 
            type: 'FETCH_UNIONS_WITH_EMPLOYEES',
            payload: { date: selectedDate }
        });
    }, [dispatch, selectedDate]);

    const moveEmployee = (employeeId, targetProjectId, sourceUnionId) => {
        dispatch({ 
            type: 'MOVE_EMPLOYEE', 
            payload: { 
                employeeId, 
                targetProjectId, 
                sourceUnionId,
                date: selectedDate
            }
        });
    };
    
    return (
        <div className="trades-container">
            <div className="unions-container">
                {unionBox.map(union => (
                    <div key={union.id} className="union-box">
                        <UnionBox
                            id={union.id}
                            union_name={union.union_name}
                            employees={union.employees}
                            color={unionColors[union.union_name]} 
                            moveEmployee={moveEmployee}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Trades;