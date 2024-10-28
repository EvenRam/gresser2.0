import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function RegisterForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employee, setEmployee] = useState('');
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');

  console.log("email", email)
  console.log("lastname", lastName)
  console.log("firstname", firstName)
  console.log("employee", employee)


  const errors = useSelector((store) => store.errors);

  const dispatch = useDispatch();

  const registerUser = (event) => {
    event.preventDefault();

    dispatch({
      type: 'REGISTER',
      payload: {
        first_name: firstName,
        last_name: lastName,
        employee_number: employee,
        email: email,
        password: password,
      },
    });
  }; // end registerUser

  return (
    <form className="formPanel" onSubmit={registerUser}>
      <h2>Register User</h2>
      {errors.registrationMessage && (
        <h3 className="alert" role="alert">
          {errors.registrationMessage}
        </h3>
      )}
      <div>
        <label htmlFor="username">
          First Name:
          <input
            type="text"
            name="username"
            value={firstName}
            required
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
      </div>

      <div>
        <label htmlFor="lastname">
          Last Name:
          <input
            type="text"
            name="last name"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
      </div>

      <div>
        <label htmlFor="employee-number">
          Employee Number:
          <input
            type="text"
            name="employee-number"
            required
            value={employee}
            onChange={(event) => setEmployee(event.target.value)}
          />
        </label>
        </div>

        <div>
        <label htmlFor="email">
          E-mail:
          <input
            type="text"
            name="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
      </div>

      <div>
        <label htmlFor="password">
          Password:
          <input
            type="password"
            name="password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      </div>
      <div>
        <input className="btn" type="submit" name="submit" value="Register" />
      </div>
    </form>
  );
}

export default RegisterForm;
