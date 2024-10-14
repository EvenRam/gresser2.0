import React, { useEffect, useState, useCallback } from 'react'; // Import necessary React hooks
import { useDispatch, useSelector } from 'react-redux'; // Import Redux hooks for state management
import { useDrag, useDrop } from 'react-dnd'; // Import drag-and-drop hooks
import ProjectBox from './ProjectBox'; // Import a component for rendering job details
import './EmployeeStyles.css'; // Import CSS styles for employees
import './Scheduling.css'; // Import CSS styles for scheduling

// DraggableJobBox component for rendering individual job boxes
const DraggableJobBox = ({ job, index, moveJob, moveEmployee }) => {
  // Set up drag-and-drop functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB', // Define the type of draggable item
    item: { id: job.id, index }, // The item to be dragged includes its id and index
    collect: (monitor) => ({
      isDragging: monitor.isDragging(), // Collect whether the item is currently being dragged
    }),
  });

  // Set up drop functionality
  const [, drop] = useDrop({
    accept: 'JOB', // Define what types of items this drop zone accepts
    hover: (draggedItem, monitor) => {
      // When an item is hovered over this drop zone
      if (draggedItem.index !== index) { // Check if the dragged item is not already in the correct position
        moveJob(draggedItem.index, index); // Move the job to the new position
        draggedItem.index = index; // Update the index of the dragged item
      }
    },
  });

  // Render the draggable job box with the drop functionality
  return (
    <div ref={(node) => drag(drop(node))} className="draggable-job-box" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <ProjectBox
        id={job.id}
        job_name={job.job_name}
        employees={job.employees || []} // Use empty array if employees is undefined
        moveEmployee={moveEmployee} // Pass down moveEmployee function for employee dragging
      />
    </div>
  );
};

// Main Scheduling component
const Scheduling = () => {
  const dispatch = useDispatch(); // Get the dispatch function from Redux
  const [isLoading, setIsLoading] = useState(true); // State to track loading status
  const jobsBox = useSelector((state) => state.projectReducer); // Get the list of jobs from Redux state
  const [jobs, setJobs] = useState([]); // Local state to hold jobs for rendering

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Set loading state to true
      await dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES' }); // Dispatch action to fetch projects with employees
      setIsLoading(false); // Set loading state to false after fetching
    };
    fetchData(); // Call the fetch function
  }, [dispatch]); // Dependency array includes dispatch to avoid stale closure

  // Update local jobs state whenever jobsBox changes
  useEffect(() => {
    if (jobsBox && Array.isArray(jobsBox)) { // Check if jobsBox is an array
      setJobs(jobsBox); // Update local jobs state
    }
  }, [jobsBox]); // Dependency array includes jobsBox

  // Function to move jobs within the job list
  const moveJob = useCallback((dragIndex, hoverIndex) => {
    setJobs((prevJobs) => {
      const newJobs = [...prevJobs]; // Create a shallow copy of previous jobs
      const draggedJob = newJobs[dragIndex]; // Get the job being dragged
      newJobs.splice(dragIndex, 1); // Remove the job from its original position
      newJobs.splice(hoverIndex, 0, draggedJob); // Insert the job at the new position
      return newJobs; // Return the updated job list
    });
  }, []); // Empty dependency array ensures this function is stable

  // Function to move an employee to a different job
  const moveEmployee = useCallback((employeeId, targetProjectId) => {
    console.log('Move Employee', employeeId, 'to', targetProjectId); // Log the employee movement
    dispatch({ type: 'MOVE_EMPLOYEE', payload: { employeeId, targetProjectId } }); // Dispatch action to move employee
  }, [dispatch]); // Dependency array includes dispatch

  // Show loading indicator while data is being fetched
  if (isLoading) {
    return <div>Loading...</div>; // Render loading message
  }

  // Render the main component
  return (
    <div className="scheduling-container">
      <div>
        {/* Check if there are no jobs to display */}
        {!jobs || jobs.length === 0 ? (
          <table className="no-jobs-table">
            <tbody>
              <tr>
                <td colSpan="7">YOU HAVE NO JOBS</td> {/* Display message when no jobs are found */}
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="jobs-container">
            {/* Map over jobs to render DraggableJobBox for each job */}
            {jobs.map((job, index) => (
              <DraggableJobBox
                key={job.id} // Use job id as the key for rendering
                job={job} // Pass the job object to the DraggableJobBox
                index={index} // Pass the index for drag-and-drop functionality
                moveJob={moveJob} // Pass down moveJob function
                moveEmployee={moveEmployee} // Pass down moveEmployee function
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduling; // Export the Scheduling component for use in other parts of the application
