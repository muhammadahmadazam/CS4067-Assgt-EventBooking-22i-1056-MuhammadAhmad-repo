# Authentication Service API Documentation

This document provides details on the available endpoints for the Authentication Service API.

## Endpoints

### POST /api/auth/login

Authenticates a user and returns an access token.

#### Input:

Request Body:
```json
{
  "username": "user@example.com",
  "password": "yourpassword"
}
```

#### Output:

Response Body:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Example cURL Request:

```bash
curl -X 'POST' \
  'http://localhost:8000/api/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=user%40example.com&password=yourpassword'
```

### POST /api/auth/register

Registers a new user with USER role.

#### Input:

Request Body:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Output:

Response Body:
```json
{
  "email": "newuser@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "USER",
  "id": "user123"
}
```

#### Example cURL Request:

```bash
curl -X 'POST' \
  'http://localhost:8000/api/auth/register' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "newuser@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}'
```

### GET /api/users/me

Retrieves the profile of the currently authenticated user.

#### Input:

No request body required.
Authentication: Bearer token required.

#### Output:

Response Body:
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "USER",
  "id": "user123"
}
```

#### Example cURL Request:

```bash
curl -X 'GET' \
  'http://localhost:8000/api/users/me' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### GET /api/users

Retrieves a list of all users. Admin access only.

#### Input:

No request body required.
Authentication: Bearer token with ADMIN role required.

#### Output:

Response Body:
```json
[
  {
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "ADMIN",
    "id": "admin123"
  },
  {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "USER",
    "id": "user123"
  }
]
```

#### Example cURL Request:

```bash
curl -X 'GET' \
  'http://localhost:8000/api/users' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### POST /api/admin/create

Creates a new user with ADMIN role. Admin access only.

#### Input:

Request Body:
```json
{
  "email": "newadmin@example.com",
  "password": "secureadminpassword",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

Authentication: Bearer token with ADMIN role required.

#### Output:

Response Body:
```json
{
  "email": "newadmin@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "ADMIN",
  "id": "admin456"
}
```

#### Example cURL Request:

```bash
curl -X 'POST' \
  'http://localhost:8000/api/admin/create' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "newadmin@example.com",
  "password": "secureadminpassword",
  "first_name": "Jane",
  "last_name": "Smith"
}'
```

## Status Codes

- `200 OK`: The request was successful
- `201 Created`: A new resource was successfully created
- `400 Bad Request`: The request was invalid or cannot be served (e.g., email already registered)
- `401 Unauthorized`: Authentication credentials are missing or invalid
- `403 Forbidden`: The authenticated user doesn't have the required role/permission
- `404 Not Found`: The requested resource could not be found

## Authentication

This API uses JWT (JSON Web Token) authentication. To access protected endpoints:
1. Obtain a token via the `/api/auth/login` endpoint
2. Include the token in the Authorization header of subsequent requests:
   `Authorization: Bearer {your_token}`

## User Roles

- `USER`: Standard user with access to their own profile
- `ADMIN`: Administrator with access to all users and admin-only endpoints