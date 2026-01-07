# GRESSER SCHEDULING SYSTEM - API ENDPOINTS GUIDE

**Last Updated:** January 2026  
**Purpose:** Complete backend API reference with routes, parameters, and examples

---

## 📋 TABLE OF CONTENTS

1. [API Overview](#api-overview)
2. [Schedule Endpoints](#schedule-endpoints)
3. [Employee Movement Endpoints](#employee-movement-endpoints)
4. [Project Endpoints](#project-endpoints)
5. [Job/Project CRUD Endpoints](#jobproject-crud-endpoints)
6. [Employee CRUD Endpoints](#employee-crud-endpoints)
7. [Authentication & Middleware](#authentication--middleware)
8. [Common Patterns](#common-patterns)

---

## 🌐 API OVERVIEW

### Base Configuration
- **Base URL (Local):** `http://localhost:5001/api`
- **Base URL (Production):** `https://gresser-scheduler.herokuapp.com/api`
- **Authentication:** Session-based (cookies)
- **Date Format:** ISO 8601 (YYYY-MM-DD)

### Common Headers
```javascript
{
  "Content-Type": "application/json",
  "Cookie": "connect.sid=..." // Managed by passport
}
```

### Common Response Codes
- `200` - Success
- `201` - Created
- `204` - Success (no content)
- `400` - Bad request (invalid data)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (invalid date range)
- `404` - Not found
- `500` - Server error

---

## 📅 SCHEDULE ENDPOINTS

### GET /api/schedule/employees/:date
**Purpose:** Fetch all employees and their highlight status for a specific date

**Authentication:** Required

**Parameters:**
- `:date` (URL param) - Date in YYYY-MM-DD format

**Validation:**
- Date must be valid format
- Date must be within range (today through +7 days for modifications)

**Response:**
```javascript
{
  "date": "2026-01-03",
  "employees": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "employee_number": "12345",
      "employee_status": true,
      "phone_number": "555-1234",
      "email": "john@example.com",
      "address": "123 Main St",
      "union_id": 21,
      "current_location": "union",
      "is_highlighted": false,
      "display_order": null
    }
  ],
  "highlightedEmployees": {
    "5": true,
    "12": true,
    "23": false
  }
}
```

**Example Request:**
```javascript
axios.get('/api/schedule/employees/2026-01-03')
```

---

### GET /api/schedule/withunions/:date
**Purpose:** Fetch union boxes with their employees for a specific date

**Authentication:** Required

**Parameters:**
- `:date` (URL param) - Date in YYYY-MM-DD format

**Special Behavior:**
- **Past dates:** Shows all employees who were scheduled (regardless of current active status)
- **Current/future dates:** Only shows currently active employees

**Response:**
```javascript
{
  "date": "2026-01-03",
  "unions": [
    {
      "id": 21,
      "union_name": "21 - Bricklayers",
      "employees": [
        {
          "id": 5,
          "first_name": "Alice",
          "last_name": "Smith",
          "employee_status": true,
          "current_location": "union",
          "union_id": 21,
          "is_highlighted": false,
          "display_order": 0
        }
      ]
    }
  ]
}
```

**Example Request:**
```javascript
axios.get('/api/schedule/withunions/2026-01-03')
```

---

### PUT /api/schedule/:date/:id/highlight
**Purpose:** Toggle employee highlight status

**Authentication:** Required

**Parameters:**
- `:date` (URL param) - Date in YYYY-MM-DD format
- `:id` (URL param) - Employee ID

**Request Body:**
```javascript
{
  "isHighlighted": true
}
```

**Response:** `200` (no body)

**Example Request:**
```javascript
axios.put('/api/schedule/2026-01-03/5/highlight', {
  isHighlighted: true
})
```

**Database Operation:**
```sql
UPDATE schedule 
SET is_highlighted = $1
WHERE date = $2 AND employee_id = $3
```

---

### POST /api/schedule/finalize/:date
**Purpose:** Carry forward current day's schedule to next day

**Authentication:** Required

**Parameters:**
- `:date` (URL param) - Current date in YYYY-MM-DD format

**Response:**
```javascript
{
  "success": true,
  "nextDate": "2026-01-04"
}
```

**Database Operations:**
```sql
-- Copy schedule entries
INSERT INTO schedule 
  (date, job_id, employee_id, current_location, is_highlighted, employee_display_order)
SELECT 
  '2026-01-04', job_id, employee_id, current_location, is_highlighted, employee_display_order
FROM schedule
WHERE date = '2026-01-03'
ON CONFLICT (date, employee_id) DO UPDATE SET
  job_id = EXCLUDED.job_id,
  current_location = EXCLUDED.current_location,
  is_highlighted = EXCLUDED.is_highlighted,
  employee_display_order = EXCLUDED.employee_display_order;

-- Copy project order (rain_day resets to false)
INSERT INTO project_order (date, job_id, display_order, rain_day)
SELECT '2026-01-04', job_id, display_order, false
FROM project_order
WHERE date = '2026-01-03'
ON CONFLICT (date, job_id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  rain_day = false;
```

**Example Request:**
```javascript
axios.post('/api/schedule/finalize/2026-01-03')
```

---

## 🚶 EMPLOYEE MOVEMENT ENDPOINTS

### POST /api/moveemployee/:date
**Purpose:** Move employee between locations (union ↔ project)

**Authentication:** Required

**Parameters:**
- `:date` (URL param) - Date in YYYY-MM-DD format

**Request Body:**
```javascript
{
  "employeeId": 5,
  "targetJobId": 12,           // null for union
  "targetLocation": "project", // "project" or "union"
  "dropIndex": 3,              // position in list
  "sourceLocation": "union"    // where they came from
}
```

**Response:** `200` (no body)

**Database Operation:**
```sql
-- Moving to project
INSERT INTO schedule 
  (date, employee_id, job_id, current_location, is_highlighted, employee_display_order)
VALUES 
  ($1, $2, $3, 'project', true, $4)
ON CONFLICT (date, employee_id) DO UPDATE SET
  job_id = $3,
  current_location = 'project',
  is_highlighted = true,
  employee_display_order = $4;

-- Moving to union
INSERT INTO schedule 
  (date, employee_id, job_id, current_location, is_highlighted)
VALUES 
  ($1, $2, NULL, 'union', true)
ON CONFLICT (date, employee_id) DO UPDATE SET
  job_id = NULL,
  current_location = 'union',
  is_highlighted = true;
```

**Example Requests:**
```javascript
// Move to project
axios.post('/api/moveemployee/2026-01-03', {
  employeeId: 5,
  targetJobId: 12,
  targetLocation: 'project',
  dropIndex: 2,
  sourceLocation: 'union'
})

// Move to union
axios.post('/api/moveemployee/2026-01-03', {
  employeeId: 5,
  targetJobId: null,
  targetLocation: 'union',
  dropIndex: 0,
  sourceLocation: 'project'
})
```

---

## 📦 PROJECT ENDPOINTS

### GET /api/project/withEmployees/:date
**Purpose:** Fetch projects with their assigned employees for a specific date

**Authentication:** Required

**Parameters:**
- `:date` (URL param) - Date in YYYY-MM-DD format

**Special Behavior:**
- **Past dates:** Shows any project that had employees assigned (preserves history)
- **Current/future dates:** Only shows active projects with active employees

**Response:**
```javascript
[
  {
    "id": 2,
    "job_id": 2,
    "job_number": 102,
    "job_name": "Brickwork",
    "job_status": "Active",
    "display_order": 0,
    "rain_day": false,
    "employees": [
      {
        "id": 5,
        "first_name": "Alice",
        "last_name": "Smith",
        "employee_status": true,
        "phone_number": "555-1234",
        "email": "alice@example.com",
        "address": "123 Main St",
        "current_location": "project",
        "union_id": 21,
        "union_name": "21 - Bricklayers",
        "is_highlighted": true,
        "display_order": 0
      }
    ]
  }
]
```

**Example Request:**
```javascript
axios.get('/api/project/withEmployees/2026-01-03')
```

---

### PUT /api/project/updateProjectOrder
**Purpose:** Update the display order of projects for a specific date

**Authentication:** Required

**Request Body:**
```javascript
{
  "orderedProjectIds": [2, 5, 3, 12, 8],
  "date": "2026-01-03"
}
```

**Response:** `200` (no body)

**Database Operations:**
```sql
BEGIN;
LOCK TABLE project_order IN EXCLUSIVE MODE;

DELETE FROM project_order WHERE date = '2026-01-03';

-- Insert new order
INSERT INTO project_order (date, job_id, display_order)
VALUES 
  ('2026-01-03', 2, 0),
  ('2026-01-03', 5, 1),
  ('2026-01-03', 3, 2),
  ('2026-01-03', 12, 3),
  ('2026-01-03', 8, 4);

COMMIT;
```

**Example Request:**
```javascript
axios.put('/api/project/updateProjectOrder', {
  orderedProjectIds: [2, 5, 3, 12, 8],
  date: '2026-01-03'
})
```

---

### PUT /api/project/updateOrder
**Purpose:** Update employee display order within a project

**Authentication:** Required

**Request Body:**
```javascript
{
  "projectId": 12,
  "orderedEmployeeIds": [5, 23, 8, 15],
  "date": "2026-01-03"
}
```

**Response:** `200` (no body)

**Database Operations:**
```sql
BEGIN;

-- Ensure all employees are assigned to project
INSERT INTO schedule (date, employee_id, job_id, current_location)
VALUES ($1, $2, $3, 'project')
ON CONFLICT (date, employee_id) DO UPDATE SET
  job_id = $3,
  current_location = 'project';

-- Update display orders
UPDATE schedule 
SET employee_display_order = 0
WHERE date = '2026-01-03' AND job_id = 12 AND employee_id = 5;

UPDATE schedule 
SET employee_display_order = 1
WHERE date = '2026-01-03' AND job_id = 12 AND employee_id = 23;

-- ... and so on

COMMIT;
```

**Example Request:**
```javascript
axios.put('/api/project/updateOrder', {
  projectId: 12,
  orderedEmployeeIds: [5, 23, 8, 15],
  date: '2026-01-03'
})
```

---

### PUT /api/project/:jobId/rainday
**Purpose:** Toggle rain day status for a project on a specific date

**Authentication:** Required

**Parameters:**
- `:jobId` (URL param) - Job/Project ID

**Request Body:**
```javascript
{
  "isRainDay": true,
  "date": "2026-01-03"
}
```

**Response:** `200` (no body)

**Database Operation:**
```sql
INSERT INTO project_order (date, job_id, rain_day)
VALUES ('2026-01-03', 12, true)
ON CONFLICT (date, job_id) DO UPDATE SET
  rain_day = true;
```

**Example Request:**
```javascript
axios.put('/api/project/12/rainday', {
  isRainDay: true,
  date: '2026-01-03'
})
```

---

## 🏗️ JOB/PROJECT CRUD ENDPOINTS

### GET /api/jobs
**Purpose:** Fetch all jobs (projects)

**Authentication:** Required

**Response:**
```javascript
[
  {
    "job_id": 2,
    "job_number": 102,
    "job_name": "Brickwork",
    "location": "123 Main St",
    "start_date": "2025-01-15",
    "end_date": "2025-12-31",
    "status": "Active",
    "rain_day": false
  }
]
```

**Example Request:**
```javascript
axios.get('/api/jobs')
```

---

### POST /api/jobs
**Purpose:** Create a new job/project

**Authentication:** Required

**Request Body:**
```javascript
{
  "job_number": 105,
  "job_name": "New Construction",
  "location": "456 Oak Ave",
  "start_date": "2026-02-01",
  "end_date": "2026-12-31",
  "status": "Active"
}
```

**Response:** `201` (created)

**Database Operation:**
```sql
INSERT INTO jobs (job_number, job_name, location, start_date, end_date, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING job_id;
```

**Example Request:**
```javascript
axios.post('/api/jobs', {
  job_number: 105,
  job_name: "New Construction",
  location: "456 Oak Ave",
  start_date: "2026-02-01",
  end_date: "2026-12-31",
  status: "Active"
})
```

---

### PUT /api/jobs/:job_id
**Purpose:** Update an existing job or toggle its status

**Authentication:** Required

**Parameters:**
- `:job_id` (URL param) - Job ID to update

**Request Body (Full Update):**
```javascript
{
  "job_number": 105,
  "job_name": "Updated Name",
  "location": "New Location",
  "start_date": "2026-02-01",
  "end_date": "2026-12-31"
}
```

**Request Body (Status Toggle Only):**
```javascript
{
  "status": "Inactive"  // or "Active"
}
```

**Special Behavior (Status Toggle):**
- **Setting to Inactive:** Moves all assigned employees to union (current_location = 'union') for current and future dates
- **Setting to Active:** Restores employees to project (current_location = 'project') if they were in "limbo"

**Response:** `204` (no content)

**Database Operations:**
```sql
-- Status toggle to Inactive
BEGIN;

UPDATE jobs SET status = 'Inactive' WHERE job_id = $1;

UPDATE schedule
SET current_location = 'union'
WHERE job_id = $1 AND date >= CURRENT_DATE;

COMMIT;

-- Status toggle to Active
BEGIN;

UPDATE jobs SET status = 'Active' WHERE job_id = $1;

UPDATE schedule
SET current_location = 'project'
WHERE job_id = $1 AND date >= CURRENT_DATE;

COMMIT;
```

**Example Requests:**
```javascript
// Full update
axios.put('/api/jobs/12', {
  job_number: 105,
  job_name: "Updated Name",
  location: "New Location",
  start_date: "2026-02-01",
  end_date: "2026-12-31"
})

// Toggle status
axios.put('/api/jobs/12', {
  status: "Inactive"
})
```

---

### DELETE /api/jobs/:job_id
**Purpose:** Delete a job/project

**Authentication:** Required

**Parameters:**
- `:job_id` (URL param) - Job ID to delete

**Special Behavior:**
- Removes all schedule assignments for this job (CASCADE)
- Removes all project_order entries (CASCADE)

**Response:** `200` (no body)

**Database Operation:**
```sql
DELETE FROM jobs WHERE job_id = $1;
-- CASCADE removes schedule and project_order entries
```

**Example Request:**
```javascript
axios.delete('/api/jobs/12')
```

---

## 👥 EMPLOYEE CRUD ENDPOINTS

### GET /api/addemployee
**Purpose:** Fetch all employees

**Authentication:** Required

**Response:**
```javascript
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "employee_number": "12345",
    "employee_status": true,
    "phone_number": "555-1234",
    "email": "john@example.com",
    "address": "123 Main St",
    "union_id": 21
  }
]
```

**Example Request:**
```javascript
axios.get('/api/addemployee')
```

---

### POST /api/addemployee
**Purpose:** Create a new employee

**Authentication:** Required

**Request Body:**
```javascript
{
  "first_name": "Jane",
  "last_name": "Smith",
  "employee_number": "67890",
  "employee_status": true,
  "phone_number": "555-5678",
  "email": "jane@example.com",
  "address": "456 Oak Ave",
  "union_id": 22
}
```

**Response:** `201` (created)

**Database Operation:**
```sql
INSERT INTO add_employee 
  (first_name, last_name, employee_number, employee_status, phone_number, email, address, union_id)
VALUES 
  ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id;
```

**Example Request:**
```javascript
axios.post('/api/addemployee', {
  first_name: "Jane",
  last_name: "Smith",
  employee_number: "67890",
  employee_status: true,
  phone_number: "555-5678",
  email: "jane@example.com",
  address: "456 Oak Ave",
  union_id: 22
})
```

---

### PUT /api/addemployee/:id
**Purpose:** Update an existing employee

**Authentication:** Required

**Parameters:**
- `:id` (URL param) - Employee ID

**Request Body:**
```javascript
{
  "first_name": "Jane",
  "last_name": "Smith-Updated",
  "employee_number": "67890",
  "employee_status": false,  // Toggle active status
  "phone_number": "555-9999",
  "email": "jane.new@example.com",
  "address": "789 Pine St",
  "union_id": 23
}
```

**Response:** `204` (no content)

**Database Operation:**
```sql
UPDATE add_employee
SET 
  first_name = $1,
  last_name = $2,
  employee_number = $3,
  employee_status = $4,
  phone_number = $5,
  email = $6,
  address = $7,
  union_id = $8
WHERE id = $9;
```

**Example Request:**
```javascript
axios.put('/api/addemployee/5', {
  first_name: "Jane",
  last_name: "Smith-Updated",
  employee_number: "67890",
  employee_status: false,
  phone_number: "555-9999",
  email: "jane.new@example.com",
  address: "789 Pine St",
  union_id: 23
})
```

---

## 🔐 AUTHENTICATION & MIDDLEWARE

### Authentication Middleware
**File:** `server/modules/authentication-middleware.js`

**Function:** `rejectUnauthenticated`
- Checks if user is logged in via Passport session
- Returns `401 Unauthorized` if not authenticated
- Used on all protected routes

**Usage:**
```javascript
router.get('/protected', rejectUnauthenticated, (req, res) => {
  // Only accessible if logged in
});
```

---

### Date Validation Middleware
**File:** `server/routes/date-validation.middleware.js`

**Functions:**
- `validateDate(req, res, next)` - Validates date format and range
- `isPastDate(dateString)` - Checks if date is in the past

**Validation Rules:**
- Date must be in YYYY-MM-DD format
- For modifications (POST, PUT, DELETE): Date must be today through today + 7 days
- For reads (GET): Any date allowed

**Usage:**
```javascript
router.post('/schedule/:date', rejectUnauthenticated, validateDate, (req, res) => {
  const date = req.validatedDate; // Already validated
});
```

**How it works:**
```javascript
const validateDate = (req, res, next) => {
  const date = req.params.date || req.body.date;
  
  // Create date at noon Central Time
  const requestDate = new Date(date + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
  
  // For modifications, check range
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    if (requestDate < today || requestDate > maxDate) {
      return res.status(403).send('Date out of editable range');
    }
  }
  
  req.validatedDate = date;
  next();
};
```

---

## 🎯 COMMON PATTERNS

### Pattern 1: Transaction-Based Updates
**Used for:** Operations that modify multiple tables
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Multiple operations
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  
  await client.query('COMMIT');
  res.sendStatus(200);
} catch (error) {
  await client.query('ROLLBACK');
  res.status(500).send(error.message);
} finally {
  client.release();
}
```

---

### Pattern 2: ON CONFLICT Handling
**Used for:** Upsert operations (insert or update)
```javascript
const query = `
  INSERT INTO schedule (date, employee_id, job_id, current_location)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (date, employee_id) DO UPDATE SET
    job_id = $3,
    current_location = $4
`;
```

---

### Pattern 3: Date-Aware Queries
**Used for:** Fetching data for specific dates
```javascript
// Always include date in WHERE clause
const query = `
  SELECT * FROM schedule
  WHERE date = $1 AND employee_id = $2
`;

pool.query(query, [date, employeeId]);
```

---

### Pattern 4: Historical vs Current Data
**Used for:** Different behavior for past vs current/future dates
```javascript
const isHistoricalData = isPastDate(date);

if (isHistoricalData) {
  // Show all data (preserve history)
  query = `SELECT ... WHERE date = $1`;
} else {
  // Filter by active status
  query = `SELECT ... WHERE date = $1 AND status = 'Active'`;
}
```

---

## 📝 ENDPOINT SUMMARY TABLE

| Method | Endpoint | Purpose | Auth | Date Param |
|--------|----------|---------|------|------------|
| GET | `/api/schedule/employees/:date` | Get employees for date | ✓ | ✓ |
| GET | `/api/schedule/withunions/:date` | Get unions with employees | ✓ | ✓ |
| PUT | `/api/schedule/:date/:id/highlight` | Toggle highlight | ✓ | ✓ |
| POST | `/api/schedule/finalize/:date` | Carry forward | ✓ | ✓ |
| POST | `/api/moveemployee/:date` | Move employee | ✓ | ✓ |
| GET | `/api/project/withEmployees/:date` | Get projects with employees | ✓ | ✓ |
| PUT | `/api/project/updateProjectOrder` | Reorder projects | ✓ | Body |
| PUT | `/api/project/updateOrder` | Reorder employees | ✓ | Body |
| PUT | `/api/project/:jobId/rainday` | Toggle rain day | ✓ | Body |
| GET | `/api/jobs` | Get all jobs | ✓ | ✗ |
| POST | `/api/jobs` | Create job | ✓ | ✗ |
| PUT | `/api/jobs/:job_id` | Update job | ✓ | ✗ |
| DELETE | `/api/jobs/:job_id` | Delete job | ✓ | ✗ |
| GET | `/api/addemployee` | Get all employees | ✓ | ✗ |
| POST | `/api/addemployee` | Create employee | ✓ | ✗ |
| PUT | `/api/addemployee/:id` | Update employee | ✓ | ✗ |




