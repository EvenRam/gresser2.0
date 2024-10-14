import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ToggleEmployee from './ToggleEmployee';

const EmployeeList = () => {
    const dispatch = useDispatch();
    const employees = useSelector((state) => state.addEmployeeReducer);

    useEffect(() => {
        dispatch({ type: 'FETCH_EMPLOYEE_INFO' });
    }, [dispatch]);

    const handleEditClick = (emp) => {
        dispatch({ type: 'SET_EDIT_EMPLOYEE', payload: emp });
        // You might want to open a modal here or navigate to an edit page
    };

    return (
        <table className="employee-table">
            <thead>
                <tr>
                    <th>Last Name</th>
                    <th>First Name</th>
                    <th>Employee Number</th>
                    <th>Union</th>
                    <th>Status</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Edit</th>
                </tr>
            </thead>
            <tbody>
                {employees.map((emp) => (
                    <tr key={emp.id}>
                        <td>{emp.last_name}</td>
                        <td>{emp.first_name}</td>
                        <td>{emp.employee_number}</td>
                        <td>{emp.union_name}</td>
                        <td>
                            <ToggleEmployee emp={emp} />
                        </td>
                        <td>{emp.phone_number}</td>
                        <td>{emp.email}</td>
                        <td>{emp.address}</td>
                        <td><button className='employee-editbtn' onClick={() => handleEditClick(emp)}>Edit</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default EmployeeList;