
import { takeLatest, call, put } from "redux-saga/effects";
import axios from 'axios';
// Helper functions for date handling
const getDefaultDate = () => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);  
    return now.toISOString().split('T')[0];
};
const validateDate = (date) => {
    const requestDate = new Date(date);
    requestDate.setHours(12, 0, 0, 0);  
    
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    maxDate.setHours(12, 0, 0, 0);
    
    return {
        isValid: !isNaN(requestDate.getTime()),
        formattedDate: date, 
        isWithinRange: requestDate <= maxDate
    };
};
function* fetchEmployees(action) {
    try {
        const date = action.payload?.date || getDefaultDate();
        const { isValid, formattedDate } = validateDate(date);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        console.log("Fetching employees for date:", formattedDate);
        const response = yield call(
            axios.get, 
            `/api/schedule/employees/${formattedDate}`
        );
        yield put({
            type: 'SET_EMPLOYEES',
            payload: {
                date: formattedDate,
                employees: response.data.employees
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        yield put({ 
            type: 'FETCH_ERROR', 
            payload: error.message 
        });
    }
}
function* fetchProjects(action) {
    try {
        yield put({ type: 'SET_PROJECT_LOADING', payload: true });
        
        const date = action.payload?.date || getDefaultDate();
        const { isValid, formattedDate } = validateDate(date);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        
        console.log("Fetching projects for date:", formattedDate);
        const response = yield call(
            axios.get, 
            `/api/project/${formattedDate}`
        );
        
        yield put({
            type: 'SET_PROJECTS',
            payload: response.data.projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        yield put({ 
            type: 'PROJECT_ERROR', 
            payload: error.message 
        });
    } finally {
        yield put({ type: 'SET_PROJECT_LOADING', payload: false });
    }
}
function* fetchUnionsWithEmployees(action) {
    try {
        const date = typeof action.payload === 'string' 
            ? action.payload 
            : action.payload?.date || getDefaultDate();
        const { isValid, formattedDate } = validateDate(date);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        console.log('Fetching unions with employees for date:', formattedDate);
        const response = yield call(
            axios.get, 
            `/api/schedule/withunions/${formattedDate}`
        );
        
        console.log('🟢 Union fetch response received');
        console.log('🟢 Response data:', response.data);
        
        const highlightedEmployees = {};
        if (response.data.unions) {
            response.data.unions.forEach(union => {
                union.employees?.forEach(employee => {
                    if (employee.is_highlighted) {
                        highlightedEmployees[employee.id] = true;
                    }
                });
            });
        }
        
        console.log('🟢 Highlighted employees from UNIONS:', highlightedEmployees);
        
        yield put({ 
            type: 'SET_EMPLOYEE_WITH_UNION', 
            payload: response.data 
        });
        
        yield put({
            type: 'SET_HIGHLIGHTED_EMPLOYEES',
            payload: {
                date: formattedDate,
                highlights: highlightedEmployees
            }
        });
        
        console.log('🟢 SET_HIGHLIGHTED_EMPLOYEES dispatched for UNIONS');
    } catch (error) {
        console.error('Error fetching unions with employees:', error);
        yield put({ 
            type: 'FETCH_ERROR', 
            payload: error.message 
        });
    }
}
function* fetchProjectsWithEmployees(action) {
    try {
        const date = action.payload?.date || getDefaultDate();
        const { isValid, formattedDate } = validateDate(date);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        const response = yield call(
            axios.get, 
            `/api/project/withEmployees/${formattedDate}`
        );
        
        console.log('🟠 Projects fetch response received');
        
        const highlightedEmployees = {};
        response.data.forEach(project => {
            project.employees?.forEach(employee => {
                if (employee.is_highlighted) {
                    highlightedEmployees[employee.id] = true;
                }
            });
        });
        
        console.log('🟠 Highlighted employees from PROJECTS:', highlightedEmployees);
        
        yield put({
            type: 'SET_PROJECTS_WITH_EMPLOYEES',
            payload: {
                date: formattedDate,
                jobs: response.data
            }
        });
        yield put({
            type: 'SET_HIGHLIGHTED_EMPLOYEES',
            payload: {
                date: formattedDate,
                highlights: highlightedEmployees
            }
        });
        
        console.log('🟠 SET_HIGHLIGHTED_EMPLOYEES dispatched for PROJECTS');
    } catch (error) {
        console.error('Error in Saga - fetchProjectsWithEmployees:', error);
        yield put({ 
            type: 'FETCH_ERROR', 
            payload: error.message 
        });
    }
}
function* addEmployeeSchedule(action) {
    try {
        const { selected_date, ...employeeData } = action.payload;
        const date = selected_date || getDefaultDate();
        const { isValid, formattedDate, isWithinRange } = validateDate(date);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        
        if (!isWithinRange) {
            throw new Error('Date is out of allowed range');
        }
        console.log('Adding employee schedule:', { ...employeeData, selected_date: formattedDate });
        const response = yield call(
            axios.post, 
            '/api/schedule', 
            { ...employeeData, selected_date: formattedDate }
        );
        yield put({ 
            type: 'FETCH_EMPLOYEES', 
            payload: { date: formattedDate } 
        });
        yield put({ 
            type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
            payload: { date: formattedDate } 
        });
        yield put({ 
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
            payload: { date: formattedDate } 
        });
    } catch (error) {
        console.error('Error adding employee schedule:', error);
        yield put({ 
            type: 'ADD_EMPLOYEE_FAILED', 
            payload: error.message || 'Failed to add employee schedule' 
        });
    }
}

function* handleMoveEmployee(action) {
    try {
        const { employeeId, targetProjectId, sourceLocation, dropIndex, date } = action.payload;
        const currentDate = date || getDefaultDate();
        const { isValid, formattedDate, isWithinRange } = validateDate(currentDate);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        
        if (!isWithinRange) {
            throw new Error('Date is out of allowed range');
        }
        
        console.log('Moving employee:', {
            employeeId, 
            targetProjectId, 
            sourceLocation,
            dropIndex,
            date: formattedDate
        });
        
        // Make the backend call - backend sets is_highlighted = TRUE
        yield call(
            axios.post, 
            `/api/moveemployee/${formattedDate}`, 
            { 
                employeeId, 
                targetProjectId,
                dropIndex 
            }
        );

        console.log('✅ Backend move completed successfully');
        
        // Set the date in localStorage and Redux
        localStorage.setItem('selectedScheduleDate', formattedDate);
        yield put({
            type: 'SET_SELECTED_DATE',
            payload: formattedDate
        });
        
        console.log('🔄 Starting data refresh...');
        
        // Refresh data from backend - this will include the highlight from database
        yield put({ 
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
            payload: { date: formattedDate } 
        });
        
        yield put({ 
            type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
            payload: { date: formattedDate } 
        });
        
        yield put({
            type: 'FETCH_EMPLOYEES',
            payload: { date: formattedDate }
        });
        
        console.log('🔄 Data refresh dispatched');
        
        // ❌ REMOVED: Don't manually set highlight here since the fetch will bring
        // the correct highlight status from the database (which was set by backend)
        // The fetchUnionsWithEmployees and fetchProjectsWithEmployees sagas will
        // dispatch SET_HIGHLIGHTED_EMPLOYEES with the database values
        
    } catch (error) {
        console.error('Error moving employee:', error);
        yield put({ 
            type: 'MOVE_EMPLOYEE_FAILURE', 
            payload: error.message || 'Failed to move employee' 
        });
    }
}

function* initializeScheduleDate() {
    try {
        const centralTime = new Date().toLocaleString("en-US", {
            timeZone: "America/Chicago"
        });
        const now = new Date(centralTime);
        now.setHours(12, 0, 0, 0);  
        const todayStr = now.toISOString().split('T')[0];
        
        console.log('Initializing with MN current date:', todayStr);
        
        localStorage.removeItem('selectedScheduleDate');
        yield put({
            type: 'SET_SELECTED_DATE',
            payload: todayStr
        });
        yield put({
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
            payload: { date: todayStr }
        });
        yield put({
            type: 'FETCH_UNIONS_WITH_EMPLOYEES',
            payload: { date: todayStr }
        });
        yield put({
            type: 'FETCH_EMPLOYEES',
            payload: { date: todayStr }
        });
    } catch (error) {
        console.error('Error initializing schedule date:', error);
        yield put({
            type: 'INITIALIZE_SCHEDULE_ERROR',
            payload: error.message
        });
    }
}
function* updateProjectOrder(action) {
    try {
        const { orderedProjectIds, date } = action.payload;
        const currentDate = date || getDefaultDate();
        const { isValid, formattedDate, isWithinRange } = validateDate(currentDate);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        
        if (!isWithinRange) {
            throw new Error('Date is out of allowed range');
        }
        yield call(
            axios.put,
            `/api/project/updateProjectOrder`,
            {
                orderedProjectIds,
                date: formattedDate
            }
        );
        yield put({
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
            payload: { date: formattedDate }
        });
    } catch (error) {
        console.error('Error updating project order:', error);
        yield put({
            type: 'UPDATE_PROJECT_ORDER_FAILURE',
            payload: error.message || 'Failed to update project order'
        });
    }
}
function* updateEmployeeOrder(action) {
    try {
        const { projectId, orderedEmployeeIds, date } = action.payload;
        const currentDate = date || getDefaultDate();
        const { isValid, formattedDate, isWithinRange } = validateDate(currentDate);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        
        if (!isWithinRange) {
            throw new Error('Date is out of allowed range');
        }
        
        console.log('Update employee order payload:', {
            projectId,
            orderedEmployeeIds,
            date: formattedDate
        });
        
        if (!Array.isArray(orderedEmployeeIds) || orderedEmployeeIds.length === 0) {
            throw new Error('Invalid employee order data');
        }
        
        const validIds = orderedEmployeeIds.every(id => typeof id === 'number' || typeof id === 'string');
        if (!validIds) {
            throw new Error('Invalid employee IDs in order data');
        }
        
        yield call(
            axios.put,
            '/api/project/updateOrder',
            {
                projectId,
                orderedEmployeeIds,
                date: formattedDate
            }
        );
        
        yield put({
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
            payload: { date: formattedDate }
        });
    } catch (error) {
        console.error('Error updating employee order:', error);
        yield put({
            type: 'UPDATE_EMPLOYEE_ORDER_FAILURE',
            payload: error.message || 'Failed to update employee order'
        });
    }
}
function* finalizeSchedule(action) {
    try {
        const { date } = action.payload;
        console.log('Starting finalize with date:', date);
        
        const { formattedDate } = validateDate(date);
        console.log('Validated date:', formattedDate);
        
        console.log('Making API call to finalize schedule...');
        const response = yield call(
            axios.post,
            `/api/schedule/finalize/${formattedDate}`
        );
        console.log('Received response:', response.data);
        
        const { nextDate } = response.data;
        console.log('Next date from response:', nextDate);
        
        localStorage.setItem('selectedScheduleDate', nextDate);
        console.log('Updated localStorage with new date');
        
        yield put({ 
            type: 'SET_SELECTED_DATE', 
            payload: nextDate 
        });
        console.log('Dispatched SET_SELECTED_DATE');
        
        console.log('Starting data refresh for new date');
        yield put({ 
            type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
            payload: { date: nextDate }
        });
        
        yield put({ 
            type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
            payload: { date: nextDate }
        });
        
        yield put({
            type: 'FETCH_EMPLOYEES',
            payload: { date: nextDate }
        });
        console.log('Completed all refresh dispatches');
        
        yield put({
            type: 'SET_SUCCESS_MESSAGE',
            payload: `Schedule finalized. Moved to ${nextDate}`
        });
    } catch (error) {
        console.error('Error in finalizeSchedule:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        yield put({ 
            type: 'FETCH_ERROR', 
            payload: error.response?.data || 'Failed to finalize schedule' 
        });
    }
}
function* updateRainDayStatus(action) {
    try {
        const { jobId, isRainDay, date } = action.payload;
        yield call(axios.put, `/api/project/${jobId}/rainday`, { date, isRainDay });
        yield put({ 
            type: 'UPDATE_RAIN_DAY_STATUS', 
            payload: { jobId, isRainDay, date } 
        });
    } catch (error) {
        console.error('Error updating rain day status:', error);
        yield put({ type: 'FETCH_ERROR', payload: error.message });
    }
}
export default function* scheduleSaga() {
    yield takeLatest('FETCH_EMPLOYEES', fetchEmployees);
    yield takeLatest('FETCH_PROJECTS', fetchProjects);
    yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
    yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);
    yield takeLatest('ADD_EMPLOYEE_SCHEDULE', addEmployeeSchedule);
    yield takeLatest('MOVE_EMPLOYEE', handleMoveEmployee);
    yield takeLatest('INITIALIZE_SCHEDULE', initializeScheduleDate);
    yield takeLatest('UPDATE_PROJECT_ORDER', updateProjectOrder);
    yield takeLatest('UPDATE_EMPLOYEE_ORDER', updateEmployeeOrder);
    yield takeLatest('FINALIZE_SCHEDULE', finalizeSchedule);
    yield takeLatest('UPDATE_RAIN_DAY_STATUS_REQUEST', updateRainDayStatus);
}
