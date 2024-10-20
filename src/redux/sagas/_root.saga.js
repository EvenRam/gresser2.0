import { all } from 'redux-saga/effects';
import loginSaga from './login.saga';
import registrationSaga from './registration.saga';
import userSaga from './user.saga';
import fetchEmployeeInfo from './employee.saga';
import jobSaga from './job.saga';
import projectSaga from './project.saga';  

export default function* rootSaga() {
  yield all([
    loginSaga(),
    registrationSaga(),
    userSaga(),
    fetchEmployeeInfo(),
    jobSaga(),
    projectSaga()  
  ]);
}