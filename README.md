# Alumni Management System - Backend

## Table of Contents
- [Database Connections](#database-connections)
  - [PostgreSQL](#postgresql)
  - [Supabase](#supabase)
- [API Documentation](#api-documentation)
  - [User Authentication](#user-authentication)
    - [Sign Up (`POST /api/user/signup`)](#sign-up)

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
  "yearOfGraduation": "2020"
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
    "yearOfGraduation": "2020"
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