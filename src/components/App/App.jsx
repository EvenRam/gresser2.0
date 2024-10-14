import React, { useEffect } from 'react';
import {
  HashRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDispatch, useSelector } from 'react-redux';

import Nav from '../Nav/Nav';
import Footer from '../Footer/Footer';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import AboutPage from '../AboutPage/AboutPage';
import UserPage from '../UserPage/UserPage';
import InfoPage from '../InfoPage/InfoPage';
import LoginPage from '../LoginPage/LoginPage';
import AddEmployee from '../AddEmployee/AddEmployee';
import EditEmployee from '../AddEmployee/EditAddEmployee';
import CreateJobs from '../CreateJobs/CreateJobs';
import EditForm from '../CreateJobs/EditForm';
import JobHistory from '../JobHistory/JobHistory';
import SchedulingPage from '../Scheduling/SchedulingPage';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);

  useEffect(() => {
    dispatch({ type: 'FETCH_USER' });
  }, [dispatch]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <div>
          <Nav />
          <Switch>
            <Redirect exact from="/" to="/home" />
            <Route exact path="/about" component={AboutPage} />
            <ProtectedRoute exact path="/user" component={SchedulingPage} />
            <ProtectedRoute exact path="/info" component={InfoPage} />
            <Route exact path="/login">
              {user.id ? <Redirect to="/user" /> : <LoginPage />}
            </Route>
            <Route exact path="/home">
              {user.id ? <Redirect to="/user" /> : <LoginPage />}
            </Route>
            <ProtectedRoute exact path="/jobs" component={CreateJobs} />
            <ProtectedRoute exact path="/edit" component={EditForm} />
            <ProtectedRoute exact path="/addemployee" component={AddEmployee} />
            <ProtectedRoute exact path="/editemployee" component={EditEmployee} />
            <ProtectedRoute exact path="/jobhistory" component={JobHistory} />
            <ProtectedRoute exact path="/scheduling" component={SchedulingPage} />
            <Route>
              <h1>404</h1>
            </Route>
          </Switch>
          <Footer />
        </div>
      </Router>
    </DndProvider>
  );
}

export default App;