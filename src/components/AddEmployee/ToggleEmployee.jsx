import React from "react";
import { useDispatch } from "react-redux";

const ToggleEmployee = (props) => {
    const dispatch = useDispatch();

    const toggleStatus = () => {
        const updateStatus = !props.emp.employee_status;
        dispatch({
            type: "EMPLOYEE_TOGGLE_STATUS",
            payload: {
                id: props.emp.id, 
                employee_status: updateStatus
            }
        });
    }

    const toggleBtn = `employee-toggle ${props.emp.employee_status ? 'Active' : 'Inactive'}`;

    return (
        <button className={toggleBtn} onClick={toggleStatus}>
            {props.emp.employee_status ? 'Active' : 'Inactive'}
        </button>
    );
}

export default ToggleEmployee;