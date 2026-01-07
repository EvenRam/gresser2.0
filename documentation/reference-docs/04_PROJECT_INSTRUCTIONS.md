# GRESSER SCHEDULING SYSTEM - PROJECT INSTRUCTIONS

**Last Updated:** January 2026  
**Developer:** Crystal EvenRam  
**Repository:** github.com/EvenRam/gresser2.0  
**Branch:** fix/drag-drop-initialization

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Business Context](#business-context)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [How the System Works](#how-the-system-works)
6. [Current Implementation Status](#current-implementation-status)
7. [Development Workflow](#development-workflow)
8. [Known Issues](#known-issues)
9. [Future Roadmap](#future-roadmap)

---

## 📖 PROJECT OVERVIEW

### What This Application Does
Employee scheduling system for Gresser Companies, a concrete and masonry contractor. The application replaces their legacy "Hedgehog" system (early 2000s) with a modern, date-based scheduling interface.

### Core Functionality
- **Date-based scheduling:** Track employee assignments for specific dates (today + 7 days ahead)
- **Drag-and-drop interface:** Move employees between union boxes and project boxes
- **Visual organization:** Color-coded unions, employee highlighting, rain day tracking
- **Historical data:** Past dates are view-only to preserve scheduling history
- **Print layouts:** Optimized 2-page format (projects page 1, unions page 2)

### Key Metrics
- **226+ active employees** across 8 unions
- **28+ active projects** at any given time
- **8 union categories:** Bricklayers (21), Cement Masons (22), Laborers (23), Operators (24), Carpenters (25), Supervisors (26), Trucking (27), Shop (28)

---

## 🏢 BUSINESS CONTEXT

### Client Information
**Company:** Gresser Companies  
**Location:** 3 Checkered Flag Blvd, Shakopee, MN 55379  
**Established:** 1969  
**Industry:** Commercial concrete and masonry contractor

### Primary Contacts
- **Shannon Rooney** (primary contact)
- **Rachel Abilez** (feedback, feature requests)
- **Ted Carlsen** (stakeholder)

**Note:** Brittaney Groth (HR & Payroll) is no longer with the company.

### User Roles
1. **Admin:** Full access to all features
2. **Project Managers:** Add/edit/delete jobs, scheduling
3. **Superintendents:** Scheduling, daily assignments
4. **Foremen:** Read-only access to view schedules

### Original Requirements (from client spec)
✅ Digital whiteboard similar to Trello with drag-and-drop  
✅ Color-coded by union affiliation  
✅ Detailed job information with employee tracking  
✅ Visual indicators when employees are moved  
✅ Daily schedule creation with carry-forward functionality  
✅ Reporting and work history  
⏳ Project History page (in design phase)  
📋 Alerts/notifications to groups or individuals (stretch goal - not implemented)

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack

**Frontend:**
- React 18 with React Router
- Redux for state management
- Redux-Saga for async operations
- react-dnd (drag-and-drop library)
- Vite (build tool)

**Backend:**
- Node.js with Express
- PostgreSQL database
- Session-based authentication

**Deployment:**
- **Application:** Heroku
- **Database:** Render (PostgreSQL hosting)
- **Version Control:** GitHub

### File Structure
```
gresser2.0/
├── src/
│   ├── components/
│   │   ├── Scheduling/
│   │   │   ├── Scheduling.jsx (main schedule page)
│   │   │   ├── SchedulingLayout.jsx (layout wrapper)
│   │   │   ├── DateSchedule.jsx (date picker)
│   │   │   ├── ProjectBox.jsx (individual project container)
│   │   │   ├── DraggableJobBox.jsx (draggable wrapper)
│   │   │   └── Employee.jsx (employee component)
│   │   ├── Trades/
│   │   │   ├── UnionBox.jsx (union container)
│   │   │   └── UnionColors.jsx (color definitions)
│   │   ├── AddEmployee/ (employee management)
│   │   ├── CreateJobs/ (project management)
│   │   ├── JobHistory/ (project history - in development)
│   │   └── Nav/ (navigation)
│   ├── redux/
│   │   ├── reducers/
│   │   │   ├── schedule.reducer.js (date, isEditable)
│   │   │   ├── employee.reducer.js (employees by date, highlights)
│   │   │   ├── project.reducer.js (projects by date)
│   │   │   └── unionBox.reducer.js (union data)
│   │   ├── sagas/
│   │   │   ├── schedule.saga.js (main scheduling logic)
│   │   │   ├── employee.saga.js
│   │   │   └── job.saga.js
│   │   └── store.js
│   └── hooks/
│       └── useReduxStore.js
├── server/
│   ├── routes/
│   │   ├── schedule.router.js (schedule endpoints)
│   │   ├── moveemployee.router.js (employee movement)
│   │   ├── project.router.js (project operations)
│   │   ├── jobs.router.js (job CRUD)
│   │   ├── addemployee.router.js (employee CRUD)
│   │   └── date-validation.middleware.js (date validation)
│   ├── modules/
│   │   ├── pool.js (database connection)
│   │   └── authentication-middleware.js
│   └── server.js
├── public/ (static assets - logos, favicon)
└── documentation/ (images, project docs)
```

### Key Dependencies
- `react-dnd`: Drag-and-drop functionality
- `redux-saga`: Async state management
- `axios`: HTTP requests
- `pg`: PostgreSQL client

---

## 🗄️ DATABASE SCHEMA

### Tables

#### **add_employee**
Stores employee information.
```sql
CREATE TABLE "add_employee" (
  "id" SERIAL PRIMARY KEY,
  "first_name" VARCHAR(80),
  "last_name" VARCHAR(80),
  "employee_number" VARCHAR(80) UNIQUE,
  "employee_status" BOOLEAN,  -- TRUE = active, FALSE = inactive
  "phone_number" VARCHAR(80),
  "email" VARCHAR(80),
  "address" VARCHAR(120),
  "union_id" INT,
  FOREIGN KEY ("union_id") REFERENCES "unions" ("id")
);
```

#### **jobs**
Stores project/job information.
```sql
CREATE TABLE "jobs" (
  "job_id" SERIAL PRIMARY KEY,
  "job_number" INT,
  "job_name" VARCHAR(1000),
  "location" VARCHAR(1000),
  "start_date" DATE,  -- Still in schema but removed from UI
  "end_date" DATE,    -- Still in schema but removed from UI
  "status" VARCHAR(20) DEFAULT 'Active',  -- 'Active' or 'Inactive'
  "rain_day" BOOLEAN DEFAULT false
);
```

#### **schedule** ⭐ CORE TABLE
Tracks daily employee assignments.
```sql
CREATE TABLE "schedule" (
  "schedule_id" SERIAL PRIMARY KEY,
  "date" DATE NOT NULL,
  "job_id" INT,  -- NULL = in union, NOT NULL = assigned to project
  "employee_id" INT NOT NULL,
  "current_location" VARCHAR(50) DEFAULT 'union',  -- 'union' or 'project'
  "is_highlighted" BOOLEAN DEFAULT false,
  "employee_display_order" INTEGER,  -- Order within project box
  "project_display_order" INTEGER,   -- Deprecated (not used)
  FOREIGN KEY ("job_id") REFERENCES "jobs" ("job_id"),
  FOREIGN KEY ("employee_id") REFERENCES "add_employee" ("id"),
  UNIQUE ("date", "employee_id")  -- One employee can only be in one place per day
);
```

#### **project_order**
Tracks project ordering and rain day status per date.
```sql
CREATE TABLE "project_order" (
  "id" SERIAL PRIMARY KEY,
  "date" DATE NOT NULL,
  "job_id" INT NOT NULL,
  "display_order" INT,
  "rain_day" BOOLEAN DEFAULT false,
  FOREIGN KEY ("job_id") REFERENCES "jobs" ("job_id"),
  UNIQUE ("date", "job_id")
);
```

#### **unions**
Reference table for union categories.
```sql
CREATE TABLE "unions" (
  "id" SERIAL PRIMARY KEY,
  "union_name" VARCHAR(80)
);

-- Data:
-- 21 - Bricklayers
-- 22 - Cement Masons/Finishers
-- 23 - Laborers
-- 24 - Operators
-- 25 - Carpenters
-- 26 - Supervisors
-- 27 - Trucking
-- 28 - Shop
```

### Database Relationships
```
unions (1) ─→ (many) add_employee
jobs (1) ─→ (many) schedule
add_employee (1) ─→ (many) schedule
jobs (1) ─→ (many) project_order
```

### Critical Database Patterns

**Date-Based Partitioning:**
All scheduling data is partitioned by date. Each date has:
- Its own set of employee assignments (`schedule` table)
- Its own project ordering (`project_order` table)
- Its own rain day status per project

**Conflict Handling:**
```sql
INSERT INTO schedule (...) 
VALUES (...)
ON CONFLICT (date, employee_id) 
DO UPDATE SET ...
```
This prevents duplicate entries for the same employee on the same day.

---

## ⚙️ HOW THE SYSTEM WORKS

### Employee Flow

**1. Adding Employees**
- Admin creates employee in "Employees" page
- Employee data stored in `add_employee` table
- `employee_status = TRUE` makes them active

**2. Employee Rendering**
- Active employees (`employee_status = TRUE`) appear in union boxes
- Database query: `current_location = 'union'` for current date
- Employees grouped by `union_id`

**3. Moving Employees (Drag-and-Drop)**
- User drags employee from union box to project box
- Frontend dispatches `MOVE_EMPLOYEE` action
- Saga calls `/api/moveemployee/:date` endpoint
- Database updates:
```sql
  UPDATE schedule SET
    job_id = [target_project_id],
    current_location = 'project',
    is_highlighted = TRUE,
    employee_display_order = [drop_index]
  WHERE date = [selected_date] AND employee_id = [employee_id]
```

**4. Visual Highlighting**
- Moved employees are automatically highlighted (yellow background)
- Right-click to toggle highlight on/off
- Highlight status stored in `schedule.is_highlighted`
- Persists across page refreshes

**5. Moving Back to Union**
- Drag employee from project box to union box
- Database updates:
```sql
  UPDATE schedule SET
    job_id = NULL,
    current_location = 'union',
    is_highlighted = TRUE
  WHERE date = [selected_date] AND employee_id = [employee_id]
```

### Project Flow

**1. Adding Projects**
- Admin creates project in "Projects" page
- Project data stored in `jobs` table
- `status = 'Active'` makes it visible on schedule

**2. Project Rendering**
- Active projects (`status = 'Active'`) appear as project boxes
- Backend query joins `jobs` + `schedule` + `project_order` tables
- Projects sorted by `display_order` (nulls last)

**3. Project Ordering (Drag-and-Drop)**
- User drags project boxes to reorder
- Frontend dispatches `UPDATE_PROJECT_ORDER` action
- Backend updates `project_order` table with new order
- Empty projects automatically sort to bottom

**4. Rain Day Toggle**
- Checkbox in project box footer
- Stored per date in `project_order.rain_day`
- Visual indicator for scheduling purposes

### Date-Based Scheduling

**Date Selection:**
- User selects date via date picker (DateSchedule.jsx)
- Range: Today through today + 7 days
- Stored in Redux: `scheduleReducer.selectedDate` (ISO format: "YYYY-MM-DD")

**Editable vs. View-Only:**
```javascript
const today = new Date().toISOString().split('T')[0];
const maxDate = new Date(today);
maxDate.setDate(maxDate.getDate() + 7);

isEditable = selectedDate >= today && selectedDate <= maxDate;
```
- **Editable (today through +7 days):** Full drag-and-drop, highlighting, editing
- **View-only (past dates):** Read-only historical data

**Data Fetching:**
When date changes, app fetches:
1. Projects with employees for that date
2. Union boxes with employees for that date
3. Employee assignments and highlights for that date

**Carry-Forward Functionality:**
- "Carry Forward" button copies current day's schedule to next day
- Backend endpoint: `/api/schedule/finalize/:date`
- Copies both `schedule` entries and `project_order` entries
- Automatically advances to next day after copy

### Redux State Structure
```javascript
{
  scheduleReducer: {
    selectedDate: "2026-01-03",        // Current selected date
    isEditable: true,                   // Can user edit this date?
    employeesByDate: {
      "2026-01-03": [...]              // All employees for this date
    },
    loading: false,
    error: null
  },

  employeeReducer: {
    employeesByDate: {
      "2026-01-03": [...]              // Employee data by date
    },
    highlightedEmployeesByDate: {
      "2026-01-03": {
        123: true,                      // employee_id: isHighlighted
        456: false
      }
    }
  },

  projectReducer: {
    date: "2026-01-03",
    projects: [...],                    // Current projects array
    projectsByDate: {
      "2026-01-03": [...]              // Projects by date
    },
    error: null
  },

  unionBoxReducer: [
    {
      id: 21,
      union_name: "21 - Bricklayers",
      employees: [...],
      date: "2026-01-03"
    },
    // ... 7 more unions
  ]
}
```

---

## ✅ CURRENT IMPLEMENTATION STATUS

### Completed Features ✅

**Core Scheduling:**
- ✅ Date-based scheduling (today + 7 days)
- ✅ Drag-and-drop employee assignment
- ✅ Drag-and-drop project reordering
- ✅ Employee highlighting (auto on move, right-click toggle)
- ✅ Rain day toggle per project
- ✅ Carry-forward to next day
- ✅ View-only mode for past dates

**Employee Management:**
- ✅ Add/edit/delete employees
- ✅ Toggle active/inactive status
- ✅ Employee display order within projects
- ✅ Union color coding

**Project Management:**
- ✅ Add/edit/delete projects
- ✅ Toggle active/inactive status
- ✅ Project ordering with drag-and-drop
- ✅ Combined display (job number + name)
- ✅ Auto-sort projects table by job number
- ✅ Removed start/end date fields from UI

**Print Functionality:**
- ✅ 2-page optimized layout
- ✅ Page 1: Project assignments
- ✅ Page 2: Union boxes
- ✅ Formatted date display

**Bug Fixes (Oct-Dec 2025):**
- ✅ Weekend carry-forward working correctly
- ✅ Print date formatting fixed
- ✅ Employee highlighting persistence across refreshes
- ✅ Duplicate project cleanup

### In Progress 🔄

**Current Branch:** `fix/drag-drop-initialization`
- ⚠️ Drag-and-drop initialization timing issue
  - **Problem:** Hesitates on first page load, works perfectly after refresh
  - **Impact:** Annoying but not blocking
  - **Status:** Actively debugging

**Project History Page:**
- 📋 Wireframes and scope document complete
- 📋 Awaiting client approval
- 📋 Estimated: 35-44 hours development
- 📋 Timeline: 4-5 weeks from approval

### Planned Features 📋

**Phase 3 (Stretch Goals):**
- 📋 Alerts/notifications system (email/SMS)
- 📋 Group messaging for job assignments
- 📋 Communication tools integration

**Maintenance:**
- 📋 Database cleanup (duplicate projects)
- 📋 Final database refresh after all features tested
- 📋 Password reset functionality (missing)

---

## 🔧 DEVELOPMENT WORKFLOW

### Branch Strategy
- **main:** Production-ready code
- **Feature branches:** Named `feature/description` or `fix/description`
- **Current:** `fix/drag-drop-initialization`

### Standard Development Process

**1. Local Development**
```bash
# Start local servers
npm run server  # Backend on port 5001
npm run client  # Frontend on port 5173

# Test locally at localhost:5173
```

**2. Git Workflow**
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, test locally
git add [files]
git commit -m "Clear description of what changed"

# Push to GitHub
git push origin feature/my-feature
```

**3. Deploy to Heroku (Testing)**
```bash
# From feature branch:
git push heroku feature/my-feature:main

# Test on Heroku URL
# If bugs found, fix and push again
```

**4. Merge to Main (Production)**
```bash
# After Heroku testing passes:
git checkout main
git merge feature/my-feature
git push origin main

# Heroku auto-deploys from main branch
```

### Testing Checklist

**Before Deploying:**
- [ ] Test drag-and-drop functionality
- [ ] Test date picker and date changes
- [ ] Test employee highlighting
- [ ] Test carry-forward button
- [ ] Test print layout (both pages)
- [ ] Check console for errors
- [ ] Verify database queries in Postico
- [ ] Test on multiple dates (today, future, past)

**After Heroku Deploy:**
- [ ] Logo displays correctly
- [ ] All features work same as local
- [ ] Database connections stable
- [ ] No console errors in production

### Database Management

**Local Database:**
```bash
# View database
psql -d gresser

# Backup local database
pg_dump gresser > backup_$(date +%Y%m%d).sql
```

**Production Database (Render):**
- Access via Postico using Render connection URL
- Backups stored in `~/gresser_backups/`
- **IMPORTANT:** Database refresh planned after all features tested

### Environment Variables
```
DATABASE_URL=postgresql://...  # Render database
SESSION_SECRET=...
PORT=5001
NODE_ENV=development  # or production
```

---

## 🐛 KNOWN ISSUES

### Active Issues

**1. Drag-Drop Initialization Timing** (Priority: Medium)
- **Symptom:** Drag-and-drop hesitates on first page load
- **Workaround:** Refresh page, then works perfectly
- **Status:** Actively debugging
- **Branch:** fix/drag-drop-initialization

**2. Client-Reported Data Loss** (Priority: High - Cannot Reproduce)
- **Reporter:** Rachel Abilez (Dec 18, 2025)
- **Symptom:** "Having to rebuild schedule because of simple click on wrong tab"
- **Status:** Awaiting walkthrough from Rachel to reproduce
- **Action:** Request meeting to see exact steps

**3. Logo Not Showing on Heroku** (Priority: Low)
- **Symptom:** Logo displays locally but not on Heroku
- **Likely Cause:** Static file serving issue
- **Fix in progress:** Move logo to `public/` folder

### Database Issues

**Duplicate Projects:**
- Some job numbers have duplicate entries (ex: three "1001 - New Construction")
- Cleaned up some duplicates
- More cleanup needed during final database refresh

**Historical Data:**
- No archiving strategy for old schedule data
- Database will grow indefinitely
- Consider archiving schedules older than 1 year (future enhancement)

---

## 🚀 FUTURE ROADMAP

### Phase 1: Core Features (COMPLETE ✅)
- ✅ Date-based scheduling
- ✅ Drag-and-drop interface
- ✅ Employee and project management
- ✅ Print functionality
- ✅ Carry-forward scheduling

### Phase 2: Reporting (IN PROGRESS 🔄)
- 🔄 Project History page (designed, awaiting approval)
  - Search by Date, Project, Employee
  - Export to PDF and CSV
  - Display assignments, rain days, employee counts

### Phase 3: Communication (PLANNED 📋)
- 📋 Email/SMS alerts when employees moved
- 📋 Group messaging for project assignments
- 📋 Notification preferences by user role
- 📋 Integration with communication tools

### Phase 4: Enhancements (FUTURE 💭)
- 💭 Data archiving strategy
- 💭 Advanced reporting and analytics
- 💭 Mobile app (iOS/Android)
- 💭 Real-time collaboration (multiple users editing simultaneously)
- 💭 Automated testing (unit, integration, E2E)

### Scalability Considerations

**Current Design Strengths:**
- ✅ Date-based architecture scales to unlimited dates
- ✅ Separate tables for schedule, projects, employees
- ✅ Union system is extensible (already grew from 5 to 8)

**Potential Bottlenecks:**
- ⚠️ No data archiving (schedule table will grow forever)
- ⚠️ Large employee pools (226 is fine, 1000+ might need optimization)
- ⚠️ No caching strategy for frequently accessed dates

**Future Optimization Opportunities:**
- Redis caching for current/recent dates
- Database indexing optimization
- Lazy loading for large employee lists
- Pagination for historical data

---

## 📞 SUPPORT & CONTACTS

### Client Communication
**Primary Contact:** Shannon Rooney  
**Additional Contacts:** Rachel Abilez, Ted Carlsen

**Communication Pattern:**
- Status updates via email
- Feature requests documented before implementation
- Scope documents prepared for new features
- Meetings scheduled for design review and approval

### Developer Notes
- Billing: $35/hour
- Track ALL time: design, planning, debugging, development
- Document hours in billable work tracker
- Infrastructure costs: Heroku + Render database hosting

### Resources
- **Repository:** github.com/EvenRam/gresser2.0
- **Heroku App:** [Heroku URL]
- **Database:** Render PostgreSQL
- **Documentation:** `/documentation` folder in repo

---

## 🎯 DEVELOPMENT PHILOSOPHY

### Code Quality Principles
1. **Understand before implementing** - Know WHY, not just WHAT
2. **Test thoroughly** - 8+ tests for critical features like carry-forward
3. **Preserve data integrity** - Transactions, conflict handling, rollback on errors
4. **Document decisions** - Comments explain reasoning, not just what code does
5. **Maintain consistency** - Follow established patterns and naming conventions

### Client Management Principles
1. **Document all feedback** - Track what's requested vs. completed
2. **Prepare scope documents** - Wireframes and estimates before building
3. **Communicate proactively** - Status updates, not just responses
4. **Set clear expectations** - Timeline, cost, what's included vs. not
5. **Value your time** - Bill for design, planning, debugging, not just coding

---


*This document should be updated as the project evolves. Keep it as the authoritative reference for understanding the Gresser Scheduling System.*
