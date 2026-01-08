# OSAS Web - Department, Sections, and Students Implementation Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Department Module](#department-module)
4. [Sections Module](#sections-module)
5. [Students Module](#students-module)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Data Flow](#data-flow)

---

## Overview

This document provides comprehensive documentation for the full functionality implementation of **Departments**, **Sections**, and **Students** modules in the OSAS (Office of Student Affairs and Services) Web Application.

### Key Features
- **MVC Architecture**: Clean separation of concerns using Model-View-Controller pattern
- **RESTful API**: JSON-based API endpoints for all operations
- **Soft Delete**: Archive/restore functionality instead of hard deletes
- **Data Validation**: Input sanitization and validation at controller level
- **Search & Filter**: Advanced filtering and search capabilities
- **Bulk Import**: CSV/JSON import functionality for bulk data entry
- **Statistics**: Real-time statistics and counts for each module

---

## Architecture

### Directory Structure
```
OSAS_WEB/
├── api/
│   ├── departments.php      # Department API endpoint
│   ├── sections.php         # Section API endpoint
│   └── students.php         # Student API endpoint
├── app/
│   ├── controllers/
│   │   ├── DepartmentController.php
│   │   ├── SectionController.php
│   │   └── StudentController.php
│   ├── models/
│   │   ├── DepartmentModel.php
│   │   ├── SectionModel.php
│   │   └── StudentModel.php
│   ├── views/
│   │   └── admin/
│   │       ├── department.php
│   │       ├── sections.php
│   │       └── students.php
│   └── assets/
│       └── js/
│           ├── department.js
│           ├── section.js
│           └── student.js
└── app/core/
    ├── Model.php            # Base Model class
    └── Controller.php       # Base Controller class
```

### Technology Stack
- **Backend**: PHP 7.4+
- **Database**: MySQL/MariaDB
- **Frontend**: JavaScript (Vanilla JS)
- **Architecture**: MVC Pattern

---

## Department Module

### Overview
The Department module manages academic departments within the institution. Each department has a unique code and can be associated with multiple sections and students.

### Database Table: `departments`
- `id` (Primary Key)
- `department_name` (VARCHAR)
- `department_code` (VARCHAR, Unique)
- `head_of_department` (VARCHAR, Optional)
- `description` (TEXT, Optional)
- `status` (ENUM: 'active', 'archived')
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Functionality

#### 1. **List Departments** (`index()`)
- **Endpoint**: `GET /api/departments.php?action=get`
- **Query Parameters**:
  - `filter`: 'all', 'active', 'archived' (default: 'all')
  - `search`: Search term for department name or code
- **Response**: JSON array of departments with student counts
- **Features**:
  - Filters by status (active/archived/all)
  - Search by department name or code
  - Includes student count per department
  - Ordered alphabetically by department name

#### 2. **Get Department Dropdown** (`dropdown()`)
- **Endpoint**: `GET /api/departments.php` (no action parameter)
- **Response**: Simplified list of active departments for dropdowns
- **Use Case**: Used in forms to select departments

#### 3. **Get Statistics** (`stats()`)
- **Endpoint**: `GET /api/departments.php?action=stats`
- **Response**: 
  ```json
  {
    "total": 10,
    "active": 8,
    "archived": 2
  }
  ```

#### 4. **Create Department** (`create()`)
- **Endpoint**: `POST /api/departments.php?action=add`
- **Required Fields**:
  - `departmentName`: Department name
  - `departmentCode`: Unique department code
- **Validation**:
  - Name and code are required
  - Department code must be unique
- **Response**: Success message with created department ID

#### 5. **Update Department** (`update()`)
- **Endpoint**: `POST /api/departments.php?action=update`
- **Required Fields**:
  - `departmentId`: ID of department to update
  - `departmentName`: Updated name
  - `departmentCode`: Updated code (must be unique)
- **Validation**:
  - Valid department ID required
  - Code uniqueness checked (excluding current department)
- **Response**: Success message

#### 6. **Archive Department** (`delete()`)
- **Endpoint**: `GET/POST /api/departments.php?action=delete` or `action=archive`
- **Parameters**: `id` (department ID)
- **Behavior**: Soft delete - sets status to 'archived'
- **Note**: Does not delete associated sections or students

#### 7. **Restore Department** (`restore()`)
- **Endpoint**: `GET/POST /api/departments.php?action=restore`
- **Parameters**: `id` (department ID)
- **Behavior**: Restores archived department to active status

#### 8. **Bulk Import** (`import()`)
- **Endpoint**: `POST /api/departments.php?action=import`
- **Payload**: JSON array of departments
  ```json
  {
    "departments": "[{\"name\":\"CS\",\"code\":\"CS\",\"hod\":\"Dr. Smith\",\"description\":\"...\",\"status\":\"active\"}]"
  }
  ```
- **Features**:
  - Validates each record
  - Skips duplicates (by code)
  - Returns import summary with errors
- **Response**:
  ```json
  {
    "imported": 5,
    "skipped": 2,
    "total": 7,
    "errors": ["Row 3: Department code 'CS' already exists"]
  }
  ```

### Model Methods (`DepartmentModel`)

#### `getAllWithFilters($filter, $search)`
- Retrieves departments with optional filtering and search
- Joins with students table to count students per department
- Returns formatted array with all department details

#### `getForDropdown()`
- Returns simplified list of active departments
- Used for dropdown/select elements

#### `codeExists($code, $excludeId = null)`
- Checks if department code already exists
- Excludes current department when updating

#### `archive($id)`
- Sets department status to 'archived'

#### `restore($id)`
- Sets department status to 'active'

#### `getStats()`
- Returns statistics: total, active, archived counts

---

## Sections Module

### Overview
The Sections module manages class sections within departments. Each section belongs to a department and can contain multiple students.

### Database Table: `sections`
- `id` (Primary Key)
- `section_name` (VARCHAR)
- `section_code` (VARCHAR, Unique)
- `department_id` (Foreign Key → departments.id)
- `academic_year` (VARCHAR, Optional)
- `status` (ENUM: 'active', 'archived')
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Functionality

#### 1. **List Sections** (`index()`)
- **Endpoint**: `GET /api/sections.php?action=get`
- **Query Parameters**:
  - `filter`: 'all', 'active', 'archived' (default: 'all')
  - `search`: Search term for section name, code, or department
- **Response**: JSON array of sections with department info and student counts
- **Features**:
  - Filters by status
  - Search across section name, code, and department name
  - Includes department information
  - Shows student count per section
  - Ordered by section code

#### 2. **Get Sections by Department** (`getByDepartment()`)
- **Endpoint**: `GET /api/sections.php?action=getByDepartment&department_code=CS`
- **Parameters**: `department_code` (required)
- **Response**: List of active sections for specified department
- **Use Case**: Used when filtering sections by department in forms

#### 3. **Get Statistics** (`stats()`)
- **Endpoint**: `GET /api/sections.php?action=stats`
- **Response**:
  ```json
  {
    "total": 25,
    "active": 20,
    "archived": 5,
    "with_students": 18,
    "total_students": 450
  }
  ```

#### 4. **Create Section** (`create()`)
- **Endpoint**: `POST /api/sections.php?action=add`
- **Required Fields**:
  - `sectionName`: Section name
  - `sectionCode`: Unique section code
  - `departmentId`: ID of parent department
- **Validation**:
  - Name, code, and department are required
  - Section code must be unique
  - Department must exist
- **Response**: Success message with created section ID

#### 5. **Update Section** (`update()`)
- **Endpoint**: `POST /api/sections.php?action=update`
- **Required Fields**:
  - `sectionId`: ID of section to update
  - `sectionName`: Updated name
  - `sectionCode`: Updated code
  - `departmentId`: Updated department ID
- **Validation**:
  - Valid section ID required
  - Code uniqueness checked (excluding current section)
- **Response**: Success message

#### 6. **Archive Section** (`delete()`)
- **Endpoint**: `GET/POST /api/sections.php?action=delete` or `action=archive`
- **Parameters**: `id` (section ID)
- **Behavior**: Soft delete - sets status to 'archived'
- **Note**: Does not affect associated students

#### 7. **Restore Section** (`restore()`)
- **Endpoint**: `GET/POST /api/sections.php?action=restore`
- **Parameters**: `id` (section ID)
- **Behavior**: Restores archived section to active status

#### 8. **Bulk Import** (`import()`)
- **Endpoint**: `POST /api/sections.php?action=import`
- **Payload**: JSON array of sections
  ```json
  {
    "sections": "[{\"name\":\"Section A\",\"code\":\"CS-1A\",\"department\":\"CS\",\"status\":\"active\"}]"
  }
  ```
- **Features**:
  - Validates department code exists
  - Maps department code to department ID
  - Skips duplicates (by code)
  - Returns import summary with errors

### Model Methods (`SectionModel`)

#### `getAllWithFilters($filter, $search)`
- Retrieves sections with optional filtering and search
- Joins with departments and students tables
- Returns formatted array with department info and student counts

#### `getByDepartment($departmentCode)`
- Retrieves active sections for a specific department
- Returns simplified section list for dropdowns

#### `codeExists($code, $excludeId = null)`
- Checks if section code already exists
- Excludes current section when updating

#### `archive($id)` / `restore($id)`
- Archive/restore functionality

#### `getStats()`
- Returns comprehensive statistics including:
  - Total, active, archived counts
  - Sections with students
  - Total students in sections

---

## Students Module

### Overview
The Students module manages student records. Each student belongs to a department and optionally to a section.

### Database Table: `students`
- `id` (Primary Key)
- `student_id` (VARCHAR, Unique) - Student ID number
- `first_name` (VARCHAR)
- `middle_name` (VARCHAR, Optional)
- `last_name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `contact_number` (VARCHAR, Optional)
- `address` (TEXT, Optional)
- `department` (VARCHAR) - Department code
- `section_id` (Foreign Key → sections.id, Optional)
- `avatar` (VARCHAR, Optional) - Avatar image path/URL
- `status` (ENUM: 'active', 'inactive', 'graduating', 'archived')
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Functionality

#### 1. **List Students** (`index()`)
- **Endpoint**: `GET /api/students.php?action=get`
- **Query Parameters**:
  - `filter`: 'all', 'active', 'inactive', 'graduating', 'archived' (default: 'all')
  - `search`: Search term for student details
- **Response**: JSON array of students with department and section info
- **Features**:
  - Filters by status
  - Advanced search across:
    - First name, middle name, last name
    - Student ID
    - Email
    - Department name/code
    - Section name/code
  - Includes department and section information
  - Auto-generates avatar URL if not provided
  - Normalizes avatar paths
  - Ordered by creation date (newest first)

#### 2. **Get Statistics** (`stats()`)
- **Endpoint**: `GET /api/students.php?action=stats`
- **Response**:
  ```json
  {
    "total": 500,
    "active": 450,
    "inactive": 30,
    "graduating": 15,
    "archived": 5
  }
  ```

#### 3. **Create Student** (`create()`)
- **Endpoint**: `POST /api/students.php?action=add`
- **Required Fields**:
  - `studentIdCode` or `studentId`: Unique student ID
  - `firstName`: First name
  - `lastName`: Last name
  - `studentEmail`: Email address
- **Optional Fields**:
  - `middleName`: Middle name
  - `studentContact`: Contact number
  - `studentAddress`: Address
  - `studentDept`: Department code
  - `studentSection`: Section ID
  - `studentStatus`: Status (default: 'active')
  - `studentAvatar`: Avatar path/URL
- **Validation**:
  - Student ID must be unique
  - Email must be unique
  - Required fields must not be empty
- **Response**: Success message with created student ID

#### 4. **Update Student** (`update()`)
- **Endpoint**: `POST /api/students.php?action=update`
- **Required Fields**:
  - `studentId`: Database ID of student (different from student_id field)
  - `studentIdCode`: Student ID number
  - `firstName`: First name
  - `lastName`: Last name
  - `studentEmail`: Email address
- **Optional Fields**: Same as create
- **Validation**:
  - Valid student ID required
  - Student ID uniqueness checked (excluding current student)
  - Email uniqueness checked (excluding current student)
- **Response**: Success message

#### 5. **Archive Student** (`delete()`)
- **Endpoint**: `GET/POST /api/students.php?action=delete`
- **Parameters**: `id` (student database ID)
- **Behavior**: Soft delete - sets status to 'archived'
- **Note**: Archived students are excluded from normal listings

#### 6. **Restore Student** (`restore()`)
- **Endpoint**: `GET/POST /api/students.php?action=restore`
- **Parameters**: `id` (student database ID)
- **Behavior**: Restores archived student to active status

#### 7. **Bulk Import** (`import()`)
- **Endpoint**: `POST /api/students.php?action=import`
- **Payload**: JSON array of students
  ```json
  {
    "students": "[{\"studentId\":\"2024-001\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john@email.com\",\"department\":\"CS\",\"section\":\"CS-1A\",\"status\":\"active\"}]"
  }
  ```
- **Features**:
  - Validates required fields (Student ID, First Name, Last Name)
  - Auto-generates email if not provided (format: firstname.lastname@student.edu)
  - Handles email conflicts by appending timestamp
  - Maps section name/code to section ID
  - Skips duplicates (by Student ID)
  - Returns import summary with detailed errors
- **Response**:
  ```json
  {
    "imported": 100,
    "skipped": 5,
    "total": 105,
    "errors": ["Row 3: Student ID '2024-001' already exists", "Row 7: Missing required fields"]
  }
  ```

### Model Methods (`StudentModel`)

#### `getAllWithDetails($filter, $search)`
- Retrieves students with optional filtering and search
- Dynamically checks for sections and departments table existence
- Joins with sections and departments tables when available
- Handles avatar path normalization
- Auto-generates avatar URLs using UI Avatars API if missing
- Returns formatted array with full student details

#### `getStats()`
- Returns statistics by status:
  - Total students
  - Active students
  - Inactive students
  - Graduating students
  - Archived students

#### `studentIdExists($studentId, $excludeId = null)`
- Checks if student ID already exists
- Excludes current student when updating

#### `emailExists($email, $excludeId = null)`
- Checks if email already exists
- Excludes current student when updating

#### `archive($id)` / `restore($id)`
- Archive/restore functionality

#### `tableExists($tableName)`
- Helper method to check if database table exists
- Used for conditional JOINs in queries

---

## API Endpoints

### Department Endpoints

| Method | Endpoint | Action | Description |
|--------|----------|--------|-------------|
| GET | `/api/departments.php` | (none) | Get dropdown list |
| GET | `/api/departments.php` | `get` | List all departments |
| GET | `/api/departments.php` | `stats` | Get statistics |
| POST | `/api/departments.php` | `add` | Create department |
| POST | `/api/departments.php` | `update` | Update department |
| GET/POST | `/api/departments.php` | `delete`/`archive` | Archive department |
| GET/POST | `/api/departments.php` | `restore` | Restore department |
| POST | `/api/departments.php` | `import` | Bulk import |

### Section Endpoints

| Method | Endpoint | Action | Description |
|--------|----------|--------|-------------|
| GET | `/api/sections.php` | `get` | List all sections |
| GET | `/api/sections.php` | `getByDepartment` | Get sections by department |
| GET | `/api/sections.php` | `stats` | Get statistics |
| POST | `/api/sections.php` | `add` | Create section |
| POST | `/api/sections.php` | `update` | Update section |
| GET/POST | `/api/sections.php` | `delete`/`archive` | Archive section |
| GET/POST | `/api/sections.php` | `restore` | Restore section |
| POST | `/api/sections.php` | `import` | Bulk import |

### Student Endpoints

| Method | Endpoint | Action | Description |
|--------|----------|--------|-------------|
| GET | `/api/students.php` | `get` | List all students |
| GET | `/api/students.php` | `stats` | Get statistics |
| POST | `/api/students.php` | `add` | Create student |
| POST | `/api/students.php` | `update` | Update student |
| GET/POST | `/api/students.php` | `delete` | Archive student |
| GET/POST | `/api/students.php` | `restore` | Restore student |
| POST | `/api/students.php` | `import` | Bulk import |

### Response Format

All API endpoints return JSON responses in the following format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Database Schema

### Relationships

```
departments (1) ──< (many) sections
departments (1) ──< (many) students
sections (1) ──< (many) students
```

### Key Constraints

1. **Departments**:
   - `department_code` must be unique
   - Status: 'active' or 'archived'

2. **Sections**:
   - `section_code` must be unique
   - `department_id` must reference existing department
   - Status: 'active' or 'archived'

3. **Students**:
   - `student_id` must be unique
   - `email` must be unique
   - `department` references department code (string, not FK)
   - `section_id` references sections.id (optional)
   - Status: 'active', 'inactive', 'graduating', or 'archived'

---

## Data Flow

### Create Flow

1. **User Input** → Frontend Form (JavaScript)
2. **Form Validation** → Client-side validation
3. **API Request** → POST to appropriate endpoint
4. **Controller** → Validates and sanitizes input
5. **Model** → Database operations
6. **Response** → JSON success/error
7. **Frontend** → Updates UI, shows notification

### Search & Filter Flow

1. **User Input** → Search box / Filter dropdown
2. **API Request** → GET with query parameters
3. **Controller** → Passes parameters to model
4. **Model** → Builds dynamic SQL query with filters
5. **Database** → Returns filtered results
6. **Model** → Formats and enriches data
7. **Controller** → Returns JSON response
8. **Frontend** → Renders updated table/list

### Archive/Restore Flow

1. **User Action** → Click archive/restore button
2. **Confirmation** → User confirms action
3. **API Request** → GET/POST with ID parameter
4. **Controller** → Validates ID
5. **Model** → Updates status field
6. **Response** → Success message
7. **Frontend** → Refreshes list, shows notification

---

## Security Features

1. **Input Sanitization**: All user inputs are sanitized using `sanitize()` method
2. **SQL Injection Prevention**: Prepared statements with parameter binding
3. **Data Validation**: Required field validation and uniqueness checks
4. **Soft Deletes**: Archive instead of hard delete to maintain data integrity
5. **Error Handling**: Try-catch blocks with proper error messages

---

## Frontend Integration

### JavaScript Modules

Each module has a corresponding JavaScript file that handles:
- API communication
- DOM manipulation
- Form handling
- Search and filter functionality
- Modal management
- Data table rendering
- Import/export functionality
- Print functionality

### Key Functions

- `fetchDepartments()` / `fetchSections()` / `fetchStudents()`: Load data from API
- `renderTable()`: Render data in table format
- `handleSearch()`: Real-time search functionality
- `handleFilter()`: Filter by status
- `openModal()`: Open add/edit modal
- `saveRecord()`: Create or update record
- `archiveRecord()`: Archive a record
- `restoreRecord()`: Restore archived record
- `importData()`: Handle bulk import
- `exportData()`: Export to CSV/Excel

---

## Best Practices Implemented

1. **MVC Pattern**: Clear separation of concerns
2. **DRY Principle**: Reusable base Model and Controller classes
3. **Error Handling**: Comprehensive try-catch blocks
4. **Data Validation**: Both client-side and server-side validation
5. **Soft Deletes**: Archive functionality preserves data
6. **Search Functionality**: Flexible search across multiple fields
7. **Statistics**: Real-time counts and metrics
8. **Bulk Operations**: Efficient import functionality
9. **Code Reusability**: Shared methods in base classes
10. **API Consistency**: Uniform response format across all endpoints

---

## Future Enhancements

Potential improvements for future versions:

1. **Pagination**: Implement pagination for large datasets
2. **Advanced Filters**: Date range filters, custom field filters
3. **Export Formats**: Support for PDF, Excel exports
4. **Audit Trail**: Track who created/updated records
5. **File Upload**: Direct file upload for avatars
6. **Batch Operations**: Bulk update, bulk delete
7. **API Authentication**: Token-based authentication
8. **Rate Limiting**: Prevent API abuse
9. **Caching**: Cache frequently accessed data
10. **Real-time Updates**: WebSocket support for live updates

---

## Conclusion

This implementation provides a robust, scalable foundation for managing departments, sections, and students in the OSAS Web application. The MVC architecture ensures maintainability, while the comprehensive API allows for easy integration with frontend components and potential mobile applications.

For questions or issues, please refer to the code comments in the respective Model and Controller files, or contact the development team.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: OSAS Development Team
