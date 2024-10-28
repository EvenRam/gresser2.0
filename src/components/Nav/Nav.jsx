import React from 'react';
import { Link } from 'react-router-dom';
import LogOutButton from '../LogOutButton/LogOutButton';
import './Nav.css';
import { useSelector } from 'react-redux';


function Nav() {
  const user = useSelector((store) => store.user);

  return (
    <div className="nav">
        <img className='only-logo' src='/documentation/images/logogresser.png' alt='Only Logo' />
        {/* <img className='gresser' src='/documentation/images/Gresser.png' alt='Gresser' /> */}
      {/* <Link to="/home">
  
      </Link> */}
      <div>
        {/* If no user is logged in, show these links */}
        {!user.id && (
          // If there's no user, show login/registration links
          <Link className="navLink" to="/login">
            Login / Register
          </Link>
        )}

        {/* If a user is logged in, show these links */}

        {user.id && (
          <>

            <Link className="navLink" to="/scheduling">
              Schedule
            </Link>

            <Link className="navLink" to="/jobs">
              Projects
            </Link>

            <Link className="navLink" to="/addemployee">
              Employees
            </Link>

            <Link className='navLink' to="/jobhistory">
              Project History
            </Link>


            <LogOutButton className="navLink" />
          </>
        )}

      
      </div>
    </div>
  );
}

export default Nav;
