import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import JobDetails from "./JobDetails";

function JobList(props){

const jobs = useSelector(store => store.jobReducer)
const dispatch = useDispatch();

// Dispatch action to get jobs
useEffect(()=>{
    dispatch({ type: "FETCH_JOB"})
}, []);

// Sort jobs by project number before rendering
const sortedJobs = jobs && Array.isArray(jobs) 
    ? [...jobs].sort((a, b) => a.job_number - b.job_number)
    : [];

return(
    <>
    <div>
        <table className="projects-table">  {/* Changed from job-table to projects-table */}
            <thead>
                <tr>
                    <th>Project Number - Name</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Edit</th>
                </tr>
            </thead>
            <tbody>
               {!jobs || jobs.length === 0 || !Array.isArray(jobs) ? (
              <tr>
                <td colSpan="4">YOU HAVE NO PROJECTS</td>
              </tr>
            ) : (
              sortedJobs.map((job) => (
                <JobDetails key={job.job_id} job={job} />
              ))
            )}
          </tbody>
        </table>
    </div>
    </>
)
}
export default JobList