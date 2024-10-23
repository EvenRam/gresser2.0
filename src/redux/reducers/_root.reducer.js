import { combineReducers } from 'redux';
import errors from './errors.reducer';
import user from './user.reducer';
import addEmployeeReducer from './addemployee.reducer';
import editEmployeeReducer from './editaddemployee.reducer';
import editJobReducer from './editjob.reducer';
import jobReducer from './job.reducer';
// import cardReducer from './card.reducer';
import employeeReducer from './employeeReducer';
import projectReducer from './project.reducer';
import unionReducer from './union.reducer';
import unionBoxReducer from './unionBox.reducer';
// rootReducer is the primary reducer for our entire project
// It bundles up all of the other reducers so our project can use them.
// This is imported in index.js as rootSaga

// Lets make a bigger object for our store, with the objects from our reducers.
// This is what we get when we use 'state' inside of 'mapStateToProps'
const rootReducer = combineReducers({
  errors, // contains registrationMessage and loginMessage
  user, // will have an id and username if someone is logged in
  addEmployeeReducer,
  editEmployeeReducer,
  editJobReducer,
  jobReducer,
  // cardReducer,
  projectReducer,
  unionReducer,
  unionBoxReducer,
  employeeReducer
});

export default rootReducer;
