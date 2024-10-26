import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import JobList from './JobList';
import './CreateJobs.css';

const CreateJobs = () => {
    // hook to dispatch actions
    const dispatch = useDispatch();
    const history = useHistory();



    // state variables defines for input fields
    const [jobNumber, setJobNumber] = useState('');
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('');

    // Handle form submission 
    const handleSubmit = (event) => {
        // Prevent default form submission
        event.preventDefault();
        // Dispatch action to add job
        dispatch({
            type: 'ADD_JOB',
            payload: {
                job_number: jobNumber,
                job_name: name,
                location: location,
                start_date: startDate,
                end_date: endDate,
                status: status
            }
        });
        // clear form fields
        setJobNumber('');
        setName('');
        setLocation('');
        setStartDate('');
        setEndDate('');
    };

    // Fill form with dummy data and submit
    const fillDummyDataAndSubmit = () => {
        const dummyData = {
            jobNumber: '1001',
            name: 'New Construction',
            location: '123 Main St, Springfield',
            startDate: '2023-08-01',
            endDate: '2023-12-01',
            status: 'Active'
        };

        setJobNumber(dummyData.jobNumber);
        setName(dummyData.name);
        setLocation(dummyData.location);
        setStartDate(dummyData.startDate);
        setEndDate(dummyData.endDate);
        setStatus(dummyData.status);

        dispatch({
            type: 'ADD_JOB',
            payload: {
                job_number: dummyData.jobNumber,
                job_name: dummyData.name,
                location: dummyData.location,
                start_date: dummyData.startDate,
                end_date: dummyData.endDate,
                status: dummyData.status
            }
        });
    };

    return (
        <>

            <h2 className='jobs-title' onClick={fillDummyDataAndSubmit}>Projects</h2>


            <form className='jobs-form' onSubmit={handleSubmit}>
                <div className='job-id'>
                    <label className='job-Number' htmlFor='Number'> Project Number:</label>
                    <input
                        type='number'
                        id='jobid'
                        value={jobNumber}
                        onChange={(event) => setJobNumber(event.target.value)}
                    />
                    <label className='job-name' htmlFor='job-name'> Name: </label>
                    <input
                        type='text'
                        id='jobname'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <label className='job-location' htmlFor='job-location'> Location:</label>
                    <input
                        type='text'
                        id='joblocation'
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                    />
                    <label className='date-start' htmlFor='date-start'> Start Date: </label>
                    <input
                        type='date'
                        id='startdate'
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />
                    <label className='date-end' htmlFor='date-end'> End Date: </label>
                    <input
                        type='date'
                        id='enddate'
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />
                    <button className='job-button' type='submit'>Submit</button>
                </div>
            </form>

            <JobList />
        </>
    );
};

export default CreateJobs;
