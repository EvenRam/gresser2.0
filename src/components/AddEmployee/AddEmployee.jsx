import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import EmployeeList from './EmployeeList';
import './AddEmployee.css';

const AddEmployee = () => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        employee_number: '',
        union_name: '',
        phone_number: '',
        email: '',
        address: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        let formErrors = {};
        if (!formData.first_name) formErrors.first_name = "First name is required";
        if (!formData.last_name) formErrors.last_name = "Last name is required";
        if (!formData.employee_number) formErrors.employee_number = "Employee number is required";
        if (!formData.union_name) formErrors.union_name = "Union is required";
        if (!formData.email) formErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) formErrors.email = "Email is invalid";
        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            dispatch({ type: 'ADD_EMPLOYEE', payload: formData });
            setFormData({
                first_name: '',
                last_name: '',
                employee_number: '',
                union_name: '',
                phone_number: '',
                email: '',
                address: ''
            });
        }
    };

    return (
        <div>
            <h2 className='employee-title'>Add Employee</h2>
            <form className='employee-inputs' onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                />
                {errors.last_name && <span className="error">{errors.last_name}</span>}
                <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                />
                {errors.first_name && <span className="error">{errors.first_name}</span>}
                <input
                    type="text"
                    name="employee_number"
                    placeholder="Employee Number"
                    value={formData.employee_number}
                    onChange={handleChange}
                />
                {errors.employee_number && <span className="error">{errors.employee_number}</span>}
                <select
                    name="union_name"
                    value={formData.union_name}
                    onChange={handleChange}
                >
                    <option value="" disabled>Select a union</option>
                    <option value="21 - Bricklayers">21 - Bricklayers</option>
                    <option value="22 - Cement Masons/Finishers">22 - Cement Masons/Finishers</option>
                    <option value="23 - Laborers">23 - Laborers</option>
                    <option value="24 - Operators">24 - Operators</option>
                    <option value="25 - Carpenters">25 - Carpenters</option>
                </select>
                {errors.union_name && <span className="error">{errors.union_name}</span>}
                <input
                    type="text"
                    name="phone_number"
                    placeholder="Phone Number"
                    value={formData.phone_number}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                />
                {errors.email && <span className="error">{errors.email}</span>}
                <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleChange}
                />
                <button className="employee-button" type="submit">Add Employee</button>
            </form>
            <EmployeeList />
        </div>
    );
};

export default AddEmployee;