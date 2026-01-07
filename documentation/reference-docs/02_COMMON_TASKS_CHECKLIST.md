

# GRESSER SCHEDULING SYSTEM - COMMON TASKS CHECKLIST

**Last Updated:** January 2026  
**Purpose:** Step-by-step workflows for frequent development tasks

---

## 📋 TABLE OF CONTENTS

1. [Adding New Features](#adding-new-features)
2. [Debugging Common Issues](#debugging-common-issues)
3. [Testing & Deployment](#testing--deployment)
4. [Database Operations](#database-operations)
5. [Working with Dates](#working-with-dates)

---

## ➕ ADDING NEW FEATURES

### How to Add a New Feature with Date Support

**Example:** Adding a "Notes" field to employee assignments

**Step 1: Update Database**
```sql
ALTER TABLE schedule ADD COLUMN notes TEXT;
```

**Step 2: Update Backend Route**
```javascript
// In moveemployee.router.js or schedule.router.js
router.post('/moveemployee/:date', rejectUnauthenticated, validateDate, async (req, res) => {
  const { employeeId, targetJobId, notes } = req.body;
  const date = req.validatedDate;
  
  await pool.query(`
    INSERT INTO schedule (date, employee_id, job_id, notes)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (date, employee_id) DO UPDATE SET notes = $4
  `, [date, employeeId, targetJobId, notes]);
});
```

**Step 3: Update Redux Reducer**
```javascript
// In employee.reducer.js or schedule.reducer.js
case 'SET_EMPLOYEE_NOTES': {
  return {
    ...state,
    employeesByDate: {
      ...state.employeesByDate,
      [action.payload.date]: state.employeesByDate[action.payload.date].map(emp =>
        emp.id === action.payload.employeeId
          ? { ...emp, notes: action.payload.notes }
          : emp
      )
    }
  };
}
```

**Step 4: Update Component**
```javascript
// In Employee.jsx or ProjectBox.jsx
const [notes, setNotes] = useState(employee.notes || '');

const handleNotesChange = (e) => {
  setNotes(e.target.value);
  dispatch({
    type: 'UPDATE_EMPLOYEE_NOTES',
    payload: { employeeId: employee.id, notes: e.target.value, date: selectedDate }
  });
};
```

**Step 5: Test**
- Test locally on multiple dates
- Check database updates
- Deploy to Heroku for testing
- Merge to main

---

## 🐛 DEBUGGING COMMON ISSUES

### Issue: Drag-and-Drop Not Working

**Checklist:**
1. Check `isEditable` prop is true
```javascript
   console.log('Is Editable:', isEditable);
```

2. Verify DndProvider wraps components
```javascript
   // In Scheduling.jsx
   <DndProvider backend={HTML5Backend}>
     {/* components */}
   </DndProvider>
```

3. Check drop handlers receive props
```javascript
   const handleDrop = (item) => {
     console.log('Drop item:', item);
     console.log('Is editable:', isEditable);
   };
```

4. Verify date is being passed
```javascript
   moveEmployee({ employeeId, targetProjectId, date: selectedDate });
```

---

### Issue: Employee Highlighting Not Persisting

**Solution:**
1. Check Redux state
```javascript
   store.getState().employeeReducer.highlightedEmployeesByDate[selectedDate]
```

2. Verify API call
```javascript
   axios.put(`/api/schedule/${date}/${employeeId}/highlight`, { isHighlighted: true })
```

3. Check database
```sql
   SELECT employee_id, is_highlighted FROM schedule WHERE date = '2026-01-03';
```

---

### Issue: Date Not Updating Correctly

**Checklist:**
1. Check Redux state
```javascript
   store.getState().scheduleReducer.selectedDate
```

2. Verify middleware validation
```javascript
   // Check server logs for date validation
   console.log('Validated date:', req.validatedDate);
```

3. Check API calls include date
```javascript
   // All schedule endpoints should have :date param
   axios.get(`/api/schedule/employees/${selectedDate}`)
```

---

## 🧪 TESTING & DEPLOYMENT

### Pre-Deployment Testing Checklist

**Local Testing:**
- [ ] Start both servers (backend + frontend)
- [ ] Test on today's date
- [ ] Test on future date (tomorrow)
- [ ] Test on past date (yesterday - should be view-only)
- [ ] Test drag-and-drop (employee movement)
- [ ] Test employee highlighting
- [ ] Test project reordering
- [ ] Test carry-forward button
- [ ] Test rain day toggle
- [ ] Test print layout (both pages)
- [ ] Check browser console (no errors)
- [ ] Check server terminal (no errors)

**Database Verification:**
```sql
-- Check today's assignments
SELECT * FROM schedule WHERE date = CURRENT_DATE;

-- Check project ordering
SELECT * FROM project_order WHERE date = CURRENT_DATE ORDER BY display_order;

-- Check highlights
SELECT employee_id, is_highlighted FROM schedule 
WHERE date = CURRENT_DATE AND is_highlighted = true;
```

---

### Deployment Workflow

**Step 1: Commit Changes**
```bash
git add .
git commit -m "Add [feature description]"
git push origin feature/my-feature
```

**Step 2: Deploy to Heroku (Testing)**
```bash
git push heroku feature/my-feature:main
```

**Step 3: Test on Heroku**
- Open Heroku app URL
- Test all functionality
- Check Heroku logs: `heroku logs --tail`

**Step 4: Merge to Main**
```bash
git checkout main
git merge feature/my-feature
git push origin main
# Heroku auto-deploys from main
```

---

## 🗄️ DATABASE OPERATIONS

### Backup Database

**Local:**
```bash
pg_dump gresser > backup_$(date +%Y%m%d).sql
```

**Production (Render):**
Use Postico to export, or:
```bash
pg_dump [RENDER_CONNECTION_STRING] > production_backup_$(date +%Y%m%d).sql
```

---

### Common Database Queries

**See all schedule data for a date:**
```sql
SELECT 
  e.first_name, 
  e.last_name, 
  j.job_name, 
  s.current_location,
  s.is_highlighted
FROM schedule s
JOIN add_employee e ON s.employee_id = e.id
LEFT JOIN jobs j ON s.job_id = j.job_id
WHERE s.date = '2026-01-03'
ORDER BY s.current_location, j.job_name;
```

**Clear schedule for a specific date:**
```sql
DELETE FROM schedule WHERE date = '2026-01-03';
DELETE FROM project_order WHERE date = '2026-01-03';
```

**Reset all highlights:**
```sql
UPDATE schedule SET is_highlighted = false WHERE date = '2026-01-03';
```

---

## 📅 WORKING WITH DATES

### Always Use ISO Format
```javascript
// ✅ CORRECT
const date = "2026-01-03";  // YYYY-MM-DD

// ❌ WRONG
const date = "01/03/2026";  // MM/DD/YYYY
const date = "January 3, 2026";
```

### Get Selected Date
```javascript
const selectedDate = useSelector(state => state.scheduleReducer.selectedDate);
```

### Pass Date to All API Calls
```javascript
// ✅ CORRECT - Date in URL
axios.get(`/api/schedule/employees/${selectedDate}`)
axios.post(`/api/moveemployee/${selectedDate}`, { ... })

// ❌ WRONG - Missing date
axios.get('/api/schedule/employees')
```

### Validate Date Range
```javascript
// Check if date is editable
const isEditable = useSelector(state => state.scheduleReducer.isEditable);

// Only allow operations if editable
if (isEditable) {
  // Perform drag-drop, moves, etc.
}
```

---

## 🔄 QUICK FIXES

### Clear Redux State
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

### Restart Development Servers
```bash
# Stop both servers (Ctrl+C)
# Then restart
npm run server
npm run client
```

### Check What's Running on Ports
```bash
lsof -i :5001  # Backend
lsof -i :5173  # Frontend
```


