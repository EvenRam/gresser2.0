import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useHistory } from 'react-router-dom';



const EditForm = () => {

    const dispatch = useDispatch();
    const history = useHistory();
    const editJob = useSelector((store) => store.editJobReducer)
  
    function handleChange(event, property) {
        dispatch({
            type: 'EDIT_ONCHANGE',
            payload: {
                property: property,
                value: event.target.value,
            }
        })
    }

    function handleSubmit(event) {
        event.preventDefault();
        console.log("edit job", editJob.job_id);
        // Send PUT request to update job
        axios.put(`/api/jobs/${editJob.job_id}`, editJob)
            .then(response => {
                // clear edit job state
                dispatch({ type: "EDIT_CLEAR" });
                // nav back to home page
                history.push('/jobs');
            })
            .catch(error => {
                console.log('error on Put', error);
            })
    };

    return (
        <>

            <h2 className='edit-job'> Edit Job </h2>
            <form className='edit-form'
                onSubmit={handleSubmit}>
                <p className='to-edit'> About to Edit: {editJob.job_name}</p>

                <div className='job-Numer'>
                   <label> 
                    Job Number: 
                    <input
                        placeholder='Job Number'
                        onChange={(event) => handleChange(event, 'job_number',)}
                        value={editJob.job_number}
                    />
                    </label>
                </div>
                <div className='name'>
                <label> 
                    Job Name: 
                    <input
                        placeholder='Job Name'
                        value={editJob.job_name}
                        onChange={(event) => handleChange(event, 'job_name')}
                    />
                     </label> 
                </div>
                <div className='location'>
                <label> 
                    Location
                    <input
                        placeholder='Location'
                        value={editJob.location}
                        onChange={(event) => handleChange(event, 'location')}
                    />
                     </label> 
                </div>

                {/* <div className='startdate'>
                <label> 
                    Start Date
                    <input
                        placeholder='Start Date'
                        type='date'
                        value={editJob.start_date}
                        onChange={(event) => handleChange(event, 'start_date')}
                    />
                     </label> 
                </div>
                <div className='enddate'>
                <label> 
                    End Date
                    <input
                        placeholder=' End Date'
                        type='date'
                        value={editJob.end_date}
                        onChange={(event) => handleChange(event, 'end_date')}
                    />
                     </label> 
                </div> */}

                <input className="update-button" type='submit' value='Update Job' />
            </form>
        </>
    )
}
export default EditForm