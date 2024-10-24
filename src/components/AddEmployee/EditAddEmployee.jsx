import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

function EditEmployee() {
    const dispatch = useDispatch();
    const history = useHistory();
    const editEmployee = useSelector((store) => store.editEmployeeReducer);
    console.log("editEmployee reducer",editEmployee)
    const unions = useSelector((store) => store.unionReducer);
    console.log("union reducer",unions)

    

    useEffect(() => {
        dispatch({ type: "FETCH_EMPLOYEE" });
    }, [dispatch]);

    const handleChange = (event, property) => {
        dispatch({
            type: 'EDIT_ONCHANGE',
            payload: { property: property, value: event.target.value }
        });
    };

    const handleUnionChange = (event) => {
        const selectedUnionId = event.target.value; 
        const selectedUnion = unions.find(union => union.id === Number(selectedUnionId)); 
    
        // Dispatch both union_id and union_name to the Redux store
        if (selectedUnion) {
            dispatch({
                type: 'UPDATE_UNION',
                payload: {
                    union_id: selectedUnion.id, 
                    union_name: selectedUnion.union_name 
                }
            });
        }
    };
    

    const handleSubmit = (event) => {
        event.preventDefault();

        axios.put(`/api/addemployee/${editEmployee.id}`, editEmployee)
            .then(response => {
                dispatch({ type: 'EDIT_CLEAR' });
                history.push('/addEmployee');
            })
            .catch(error => {
                console.log('Error on PUT: ', error);
            });
    };

    return (
        <div>
            <h2 className='Edit-title'> Edit Employee</h2>

            <form className='employee-edit' onSubmit={handleSubmit}>
            <p className='employee-toedit'>About to edit: {editEmployee.last_name} {editEmployee.first_name} </p>

                <div>
                    <label>
                        Last Name
                        <input
                        className='l-name'
                            type="text"
                            name="last_name"
                            value={editEmployee.last_name}
                            onChange={(event) => handleChange(event, 'last_name')}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        First Name
                        <input
                        className='f-name'
                            type="text"
                            name="first_name"
                            value={editEmployee.first_name}
                            onChange={(event) => handleChange(event, 'first_name')}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Employee Number
                        <input
                        className='employee-num'
                            type="text"
                            name="employee_number"
                            value={editEmployee.employee_number}
                            onChange={(event) => handleChange(event, 'employee_number')}
                        />
                    </label>
                </div>
                
                <div>
                <label>Union Trade
                <select
    id="union_name"
    name="union_name"
    value={editEmployee.union_id}
    onChange={handleUnionChange}
>
    <option value="" disabled>Select a union</option>
    {unions.map((union) => (
        <option key={union.id} value={union.id}>
            {union.union_name}
        </option>
    ))}
</select>

                    </label>

                </div>
                <div>
                    <label>
                        Phone Number
                        <input
                         className='phone-input'
                            type="text"
                            name="phone_number"
                            value={editEmployee.phone_number}
                            onChange={(event) => handleChange(event, 'phone_number')}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Email
                        <input
                        className='email-input'
                            type="text"
                            name="email"
                            value={editEmployee.email}
                            onChange={(event) => handleChange(event, 'email')}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Address
                        <input
                         className='adress-input'
                            type="text"
                            name="address"
                            value={editEmployee.address}
                            onChange={(event) => handleChange(event, 'address')}
                        />
                    </label>
                </div>
                <button className='submit-employee-edit' type="submit">Update Employee</button>
            </form>
        </div>
    );
}

export default EditEmployee;