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

return(
    <>
    <div>
        <table className="job-table">

            <thead>
                <tr>
                    <th>Project Number - Name</th>
                    <th>Location</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Edit</th>
                </tr>
            </thead>
            <tbody>
               {/** if the condition is true render you have no jobs otherwise render the jobs */}
            {!jobs || jobs.length === 0 || !Array.isArray(jobs) ? (
              <tr>
                <td colSpan="7">YOU HAVE NO PROJECTS</td>
              </tr>
            ) : (
              jobs.map((job) => (
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