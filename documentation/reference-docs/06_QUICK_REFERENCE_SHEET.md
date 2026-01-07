# GRESSER SCHEDULING SYSTEM - QUICK REFERENCE SHEET

**Last Updated:** January 2026  
**Purpose:** Fast lookup for common commands, file locations, and daily tasks

---

## 🚀 GETTING STARTED

### Start Development Servers
```bash
# Terminal 1 - Backend (port 5001)
npm run server

# Terminal 2 - Frontend (port 5173)
npm run client

# Open browser
open http://localhost:5173
```

### Stop Servers
```bash
# Press Ctrl+C in each terminal
```

---

## 📁 CRITICAL FILE LOCATIONS

### Frontend Components
```
src/components/Scheduling/Scheduling.jsx          # Main schedule page
src/components/Scheduling/DateSchedule.jsx        # Date picker
src/components/Scheduling/ProjectBox.jsx          # Project containers
src/components/Scheduling/Employee.jsx            # Employee items
src/components/Trades/UnionBox.jsx                # Union containers
src/components/Nav/Nav.jsx                        # Navigation bar
```

### Redux Files
```
src/redux/reducers/schedule.reducer.js            # Date, isEditable
src/redux/reducers/employee.reducer.js            # Employees, highlights
src/redux/reducers/project.reducer.js             # Projects by date
src/redux/reducers/unionBox.reducer.js            # Union data
src/redux/sagas/schedule.saga.js                  # Main scheduling logic
src/redux/store.js                                # Redux store
```

### Backend Routes
```
server/routes/schedule.router.js                  # Schedule endpoints
server/routes/moveemployee.router.js              # Move employee logic
server/routes/project.router.js                   # Project operations
server/routes/jobs.router.js                      # Job CRUD
server/routes/addemployee.router.js               # Employee CRUD
server/routes/date-validation.middleware.js       # Date validation
```

### Configuration
```
server/modules/pool.js                            # Database connection
server/server.js                                  # Server entry point
package.json                                      # Dependencies
```

---

## 🗄️ DATABASE QUICK REFERENCE

### Connect to Database
```bash
# Local database
psql -d gresser

# Production (Render) - use Postico with connection string
```

### Core Tables
```sql
add_employee        -- Employee info (226+ employees)
jobs               -- Project info (28+ projects)
schedule           -- Daily assignments (core table!)
project_order      -- Project ordering per date
unions             -- Union reference (8 unions)
```

### Key Queries
```sql
-- See today's schedule
SELECT * FROM schedule WHERE date = CURRENT_DATE;

-- Active employees
SELECT * FROM add_employee WHERE employee_status = true;

-- Active projects
SELECT * FROM jobs WHERE status = 'Active';

-- Employee assignments for a date
SELECT e.first_name, e.last_name, j.job_name, s.current_location
FROM schedule s
JOIN add_employee e ON s.employee_id = e.id
LEFT JOIN jobs j ON s.job_id = j.job_id
WHERE s.date = '2026-01-03';
```

---

## 🔧 COMMON GIT COMMANDS

### Daily Workflow
```bash
# Check status
git status

# Create new feature branch
git checkout -b feature/my-feature

# Stage changes
git add .
# OR stage specific files
git add src/components/Scheduling/Scheduling.jsx

# Commit with clear message
git commit -m "Add date validation to employee movement"

# Push to GitHub
git push origin feature/my-feature

# Switch branches
git checkout main
git checkout fix/drag-drop-initialization

# Pull latest changes
git pull origin main
```

### Deployment
```bash
# Deploy feature branch to Heroku for testing
git push heroku feature/my-feature:main

# After testing, merge to main
git checkout main
git merge feature/my-feature
git push origin main
# Heroku auto-deploys from main

# Check Heroku logs
heroku logs --tail --app gresser-scheduler
```

---

## 🎯 REDUX STATE QUICK REFERENCE

### Access Redux State in Browser Console
```javascript
// After adding window.store = store to store.js
store.getState()

// Get specific reducer
store.getState().scheduleReducer
store.getState().projectReducer
store.getState().employeeReducer
```

### State Structure
```javascript
scheduleReducer: {
  selectedDate: "2026-01-03",       // ISO format
  isEditable: true,                  // Can edit this date?
  employeesByDate: { ... },
  loading: false,
  error: null
}

employeeReducer: {
  employeesByDate: { 
    "2026-01-03": [226 employees]
  },
  highlightedEmployeesByDate: {
    "2026-01-03": { 123: true, 456: false }
  }
}

projectReducer: {
  date: "2026-01-03",
  projects: [28 projects],
  projectsByDate: { ... },
  error: null
}
```

---

## 🛣️ API ENDPOINTS CHEAT SHEET

### Schedule Endpoints
```
GET    /api/schedule/employees/:date          # All employees for date
GET    /api/schedule/withunions/:date         # Unions with employees
GET    /api/schedule/:date                    # Projects for date
PUT    /api/schedule/:date/:id/highlight      # Toggle employee highlight
POST   /api/schedule/finalize/:date           # Carry forward to next day
```

### Employee Movement
```
POST   /api/moveemployee/:date                # Move employee to project/union
```

### Project Operations
```
GET    /api/project/withEmployees/:date       # Projects with employees
PUT    /api/project/updateProjectOrder        # Reorder projects
PUT    /api/project/updateOrder               # Reorder employees in project
PUT    /api/project/:jobId/rainday            # Toggle rain day
```

### Employee CRUD
```
GET    /api/addemployee                       # All employees
POST   /api/addemployee                       # Create employee
PUT    /api/addemployee/:id                   # Update employee
```

### Job CRUD
```
GET    /api/jobs                              # All jobs
POST   /api/jobs                              # Create job
PUT    /api/jobs/:job_id                      # Update job
DELETE /api/jobs/:job_id                      # Delete job
```

---

## 🎨 DATE FORMAT REFERENCE

### How Dates Are Stored
```javascript
// Redux state
selectedDate: "2026-01-03"  // ISO format: YYYY-MM-DD

// Database
date: '2026-01-03'          // PostgreSQL DATE type

// JavaScript Date objects (always set to noon)
const date = new Date(dateString + 'T12:00:00');
```

### Date Validation Rules
```javascript
// Editable range
Today through Today + 7 days

// Example (if today is Jan 3, 2026):
Editable: Jan 3 - Jan 10, 2026
View-only: Jan 2 and earlier
```

---

## 🐛 DEBUGGING QUICK TIPS

### Check Redux State
```javascript
// Browser console
store.getState().scheduleReducer.selectedDate
store.getState().projectReducer.projects
store.getState().employeeReducer.highlightedEmployeesByDate
```

### Check Database
```sql
-- What date is being used?
SELECT DISTINCT date FROM schedule ORDER BY date DESC LIMIT 10;

-- Is employee highlighted?
SELECT employee_id, is_highlighted 
FROM schedule 
WHERE date = '2026-01-03' AND is_highlighted = true;

-- Project ordering
SELECT date, job_id, display_order 
FROM project_order 
WHERE date = '2026-01-03' 
ORDER BY display_order;
```

### Common Console Errors
```javascript
// "store is not defined"
// Fix: Add window.store = store to src/redux/store.js

// "Cannot read property 'map' of undefined"
// Fix: Check if data exists before mapping
employees?.map(...) or (employees || []).map(...)

// Drag-drop not working
// Check: isEditable prop is being passed correctly
// Check: react-dnd context is wrapping components
```

---

## 📋 COMMON TASKS SHORTCUTS

### "I need to..."

**...add a new feature with dates**
1. Update reducer to handle date-based data
2. Update saga to pass date to API
3. Update route to accept date parameter
4. Update component to use selectedDate from Redux

**...debug a drag-drop issue**
1. Check Redux DevTools for state changes
2. Check browser console for errors
3. Verify `isEditable` is true
4. Check drop handlers are receiving correct props

**...test a change before deploying**
1. Test locally (localhost:5173)
2. Check console for errors
3. Test on different dates (today, future, past)
4. Deploy to Heroku feature branch
5. Test on Heroku URL
6. Merge to main if all good

**...fix a database issue**
1. Check Postico for actual data
2. Run query to verify state
3. Check server logs for errors
4. Use transactions (BEGIN/COMMIT/ROLLBACK)

**...understand data flow**
1. User action → Component
2. Component → Dispatch action
3. Action → Saga
4. Saga → API call
5. API → Database
6. Response → Reducer
7. Reducer → Component re-renders

---

## 🔑 KEY REDUX ACTION TYPES

### Schedule Actions
```javascript
'SET_SELECTED_DATE'                    // Change current date
'FETCH_EMPLOYEES'                      // Get employees for date
'FETCH_PROJECTS_WITH_EMPLOYEES'        // Get projects for date
'FETCH_UNIONS_WITH_EMPLOYEES'          // Get unions for date
'FINALIZE_SCHEDULE'                    // Carry forward to next day
```

### Employee Actions
```javascript
'MOVE_EMPLOYEE'                        // Move employee to project/union
'SET_HIGHLIGHTED_EMPLOYEE'             // Toggle highlight
'UPDATE_EMPLOYEE_ORDER'                // Reorder within project
```

### Project Actions
```javascript
'REORDER_PROJECTS'                     // Change project box order
'UPDATE_PROJECT_ORDER'                 // Save order to database
'UPDATE_RAIN_DAY_STATUS_REQUEST'       // Toggle rain day
```

---

## 💡 HELPFUL COMMANDS

### Package Management
```bash
# Install dependencies
npm install

# Add new package
npm install package-name

# Update packages
npm update
```

### Database Backups
```bash
# Backup local database
pg_dump gresser > backup_$(date +%Y%m%d).sql

# Restore from backup
psql gresser < backup_20260103.sql
```

### Heroku Management
```bash
# Check Heroku apps
heroku apps

# View config variables
heroku config --app gresser-scheduler

# Restart app
heroku restart --app gresser-scheduler

# Open app in browser
heroku open --app gresser-scheduler
```

---

## 🎯 UNION REFERENCE

### Union IDs and Colors
```
21 - Bricklayers              RED
22 - Cement Masons/Finishers  GREEN
23 - Laborers                 BLACK
24 - Operators                PURPLE
25 - Carpenters               BLUE
26 - Supervisors              HOT PINK
27 - Trucking                 ORANGE
28 - Shop                     ROYAL BLUE
```

---

## 📞 CONTACTS

### Client
- **Shannon Rooney** (primary)
- **Rachel Abilez** (feedback)
- **Ted Carlsen** (stakeholder)

### Development
- **Solo Developer:** Crystal EvenRam
- **Rate:** $35/hour
- **Track:** All time (design, planning, debugging, coding)

---

## 🚨 EMERGENCY FIXES

### App Won't Start
```bash
# Check node modules
rm -rf node_modules
npm install

# Check ports
lsof -i :5001  # Backend
lsof -i :5173  # Frontend
```

### Database Connection Failed
```bash
# Check Render database status
# Check DATABASE_URL in .env
# Test connection in Postico
```

### Heroku Deploy Failed
```bash
# Check Heroku logs
heroku logs --tail --app gresser-scheduler

# Check build logs
heroku builds --app gresser-scheduler
```


*Daily development tasks!*
