import { useDispatch, useSelector } from "react-redux";
import { useHistory } from 'react-router-dom';
import React, { useState } from 'react';



const JobDetails = (props) => {
    const dispatch = useDispatch();
    const history = useHistory();

    const jobs = useSelector(store => store.jobReducer)


    // dispatch action to update current state in redux
    const handleEdit = () => {
        dispatch({
            type: "SET_JOB",
            payload: props.job
        });
        // nav to the edit page
        history.push('/edit');
    }

    // Dispatch action to delete job with job id
    const handleDelete = () => {
        console.log("Delete Clicked for job id:", props.job.job_id);
        dispatch({
            type: "DELETE_JOB",
            payload: { jobid: props.job.job_id }
        });
    };

// toggles the jb between active and inactive
const toggleStatus = () => {
    const newStatus = props.job.status === 'Active' ? 'Inactive' : 'Active';
    console.log("New status:", newStatus);
    dispatch({
        type: 'TOGGLE_JOB_STATUS',
        payload: { 
            job_id: props.job.job_id,
            status: newStatus
        }
    });
};

// created variable for CSS class names for the toggle button
//job-toggle.active/inaction are the class names 
const buttonClass = `job-toggle ${props.job.status === 'Active' ? 'active' : 'inactive'}`;


    
    return (
        <>
            <tr>
                <td> {props.job.job_number}</td>
                <td> {props.job.job_name}</td>
                <td> {props.job.location}</td>
                <td> {new Date(props.job.start_date).toLocaleDateString()}</td>
                <td> {new Date(props.job.end_date).toLocaleDateString()} </td>
                <td>
                <button className={buttonClass} onClick={toggleStatus}> 
                    {props.job.status === 'Active' ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td> <button className="job-edit" onClick={() => handleEdit(props.job.id)}>
                    Edit</button> </td>
                <td> <button className="job-delete" onClick={() => handleDelete(props.job.id)}>
                    Delete</button> </td>

            </tr>
        </>
    )
}
export default JobDetails;
