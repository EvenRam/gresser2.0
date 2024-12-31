import { takeLatest, call, put, select } from "redux-saga/effects";
import axios from 'axios';


// Helper functions for date handling
// set to noon
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

        yield put({ 
            type: 'SET_EMPLOYEE_WITH_UNION', 
            payload: response.data 
        });
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

        const highlightedEmployees = {};
        response.data.forEach(project => {
            project.employees?.forEach(employee => {
                if (employee.is_highlighted) {
                    highlightedEmployees[employee.id] = true;
                }
            });
        });

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
        const { employeeId, targetProjectId, sourceUnionId, date } = action.payload;
        const currentDate = date || getDefaultDate();
        const { isValid, formattedDate, isWithinRange } = validateDate(currentDate);
        
        if (!isValid) {
            throw new Error('Invalid date format');
        }
        
        if (!isWithinRange) {
            throw new Error('Date is out of allowed range');
        }

        yield call(
            axios.post, 
            `/api/moveemployee/${formattedDate}`, 
            { employeeId, targetProjectId }
        );

        localStorage.setItem('selectedScheduleDate', formattedDate);

        yield put({
            type: 'SET_SELECTED_DATE',
            payload: formattedDate
        });

        // Refresh data for the current date
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
            '/api/project/updateProjectOrder',
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



// Add new finalize saga
function* finalizeSchedule(action) {
    try {
        const { date } = action.payload;
        const { formattedDate } = validateDate(date);
        
        const response = yield call(
            axios.post,
            `/api/schedule/finalize/${formattedDate}`
        );
        
        const { nextDate } = response.data;
        localStorage.setItem('selectedScheduleDate', nextDate);

        yield put({ 
            type: 'SET_SELECTED_DATE', 
            payload: nextDate 
        });

        // Refresh data
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
    } catch (error) {
        console.error('Error finalizing schedule:', error);
        yield put({ 
            type: 'FETCH_ERROR', 
            payload: error.response?.data || 'Failed to finalize schedule' 
        });
    }
}



export default function* scheduleSaga() {
    yield takeLatest('FETCH_EMPLOYEES', fetchEmployees);
    yield takeLatest('FETCH_UNIONS_WITH_EMPLOYEES', fetchUnionsWithEmployees);
    yield takeLatest('FETCH_PROJECTS_WITH_EMPLOYEES', fetchProjectsWithEmployees);
    yield takeLatest('ADD_EMPLOYEE_SCHEDULE', addEmployeeSchedule);
    yield takeLatest('MOVE_EMPLOYEE', handleMoveEmployee);
    yield takeLatest('INITIALIZE_SCHEDULE', initializeScheduleDate);
    yield takeLatest('UPDATE_PROJECT_ORDER', updateProjectOrder);
    yield takeLatest('UPDATE_EMPLOYEE_ORDER', updateEmployeeOrder);
    yield takeLatest('FINALIZE_SCHEDULE', finalizeSchedule);
}