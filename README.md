# Alumni Management System - Backend

## Table of Contents
- [Database Connections](#database-connections)
  - [PostgreSQL](#postgresql)
  - [Supabase](#supabase)
- [API Documentation](#api-documentation)
  - [User Authentication](#user-authentication)
    - [Sign Up (`POST /api/user/signup`)](#sign-up)
    - [Login (`POST /api/user/login`)](#login)
    - [Logout (`POST /api/user/:userId/logout`)](#logout)
  - [Alumni](#alumni)
    - [Get All Alumni (`GET /api/alumni`)](#get-all-alumni)
    - [Get Alumni By ID (`GET /api/alumni/:alumniId`)](#get-alumni-by-id)
  - [Students](#students)
    - [Create Students (`POST /api/students/createStudents`)](#create-students)
    - [Get All Students (`GET /api/students/getAllStudents`)](#get-all-students)
  - [Events](#events)
    - [Create Event (`POST /api/events/:adminId/createEvent`)](#create-event)
    - [Get All Events (`GET /api/events/:adminId/getAllEvents`)](#get-all-events)
  - [Messages](#messages)
    - [Create Message (`POST /api/messages/:adminId/createMessage`)](#create-message)
    - [Get All Invitations (`GET /api/messages/:alumniId/getAllInvitations`)](#get-all-invitations)
    - [Update Invitation Status (`PATCH /api/messages/:alumniId/:eventId/updateInvitationStatus`)](#update-invitation-status)

## Database Connections

### PostgreSQL
- Connection configured via environment variables in `.env` file
- Required environment variables:
  - `PGHOST` - Database host
  - `PGPORT` - Database port
  - `PGDATABASE` - Database name
  - `PGUSER` - Database user
  - `PGPASSWORD` - Database password
  - `POOLMODE` - Connection pool mode

### Supabase
- Authentication and real-time features
- Required environment variables:
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

### Testing Connections

To verify database connections:

```bash
# Install dependencies
npm install

# Run connection tests
node test-connections.js
```

The test will check both PostgreSQL and Supabase connections and provide a summary of the results.

## API Documentation

### User Authentication

#### Sign Up
Create a new user account with either ADMIN or ALUMNI role.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| displayName | String | Yes | User's full name |
| email | String | Yes | User's email address |
| phone | String | Yes | User's phone number |
| password | String | Yes | User's password |
| role | String | Yes | User role (ADMIN or ALUMNI) |
| course | String | If ALUMNI | Course completed by the alumni |
| stream | String | If ALUMNI | Stream of study |
| occupation | String | If ALUMNI | Current occupation |
| yearOfGraduation | Number | If ALUMNI | Year of graduation |
| socialLinks | Array | No | Array of social media links (ALUMNI only) |

**socialLinks Array Items:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| alumni_link | String | Yes | URL of the social media profile |
| alumni_link_name | String | Yes | Must be one of: `LINKEDIN`, `GITHUB`, `FACEBOOK`, `INSTAGRAM`, `REDDIT`, `OTHER` |

**Important Notes:**
- Maximum of 5 social links allowed per user
- Social links are case-insensitive when validating but will be stored in UPPERCASE
- `alumni_link_name` must match one of the allowed values exactly (case-insensitive)
- You can ignore adding links too if not present. 

**Endpoint:** `POST /api/user/signup`

**Request Body (ADMIN):**
```json
{
  "displayName": "Admin User",
  "email": "admin@example.com",
  "phone": "1234567890",
  "password": "securePassword123!",
  "role": "ADMIN"
}
```

**Request Body (ALUMNI):**
```json
{
  "displayName": "Alumni User",
  "email": "alumni@example.com",
  "phone": "9876543210",
  "password": "securePassword123!",
  "role": "ALUMNI",
  "course": "B.Tech",
  "stream": "Computer Science",
  "occupation": "Software Engineer",
  "yearOfGraduation": "2020",
  "socialLinks": [
    {
      "alumni_link": "<URL>",
      "alumni_link_name": "<Platform Name>"
    },
    {
      "alumni_link": "<URL>",
      "alumni_link_name": "<Platform Name>"
    }
  ]
}
```

**Response (Success - 201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user-uuid-here",
    "email": "user@example.com",
    "role": "ALUMNI",
    "course": "B.Tech",
    "stream": "Computer Science",
    "occupation": "Software Engineer",
    "yearOfGraduation": "2020",
    "socialLinks": [
      {
        "alumni_link": "https://linkedin.com/in/username",
        "alumni_link_name": "LINKEDIN"
      },
      {
        "alumni_link": "https://github.com/username",
        "alumni_link_name": "GITHUB"
      }
    ]
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

#### Login
Authenticate a user and retrieve their profile information.

**Endpoint:** `POST /api/user/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userPassword123!"
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-uuid-here",
    "email": "user@example.com",
    "role": "ALUMNI",
    "alumni_name": "John Doe",
    "alumni_email": "user@example.com",
    "alumni_phone_no": "1234567890",
    "alumni_course": "B.Tech",
    "alumni_stream": "Computer Science",
    "alumni_occupation": "Software Engineer",
    "alumni_year_of_graduation": 2020,
    "metadata": {
      "display_name": "John Doe",
      "phone": "1234567890"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "An error occurred during login"
}
```

#### Logout
Sign out the current user and invalidate the session.

**Endpoint:** `POST /api/user/:userId/logout`

**Headers:**
- `Cookie`: Session cookie (automatically handled by Supabase)

**Path Parameters:**
- `userId` (required): ID of the user to log out

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Error Responses:**
- 401 Unauthorized: No active session found
- 403 Forbidden: Not authorized to perform this action
- 500 Internal Server Error: Error during logout

---

### Alumni

#### Get All Alumni
Retrieve a list of all alumni with their social links.

- **Endpoint**: `GET /api/alumni`
- **Response**: 
  - Status: 200 OK
  - Body: Array of alumni objects with their social links
  ```json
  [
    {
    "alumni_id": "6bd83c54-9231-422c-905a-1f80daeecb9e",
    "alumni_name": "John Doe",
    "alumni_course": "Computer Science",
    "alumni_stream": "B.Tech",
    "alumni_occupation": "Software Engineer",
    "alumni_year_of_graduation": "2020",
    "alumni_profile_picture_key": null,
    "alumni_email": "john.doe1212@example.com",
    "alumni_phone_no": 1234567890,
    "alumni_created_at": "2025-09-14T18:37:24.299292+00:00",
    "alumni_updated_at": "2025-09-14T18:37:24.299292+00:00",
    "social_links": [
      {
        "alumni_link": "https://linkedin.com/in/johndoe",
        "alumni_link_name": "LINKEDIN"
      },
      {
        "alumni_link": "https://github.com/johndoe",
        "alumni_link_name": "GITHUB"
      }
    ]
  }
  ]
  ```
- **Error Responses**:
  - 500: Server error
  ```json
  {
    "success": false,
    "message": "Server error fetching alumni"
  }
  ```

#### Get Alumni By ID
Retrieve a single alumni record by `alumniId` including their social links.

- **Endpoint**: `GET /api/alumni/:alumniId`
- **Path Parameters**:
  - `alumniId` (required): ID of the alumni to fetch
- **Success Response (200 OK):**
  ```json
  {
    "alumni_id": "6bd83c54-9231-422c-905a-1f80daeecb9e",
    "alumni_name": "John Doe",
    "alumni_course": "Computer Science",
    "alumni_stream": "B.Tech",
    "alumni_occupation": "Software Engineer",
    "alumni_year_of_graduation": "2020",
    "alumni_profile_picture_key": null,
    "alumni_email": "john.doe1212@example.com",
    "alumni_phone_no": 1234567890,
    "alumni_created_at": "2025-09-14T18:37:24.299292+00:00",
    "alumni_updated_at": "2025-09-14T18:37:24.299292+00:00",
    "social_links": [
      { "alumni_link": "https://linkedin.com/in/johndoe", "alumni_link_name": "LINKEDIN" }
    ]
  }
  ```
- **Error Responses**:
  - 404 Not Found
  ```json
  {
    "success": false,
    "message": "Alumni not found"
  }
  ```
  - 500 Internal Server Error
  ```json
  {
    "success": false,
    "message": "Server error fetching alumni by ID"
  }
  ```

### Students

#### Create Students
Bulk create student users from a JSON payload or a CSV file upload.

- **Endpoint**: `POST /api/students/createStudents`

**Content Types Supported:**
- Application JSON: `application/json`
- Multipart form-data (CSV upload): `multipart/form-data`

**Request (JSON Option 1 - Array):**
```json
[
  {
    "student_name": "Jane Doe",
    "student_email": "jane.doe@example.com",
    "student_password": "StrongPass1",
    "student_phone_number": "+1 555 000 1234",
    "student_profile_picture_key": null,
    "student_course": "B.Tech",
    "student_branch": "CSE",
    "student_current_year": 3,
    "student_semester": 6,
    "student_year_of_admission": 2022
  }
]
```

**Request (JSON Option 2 - Wrapped):**
```json
{
  "students": [
    {
      "student_name": "Jane Doe",
      "student_email": "jane.doe@example.com",
      "student_password": "StrongPass1",
      "student_phone_number": "+1 555 000 1234",
      "student_profile_picture_key": null,
      "student_course": "B.Tech",
      "student_branch": "CSE",
      "student_current_year": 3,
      "student_semester": 6,
      "student_year_of_admission": 2022
    }
  ]
}
```

**Request (CSV via multipart/form-data):**
- Field name: `file`
- CSV must include a header row with columns matching the student fields below.

Example CSV:
```csv
student_name,student_email,student_password,student_phone_number,student_profile_picture_key,student_course,student_branch,student_current_year,student_semester,student_year_of_admission
Jane Doe,jane.doe@example.com,StrongPass1,+15550001234,,B.Tech,CSE,3,6,2022
```

**Per-Student Fields:**
- `student_name` (string, required, non-empty)
- `student_email` (string, required, valid email)
- `student_password` (string, required, min 8 chars, must include upper, lower, digit)
- `student_phone_number` (string, required, 7–15 digits allowed; may contain +, -, spaces, parentheses)
- `student_profile_picture_key` (string, optional)
- `student_course` (string, required, non-empty)
- `student_branch` (string, required, non-empty)
- `student_current_year` (integer, required, 1–8)
- `student_semester` (integer, required, 1–16)
- `student_year_of_admission` (integer, required, 1900–2100)

Note: Passwords are used to create auth users but are NOT stored in the `students` table.

**Success Response (201 Created, all succeeded):**
```json
{
  "success": true,
  "summary": { "total": 2, "succeeded": 2, "failed": 0 },
  "results": [
    { "index": 0, "success": true, "userId": "uuid-1", "student": { /* inserted row */ } },
    { "index": 1, "success": true, "userId": "uuid-2", "student": { /* inserted row */ } }
  ]
}
```

**Partial Success Response (207 Multi-Status, some failed):**
```json
{
  "success": false,
  "summary": { "total": 2, "succeeded": 1, "failed": 1 },
  "results": [
    { "index": 0, "success": true, "userId": "uuid-1", "student": { /* inserted row */ } },
    { "index": 1, "success": false, "error": "<validation or processing error>" }
  ]
}
```

**Error Responses:**
- 400 Bad Request
  - JSON path received but body is neither array nor object with `students` array:
  ```json
  {
    "success": false,
    "message": "Expected JSON array of students or object with 'students' array, or CSV via multipart/form-data"
  }
  ```
  - Multipart path without a `file` upload:
  ```json
  {
    "success": false,
    "message": "CSV file missing. Upload using form-data with field name 'file'"
  }
  ```
  - CSV parse error:
  ```json
  {
    "success": false,
    "message": "CSV parse error: <details>"
  }
  ```
  - No records provided:
  ```json
  {
    "success": false,
    "message": "No student records provided"
  }
  ```
  - All records failed validation/processing (no successes): returns 400 with the multi-record structure above.

- 207 Multi-Status
  - Mixed success/failure across records (at least one success and one failure).

- 201 Created
  - All records succeeded.

- 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

**Notes:**
- Each record is sanitized and validated before processing.
- Validation includes email format, password strength, numeric ranges, and phone number digit checks.
- For each valid record:
  - An auth user is created via Supabase Admin with metadata: `{ display_name: student_name, role: "STUDENT" }`.
  - A row is inserted into the `students` table with `student_id = <auth user id>` and without storing the plaintext password.
- Response includes a per-record `results` array with `index`, `success`, and either `{ userId, student }` on success or `{ error }` on failure.
- Status code logic:
  - 201 if all records succeeded
  - 207 if some succeeded and some failed
  - 400 if input is invalid or all records failed
  - 500 for unexpected server errors

#### Get All Students
Retrieve all students from the `students` table.

- **Endpoint**: `GET /api/students/getAllStudents`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "students": [
      {
        "student_id": "uuid-here",
        "student_name": "Jane Doe",
        "student_email": "jane.doe@example.com",
        "student_phone_number": "+1 555 000 1234",
        "student_profile_picture_key": null,
        "student_course": "B.Tech",
        "student_branch": "CSE",
        "student_current_year": 3,
        "student_semester": 6,
        "student_year_of_admission": 2022,
        "created_at": "2025-09-27T16:00:17.342685",
        "updated_at": "2025-09-27T16:00:17.342685"
      }
    ]
  }
  ```
- **Error Responses**:
  - 500 Internal Server Error
  ```json
  {
    "success": false,
    "message": "Internal Server Error"
  }
  ```

## Events

### Create Event
Create a new event in the system. Only accessible by authenticated admins.

- **Endpoint**: `POST /api/events/:adminId/createEvent`
- **Path Parameters**:
  - `adminId` (required): ID of the admin creating the event
- **Request Body**:
  ```json
  {
    "event_name": "Annual Alumni Meet 2023",
    "event_date_time": "2023-12-31T20:00:00.000Z",
    "event_description": "Join us for the annual alumni meet and greet",
    "event_poster_key": "events/posters/meet-2023.jpg"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Event created successfully",
    "data": {
      "event_id": "event-uuid-here",
      "admin_id": "admin-uuid-here",
      "event_name": "Annual Alumni Meet 2023",
      "event_description": "Join us for the annual alumni meet and greet",
      "event_poster_key": "events/posters/meet-2023.jpg",
      "event_date_time": "2023-12-31T20:00:00.000Z",
      "created_at": "2023-09-18T12:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - 400: Missing required fields
  ```json
  {
    "success": false,
    "message": "Event name and date/time are required"
  }
  ```
  - 404: Admin not found
  ```json
  {
    "success": false,
    "message": "Admin not found or unauthorized"
  }
  ```
  - 500: Server error
  ```json
  {
    "success": false,
    "message": "Server error while creating event"
  }
  ```

### Get All Events
Retrieve all events with admin details. Only accessible by authenticated admins.

- **Endpoint**: `GET /api/events/:adminId/getAllEvents`
- **Path Parameters**:
  - `adminId` (required): ID of the admin making the request (used for authentication only)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "event_id": "event-1-uuid",
        "admin_id": "admin-1-uuid",
        "admin_name": "Admin User",
        "event_name": "Annual Alumni Meet 2023",
        "event_description": "Join us for the annual alumni meet and greet",
        "event_poster_key": "events/posters/meet-2023.jpg",
        "event_date_time": "2023-12-31T20:00:00.000Z",
        "created_at": "2023-09-18T12:00:00.000Z",
        "updated_at": "2023-09-18T12:00:00.000Z"
      },
      {
        "event_id": "event-2-uuid",
        "admin_id": "admin-2-uuid",
        "admin_name": "Another Admin",
        "event_name": "Workshop on AI",
        "event_description": "Learn about latest AI trends",
        "event_poster_key": null,
        "event_date_time": "2023-11-15T15:30:00.000Z",
        "created_at": "2023-09-17T10:30:00.000Z",
        "updated_at": "2023-09-17T10:30:00.000Z"
      }
    ]
  }
  ```
- **Error Responses**:
  - 404: Admin not found
  ```json
  {
    "success": false,
    "message": "Admin not found or unauthorized"
  }
  ```
  - 500: Server error
  ```json
  {
    "success": false,
    "message": "Server error while fetching events"
  }
  ```

**Notes**:
- The `adminId` in the URL is only used for authentication, not for filtering events
- All events from all admins are returned
- The `admin_name` is joined from the admins table

## Messages

### Create Message
Send a message to one or more alumni and associate it with an event. The API prevents sending duplicate invitations for the same event to the same alumni and will return HTTP 409 with a list of duplicate alumni IDs.

**Endpoint:** `POST /api/messages/:adminId/createMessage`

**Path Parameters:**
- `adminId` (required): ID of the admin sending the message

**Request Body:**
```json
{
  "alumni_ids": ["alumni-uuid-1", "alumni-uuid-2"],
  "event_id": 12345,
  "message": "Hello! This is a test message.",
  "message_file_key": "path/to/uploaded/file.pdf"
}
```
- `alumni_ids` (required, array of UUIDs): Array of alumni IDs to receive the message
- `event_id` (required, long): Numeric ID of the event this message is related to
- `message` (required, string): The message content
- `message_file_key` (optional, string): Path to an uploaded file if the message includes an attachment

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Message and invitations created successfully",
  "data": [
    {
      "id": "message-uuid-1",
      "admin_id": "admin-uuid",
      "alumni_id": "alumni-uuid-1",
      "event_id": 12345,
      "message": "Hello! This is a test message.",
      "message_file_key": "path/to/uploaded/file.pdf",
      "created_at": "2023-12-01T10:00:00.000Z"
    },
    {
      "id": "message-uuid-2",
      "admin_id": "admin-uuid",
      "alumni_id": "alumni-uuid-2",
      "event_id": 12345,
      "message": "Hello! This is a test message.",
      "message_file_key": "path/to/uploaded/file.pdf",
      "created_at": "2023-12-01T10:00:00.000Z"
    }
  ]
}
```

Notes:
- Upon success, corresponding invitation rows are automatically created in `alumni_invitations` with:
  - `admin_alumni_message_id` referencing each created message
  - `event_id` copied from the message
  - `alumni_confirmation_status` defaulted to `PENDING`
  - `alumni_response_message` set to `null`

**Error Responses:**
- 400: Missing required fields
  ```json
  {
    "success": false,
    "message": "Message content is required"
  }
  ```
  OR
  ```json
  {
    "success": false,
    "message": "At least one alumni_id is required"
  }
  ```

- 409: Duplicate invitations (one or more alumni already have an invitation for this event)
  ```json
  {
    "success": false,
    "message": "One or more alumni already have an invitation for this event",
    "duplicates": [
      "alumni-uuid-1",
      "alumni-uuid-2"
    ]
  }
  ```

- 500: Internal server error
  ```json
  {
    "success": false,
    "message": "Internal Server Error",
    "error": "Error details here"
  }
  ```

  ### Get All Invitations
Retrieve all invitations for a specific alumni.

- **Endpoint**: `GET /api/messages/:alumniId/getAllInvitations`
- **Path Parameters**:
  - `alumniId` (required): ID of the alumni

**Success Response (200 OK):**
```json
{
    "success": true,
    "invitations": [
        {
            "alumni_invitation_id": 3,
            "event_id": 2,
            "created_at": "2025-09-27T16:00:17.342685",
            "admin_alumni_messages": {
                "alumni_id": "1a1d1321-212e-40c6-912a-1ea845d19a10"
            },
            "events": {
                "event_name": "Alumni Meet 2023",
                "event_date_time": "2023-12-31T14:30:00",
                "event_poster_key": "path/to/poster.jpg",
                "event_description": "Annual alumni gathering"
            }
        }
    ]
}
```

### Update Invitation Status

Update an invitation's status for a specific alumni and event.

- **Endpoint**: `PATCH /api/messages/:alumniId/:eventId/updateInvitationStatus`
- **Path Parameters**:
  - `alumniId` (required): ID of the alumni responding
  - `eventId` (required): ID of the event
- **Request Body**:
  ```json
  {
    "alumni_confirmation_status": "ACCEPTED",
    "alumni_response_message": "Looking forward to it!"
  }
  ```
  - `alumni_confirmation_status` (required, enum): Must be one of `ACCEPTED`, `REJECTED`
  - `alumni_response_message` (optional, string): Additional response message from the alumni

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation status updated successfully",
  "data": {
    "alumni_invitation_id": 3,
    "admin_alumni_message_id": 12,
    "event_id": 2,
    "alumni_confirmation_status": "ACCEPTED",
    "alumni_response_message": "Looking forward to it!",
    "created_at": "2025-09-27T16:00:17.342685"
  }
}
```

**Enums**
- `alumni_confirmation_status` accepts only the following UPPERCASE values:
  - `ACCEPTED`
  - `REJECTED`
- Any other value (including lowercase variants) will be rejected with HTTP 400.
- When invitations are created via `POST /api/messages/:adminId/createMessage`, they start as `PENDING` internally. This PATCH endpoint transitions the status to either `ACCEPTED` or `REJECTED`.

**Error Responses:**
- 400: Invalid or missing fields
  ```json
  {
    "success": false,
    "message": "alumni_confirmation_status must be one of: ACCEPTED, REJECTED"
  }
  ```
- 404: Not found
  ```json
  {
    "success": false,
    "message": "No message found for the given alumniId and eventId"
  }
  ```
  OR
  ```json
  {
    "success": false,
    "message": "No invitation found for the given alumniId and eventId"
  }
  ```
- 500: Internal server error
  ```json
  {
    "success": false,
    "message": "Internal Server Error"
  }
  ```