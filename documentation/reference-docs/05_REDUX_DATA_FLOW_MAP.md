# GRESSER SCHEDULING SYSTEM - REDUX DATA FLOW MAP

**Last Updated:** January 2026  
**Purpose:** Understand how data moves through the application

---

## 📊 TABLE OF CONTENTS

1. [Redux Architecture Overview](#redux-architecture-overview)
2. [Complete Data Flow Diagrams](#complete-data-flow-diagrams)
3. [Key Action Types](#key-action-types)
4. [Reducer Details](#reducer-details)
5. [Saga Flow Patterns](#saga-flow-patterns)
6. [Date Handling Throughout the Stack](#date-handling-throughout-the-stack)

---

## 🏗️ REDUX ARCHITECTURE OVERVIEW

### The Redux Cycle
```
┌─────────────┐
│   USER      │
│   ACTION    │ (clicks, drags, types)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  COMPONENT  │ (Scheduling.jsx, ProjectBox.jsx, etc.)
│  dispatch()  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTION    │ (type: 'MOVE_EMPLOYEE', payload: {...})
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    SAGA     │ (schedule.saga.js - handles async)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API CALL   │ (axios.post('/api/moveemployee/:date'))
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ROUTER    │ (moveemployee.router.js)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DATABASE   │ (PostgreSQL - UPDATE schedule SET...)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  RESPONSE   │ (success/error)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    SAGA     │ (receives response)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  REDUCER    │ (updates state)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  COMPONENT  │ (re-renders with new data)
└─────────────┘
```

---

## 🔄 COMPLETE DATA FLOW DIAGRAMS

### Flow 1: Moving an Employee to a Project
```
USER DRAGS EMPLOYEE FROM UNION BOX TO PROJECT BOX
│
├─► ProjectBox.jsx (drop handler)
│   │
│   └─► dispatch({ type: 'MOVE_EMPLOYEE', payload: { employeeId, targetProjectId, dropIndex, date } })
│
├─► schedule.saga.js (listens for 'MOVE_EMPLOYEE')
│   │
│   ├─► Saga receives action
│   │
│   ├─► axios.post('/api/moveemployee/:date', {
│   │       employeeId,
│   │       targetJobId: targetProjectId,
│   │       targetLocation: 'project',
│   │       dropIndex,
│   │       sourceLocation
│   │   })
│   │
│   └─► Wait for response...
│
├─► moveemployee.router.js
│   │
│   ├─► Validates date (middleware)
│   │
│   ├─► BEGIN transaction
│   │
│   ├─► UPDATE schedule SET
│   │       job_id = targetJobId,
│   │       current_location = 'project',
│   │       is_highlighted = TRUE,
│   │       employee_display_order = dropIndex
│   │   WHERE date = :date AND employee_id = :employeeId
│   │
│   ├─► COMMIT transaction
│   │
│   └─► res.sendStatus(200)
│
├─► schedule.saga.js (receives success)
│   │
│   └─► dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES', payload: { date } })
│       dispatch({ type: 'FETCH_UNIONS_WITH_EMPLOYEES', payload: { date } })
│
├─► Sagas fetch fresh data from API
│   │
│   ├─► GET /api/project/withEmployees/:date
│   └─► GET /api/schedule/withunions/:date
│
├─► project.reducer.js + unionBox.reducer.js
│   │
│   └─► Update state with new data
│
└─► Scheduling.jsx, ProjectBox.jsx, UnionBox.jsx
    │
    └─► Re-render with updated employee positions
```

---

### Flow 2: Changing the Selected Date
```
USER SELECTS NEW DATE IN DATE PICKER
│
├─► DateSchedule.jsx (onChange handler)
│   │
│   └─► dispatch({ type: 'SET_SELECTED_DATE', payload: '2026-01-04' })
│
├─► schedule.reducer.js
│   │
│   ├─► Calculate isEditable (is date within editable range?)
│   │   const today = new Date().toISOString().split('T')[0]
│   │   const maxDate = add 7 days to today
│   │   isEditable = newDate >= today && newDate <= maxDate
│   │
│   └─► Update state: { selectedDate: '2026-01-04', isEditable: true }
│
├─► schedule.saga.js (watches for 'SET_SELECTED_DATE')
│   │
│   └─► Triggers three parallel fetches:
│       │
│       ├─► dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES', payload: { date: '2026-01-04' } })
│       ├─► dispatch({ type: 'FETCH_UNIONS_WITH_EMPLOYEES', payload: { date: '2026-01-04' } })
│       └─► dispatch({ type: 'FETCH_EMPLOYEES', payload: '2026-01-04' })
│
├─► Three sagas run in parallel:
│   │
│   ├─► project.saga.js
│   │   └─► GET /api/project/withEmployees/2026-01-04
│   │       Response: [{ job_id, job_name, employees: [...] }, ...]
│   │
│   ├─► unionBox.saga.js
│   │   └─► GET /api/schedule/withunions/2026-01-04
│   │       Response: [{ union_id, union_name, employees: [...] }, ...]
│   │
│   └─► employee.saga.js
│       └─► GET /api/schedule/employees/2026-01-04
│           Response: { employees: [...], highlightedEmployees: {...} }
│
├─► Reducers update state:
│   │
│   ├─► projectReducer.projectsByDate['2026-01-04'] = projects
│   ├─► unionBoxReducer = unions
│   └─► employeeReducer.employeesByDate['2026-01-04'] = employees
│
└─► Components re-render with new date's data
```

---

### Flow 3: Toggling Employee Highlight
```
USER RIGHT-CLICKS EMPLOYEE
│
├─► Employee.jsx (onContextMenu handler)
│   │
│   └─► dispatch({ 
│           type: 'SET_HIGHLIGHTED_EMPLOYEE', 
│           payload: { 
│               id: employeeId, 
│               isHighlighted: !currentState,
│               date: selectedDate 
│           }
│       })
│
├─► employee.saga.js (watches 'SET_HIGHLIGHTED_EMPLOYEE')
│   │
│   └─► axios.put(`/api/schedule/${date}/${employeeId}/highlight`, {
│           isHighlighted: !currentState
│       })
│
├─► schedule.router.js
│   │
│   ├─► UPDATE schedule 
│   │   SET is_highlighted = :isHighlighted
│   │   WHERE date = :date AND employee_id = :employeeId
│   │
│   └─► res.sendStatus(200)
│
├─► employee.saga.js (receives success)
│   │
│   └─► dispatch({ 
│           type: 'SET_HIGHLIGHTED_EMPLOYEE_SUCCESS',
│           payload: { id, isHighlighted, date }
│       })
│
├─► employee.reducer.js
│   │
│   └─► Update highlightedEmployeesByDate[date][employeeId] = isHighlighted
│
└─► Employee.jsx re-renders with new highlight state
```

---

### Flow 4: Carry Forward Schedule
```
USER CLICKS "CARRY FORWARD" BUTTON
│
├─► Scheduling.jsx (button onClick)
│   │
│   └─► dispatch({ type: 'FINALIZE_SCHEDULE', payload: { date: selectedDate } })
│
├─► schedule.saga.js (watches 'FINALIZE_SCHEDULE')
│   │
│   └─► axios.post(`/api/schedule/finalize/${date}`)
│
├─► schedule.router.js
│   │
│   ├─► Calculate nextDate = currentDate + 1 day
│   │
│   ├─► BEGIN transaction
│   │
│   ├─► Copy schedule entries to next day:
│   │   INSERT INTO schedule (date, job_id, employee_id, current_location, is_highlighted, employee_display_order)
│   │   SELECT :nextDate, job_id, employee_id, current_location, is_highlighted, employee_display_order
│   │   FROM schedule
│   │   WHERE date = :currentDate
│   │   ON CONFLICT (date, employee_id) DO UPDATE SET...
│   │
│   ├─► Copy project_order entries:
│   │   INSERT INTO project_order (date, job_id, display_order, rain_day)
│   │   SELECT :nextDate, job_id, display_order, false
│   │   FROM project_order
│   │   WHERE date = :currentDate
│   │   ON CONFLICT (date, job_id) DO UPDATE SET...
│   │
│   ├─► COMMIT transaction
│   │
│   └─► res.send({ success: true, nextDate })
│
├─► schedule.saga.js (receives success)
│   │
│   └─► dispatch({ type: 'SET_SELECTED_DATE', payload: nextDate })
│
└─► Date changes, triggers Flow 2 (fetch new date's data)
```

---

### Flow 5: Reordering Projects
```
USER DRAGS PROJECT BOX TO NEW POSITION
│
├─► Scheduling.jsx (moveJob function)
│   │
│   ├─► Optimistically update local state (immediate UI feedback)
│   │
│   └─► dispatch({
│           type: 'UPDATE_PROJECT_ORDER',
│           payload: { orderedProjectIds: [2, 5, 3, 1, 4], date: selectedDate }
│       })
│
├─► project.saga.js (watches 'UPDATE_PROJECT_ORDER')
│   │
│   └─► axios.put('/api/project/updateProjectOrder', {
│           orderedProjectIds,
│           date
│       })
│
├─► project.router.js
│   │
│   ├─► BEGIN transaction
│   │
│   ├─► LOCK TABLE project_order IN EXCLUSIVE MODE
│   │
│   ├─► DELETE FROM project_order WHERE date = :date
│   │
│   ├─► Loop through orderedProjectIds:
│   │   INSERT INTO project_order (date, job_id, display_order)
│   │   VALUES (:date, :jobId, :index)
│   │
│   ├─► COMMIT transaction
│   │
│   └─► res.sendStatus(200)
│
├─► project.saga.js (receives success)
│   │
│   └─► dispatch({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES', payload: { date } })
│
└─► Components re-render with confirmed order from database
```

---

## 🔑 KEY ACTION TYPES

### Schedule Actions
| Action Type | Triggered By | What It Does |
|-------------|--------------|--------------|
| `SET_SELECTED_DATE` | Date picker change | Updates selected date, triggers data fetch |
| `FETCH_EMPLOYEES` | Date change | Gets all employees for a date |
| `FETCH_PROJECTS_WITH_EMPLOYEES` | Date change, after move | Gets projects with assigned employees |
| `FETCH_UNIONS_WITH_EMPLOYEES` | Date change, after move | Gets union boxes with employees |
| `FINALIZE_SCHEDULE` | Carry Forward button | Copies schedule to next day |

### Employee Actions
| Action Type | Triggered By | What It Does |
|-------------|--------------|--------------|
| `MOVE_EMPLOYEE` | Drag-and-drop | Moves employee between locations |
| `SET_HIGHLIGHTED_EMPLOYEE` | Right-click | Toggles employee highlight |
| `UPDATE_EMPLOYEE_ORDER` | Reordering within project | Updates display order |

### Project Actions
| Action Type | Triggered By | What It Does |
|-------------|--------------|--------------|
| `REORDER_PROJECTS` | Dragging project boxes | Updates project display order |
| `UPDATE_PROJECT_ORDER` | After reorder | Saves order to database |
| `UPDATE_RAIN_DAY_STATUS_REQUEST` | Rain day checkbox | Toggles rain day status |

---

## 📦 REDUCER DETAILS

### scheduleReducer.js
**Manages:** Date selection and editable state

**State Shape:**
```javascript
{
  selectedDate: "2026-01-03",      // ISO format string
  isEditable: true,                 // boolean
  employeesByDate: {                // cache of employees by date
    "2026-01-03": [...]
  },
  loading: false,
  error: null
}
```

**Key Actions Handled:**
- `SET_SELECTED_DATE` - Updates date and calculates isEditable
- `FETCH_EMPLOYEES` - Stores employees for a specific date

---

### employeeReducer.js
**Manages:** Employee data and highlight states by date

**State Shape:**
```javascript
{
  employeesByDate: {
    "2026-01-03": [
      { id: 1, first_name: "John", last_name: "Doe", ... }
    ]
  },
  highlightedEmployeesByDate: {
    "2026-01-03": {
      1: true,    // employee_id: isHighlighted
      2: false,
      5: true
    }
  }
}
```

**Key Actions Handled:**
- `SET_EMPLOYEES_FOR_DATE` - Stores employee list for a date
- `SET_HIGHLIGHTED_EMPLOYEE_SUCCESS` - Updates highlight state

---

### projectReducer.js
**Manages:** Project data by date

**State Shape:**
```javascript
{
  date: "2026-01-03",
  projects: [
    {
      id: 2,
      job_id: 2,
      job_number: 102,
      job_name: "Brickwork",
      employees: [...],
      display_order: 0,
      rain_day: false
    }
  ],
  projectsByDate: {
    "2026-01-03": [...]
  },
  error: null
}
```

**Key Actions Handled:**
- `SET_PROJECTS_WITH_EMPLOYEES` - Stores projects for current date
- `REORDER_PROJECTS` - Updates project order optimistically

---

### unionBoxReducer.js
**Manages:** Union box data with employees

**State Shape:**
```javascript
[
  {
    id: 21,
    union_name: "21 - Bricklayers",
    employees: [
      { id: 5, first_name: "Alice", ... }
    ],
    date: "2026-01-03"
  },
  { id: 22, union_name: "22 - Cement Masons/Finishers", ... },
  // ... 6 more unions
]
```

**Key Actions Handled:**
- `SET_UNIONS_WITH_EMPLOYEES` - Replaces entire union array

---

## 🌊 SAGA FLOW PATTERNS

### Pattern 1: Simple API Call
```javascript
// schedule.saga.js - Fetch employees example
function* fetchEmployees(action) {
  try {
    const date = action.payload;
    
    // API call
    const response = yield call(axios.get, `/api/schedule/employees/${date}`);
    
    // Dispatch success action
    yield put({
      type: 'SET_EMPLOYEES_FOR_DATE',
      payload: {
        date,
        employees: response.data.employees,
        highlightedEmployees: response.data.highlightedEmployees
      }
    });
    
  } catch (error) {
    console.error('Error fetching employees:', error);
    yield put({ type: 'FETCH_EMPLOYEES_ERROR', payload: error.message });
  }
}
```

---

### Pattern 2: Sequential Operations
```javascript
// schedule.saga.js - Move employee with refetch
function* moveEmployee(action) {
  try {
    const { employeeId, targetProjectId, dropIndex, date } = action.payload;
    
    // 1. Move the employee
    yield call(axios.post, `/api/moveemployee/${date}`, {
      employeeId,
      targetJobId: targetProjectId,
      targetLocation: 'project',
      dropIndex
    });
    
    // 2. Refetch projects (includes the moved employee)
    yield put({ 
      type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
      payload: { date } 
    });
    
    // 3. Refetch unions (employee removed from union)
    yield put({ 
      type: 'FETCH_UNIONS_WITH_EMPLOYEES', 
      payload: { date } 
    });
    
  } catch (error) {
    console.error('Error moving employee:', error);
    // Refetch anyway to stay in sync with database
    yield put({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES', payload: { date } });
  }
}
```

---

### Pattern 3: Parallel Fetches
```javascript
// schedule.saga.js - Fetch all data for a date
function* fetchScheduleData(action) {
  const date = action.payload;
  
  try {
    // Fire all three requests in parallel
    yield all([
      put({ type: 'FETCH_PROJECTS_WITH_EMPLOYEES', payload: { date } }),
      put({ type: 'FETCH_UNIONS_WITH_EMPLOYEES', payload: { date } }),
      put({ type: 'FETCH_EMPLOYEES', payload: date })
    ]);
    
  } catch (error) {
    console.error('Error fetching schedule data:', error);
  }
}
```

---

## 📅 DATE HANDLING THROUGHOUT THE STACK

### Frontend → Backend → Database

**1. User selects date in DateSchedule.jsx:**
```javascript
// User clicks date picker
const handleDateChange = (event) => {
  const selectedValue = event.target.value;  // "2026-01-04"
  dispatch({ type: 'SET_SELECTED_DATE', payload: selectedValue });
};
```

**2. Redux stores date as ISO string:**
```javascript
// scheduleReducer.js
case 'SET_SELECTED_DATE': {
  return {
    ...state,
    selectedDate: "2026-01-04",  // ISO format: YYYY-MM-DD
    isEditable: calculateIsEditable("2026-01-04")
  };
}
```

**3. Saga passes date to API:**
```javascript
// schedule.saga.js
const response = yield call(
  axios.get, 
  `/api/schedule/employees/2026-01-04`  // Date in URL
);
```

**4. Middleware validates date:**
```javascript
// date-validation.middleware.js
const validateDate = (req, res, next) => {
  const date = req.params.date;  // "2026-01-04"
  
  // Validate format and range
  if (isValidDate(date) && isWithinRange(date)) {
    req.validatedDate = date;
    next();
  } else {
    res.status(400).send('Invalid date');
  }
};
```

**5. Database query uses date:**
```sql
-- In schedule.router.js
SELECT * FROM schedule 
WHERE date = '2026-01-04';  -- PostgreSQL DATE type
```

**6. Response includes date:**
```javascript
// API response
{
  date: "2026-01-04",
  employees: [...],
  highlightedEmployees: {...}
}
```

---

## 🎯 CRITICAL DATE PATTERNS

### Always Use selectedDate from Redux
```javascript
// ✅ CORRECT - In any component
const selectedDate = useSelector(state => state.scheduleReducer.selectedDate);

// Then use it in actions
dispatch({ 
  type: 'MOVE_EMPLOYEE', 
  payload: { employeeId, targetProjectId, date: selectedDate } 
});
```

### Always Pass Date to API
```javascript
// ✅ CORRECT - Every schedule-related endpoint needs date
axios.get(`/api/schedule/employees/${date}`)
axios.post(`/api/moveemployee/${date}`, { ... })
axios.put(`/api/schedule/${date}/${employeeId}/highlight`, { ... })
```

### Always Validate Date in Routes
```javascript
// ✅ CORRECT - Use middleware
router.get('/employees/:date', rejectUnauthenticated, validateDate, async (req, res) => {
  const date = req.validatedDate;  // Already validated by middleware
  // ... query database
});
```

---

## 🔍 DEBUGGING DATA FLOW

### Check Each Layer

**1. Component Level:**
```javascript
// In component
console.log('Selected Date:', selectedDate);
console.log('Is Editable:', isEditable);
console.log('Projects:', projects);
```

**2. Redux DevTools:**
- Watch for dispatched actions
- Inspect state before/after each action
- Verify date is being passed correctly

**3. Network Tab:**
- Check API calls include correct date
- Verify request payloads
- Check response data

**4. Server Logs:**
```javascript
// In route handler
console.log('Received date:', req.validatedDate);
console.log('Query params:', req.params);
console.log('Request body:', req.body);
```

**5. Database:**
```sql
-- Check what's actually in database
SELECT * FROM schedule WHERE date = '2026-01-04';
SELECT * FROM project_order WHERE date = '2026-01-04';
```


*Use this to trace how data moves through application from user action to database and back!*
