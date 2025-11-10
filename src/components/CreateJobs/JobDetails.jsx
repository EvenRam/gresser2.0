import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import React, { useState } from 'react';

const JobDetails = (props) => {
    const dispatch = useDispatch();
    const history = useHistory();
    const [isToggling, setIsToggling] = useState(false);

    // Get selected date from Redux to refresh schedule data if needed
    const selectedDate = useSelector(state => state.scheduleReducer.selectedDate);

    // dispatch action to update current state in redux
    const handleEdit = () => {
        dispatch({
            type: "SET_JOB",
            payload: props.job
        });
        // nav to the edit page
        history.push('/edit');
    }


    // toggles the job between active and inactive
    const toggleStatus = () => {
        const newStatus = props.job.status === 'Active' ? 'Inactive' : 'Active';
        
        // If setting to inactive, prompt for confirmation
        if (newStatus === 'Inactive') {
            const confirmMessage = 'Setting this project to inactive will remove it from the schedule. Any employees assigned to this project will be moved back to their unions. Continue?';
            if (!window.confirm(confirmMessage)) {
                return; // User canceled
            }
        }
        
        setIsToggling(true);
        
        // Dispatch the toggle action
        dispatch({
            type: 'TOGGLE_JOB_STATUS',
            payload: { 
                job_id: props.job.job_id,
                status: newStatus
            }
        });
        
        // Disable the button briefly to prevent double clicks
        setTimeout(() => {
            setIsToggling(false);
        }, 1000);
    };

    // created variable for CSS class names for the toggle button
    //job-toggle.active/inaction are the class names 
    const buttonClass = `job-toggle ${props.job.status === 'Active' ? 'active' : 'inactive'} ${isToggling ? 'toggling' : ''}`;

    return (
        <>
            <tr>
            <td>{props.job.job_number} - {props.job.job_name}</td>  
                <td> {props.job.location}</td>
                <td> {new Date(props.job.start_date).toLocaleDateString()}</td>
                <td> {new Date(props.job.end_date).toLocaleDateString()} </td>
                <td>
                    <button 
                        className={buttonClass} 
                        onClick={toggleStatus}
                        disabled={isToggling}
                    > 
                        {props.job.status === 'Active' ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td> 
                    <button className="job-edit" onClick={() => handleEdit(props.job.id)}>
                        Edit
                    </button> 
                </td>
                
            </tr>
        </>
    )
}

export default JobDetails;