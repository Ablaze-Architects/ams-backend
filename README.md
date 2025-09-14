# Alumni Management System - Backend

## Table of Contents
- [Database Connections](#database-connections)
  - [PostgreSQL](#postgresql)
  - [Supabase](#supabase)
- [API Documentation](#api-documentation)
  - [User Authentication](#user-authentication)
    - [Sign Up (`POST /api/user/signup`)](#sign-up)
    - [Login (`POST /api/user/login`)](#login)

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

