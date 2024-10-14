import React from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

function JobDetails({ job, toggleStatus }) {
    const dispatch = useDispatch();
    const history = useHistory();

    const handleDelete = () => {
        dispatch({
            type: "DELETE_JOB",
            payload: { jobid: job.job_id }
        });
    };

    const handleEdit = () => {
        dispatch({
            type: "SET_JOB",
            payload: job
        });
        history.push('/edit');
    };

    return (
        <tr key={job.job_id}>
            <td>{job.job_number}</td>
            <td>{job.job_name}</td>
            <td>{job.location}</td>
            <td>{job.start_date}</td>
            <td>{job.end_date}</td>
            <td>
                <button onClick={() => toggleStatus(job.job_id, job.status)}>
                    {job.status}
                </button>
            </td>
            <td><button onClick={handleEdit}>Edit</button></td>
            <td><button onClick={handleDelete}>Delete</button></td>
        </tr>
    );
}

export default JobDetails;