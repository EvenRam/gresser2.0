import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import UnionBox from './UnionBox';
import unionColors from './UnionColors';
import './Trades.css';

const Trades = () => {
    const dispatch = useDispatch();
    const unions = useSelector((state) => state.unionReducer);
    const unionBox = useSelector((state) => state.unionBoxReducer);

    useEffect(() => {
        dispatch({ type: 'FETCH_EMPLOYEE_UNION' });
        dispatch({ type: 'FETCH_UNIONS_WITH_EMPLOYEES' });
    }, [dispatch]);

    const moveEmployee = (employeeId, targetUnionId) => {
        dispatch({ type: 'MOVE_EMPLOYEE', payload: { employeeId, targetUnionId } });
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


