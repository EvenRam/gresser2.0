import React from "react";
import JobDetails from "./JobDetails";

function JobList({ jobs, toggleStatus }) {
    return (
        <div>
            <table className="job-table">
                <thead>
                    <tr>
                        <th>Project Number</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Edit</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs && jobs.length > 0 ? (
                        jobs.map((job) => (
                            <JobDetails 
                                key={job.job_id} 
                                job={job} 
                                toggleStatus={toggleStatus}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8">YOU HAVE NO PROJECTS</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default JobList;