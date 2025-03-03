# Event Service API Documentation

This document provides details on the available endpoints for the Event Service API.

## Endpoints

### GET /api/events

Retrieves all events in the system.

#### Input:

No request body required.

#### Output:

Response Body:
```json
[
  {
    "id": "event123",
    "name": "Concert",
    "description": "Live music event",
    "date": "2025-04-15T19:00:00",
    "location": "City Arena",
    "seats": 500,
    "price": 75.00
  },
  {
    "id": "event456",
    "name": "Conference",
    "description": "Tech conference",
    "date": "2025-05-20T09:00:00",
    "location": "Convention Center",
    "seats": 300,
    "price": 125.50
  }
]
```

#### Example cURL Request:

```bash
curl -X 'GET' \
  'http://localhost:8080/api/events' \
  -H 'accept: application/json'
```

### GET /api/events/{id}

Retrieves a specific event by its ID.

#### Input:

No request body required.

#### Output:

Response Body:
```json
{
  "id": "event123",
  "name": "Concert",
  "description": "Live music event",
  "date": "2025-04-15T19:00:00",
  "location": "City Arena",
  "seats": 500,
  "price": 75.00
}
```

#### Example cURL Request:

```bash
curl -X 'GET' \
  'http://localhost:8080/api/events/event123' \
  -H 'accept: application/json'
```

### POST /api/events

Creates a new event.

#### Input:

Request Body:
```json
{
  "name": "Workshop",
  "description": "Hands-on coding workshop",
  "date": "2025-06-10T14:00:00",
  "location": "Tech Hub",
  "seats": 50,
  "price": 25.00
}
```

#### Output:

Response Body:
```json
{
  "id": "event789",
  "name": "Workshop",
  "description": "Hands-on coding workshop",
  "date": "2025-06-10T14:00:00",
  "location": "Tech Hub",
  "seats": 50,
  "price": 25.00
}
```

#### Example cURL Request:

```bash
curl -X 'POST' \
  'http://localhost:8080/api/events' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Workshop",
  "description": "Hands-on coding workshop",
  "date": "2025-06-10T14:00:00",
  "location": "Tech Hub",
  "seats": 50,
  "price": 25.00
}'
```

### PUT /api/events/{id}

Updates an existing event.

#### Input:

Request Body:
```json
{
  "name": "Updated Workshop",
  "description": "Updated description",
  "date": "2025-06-11T15:00:00",
  "location": "New Location",
  "seats": 75,
  "price": 30.00
}
```

#### Output:

Response Body:
```json
{
  "id": "event789",
  "name": "Updated Workshop",
  "description": "Updated description",
  "date": "2025-06-11T15:00:00",
  "location": "New Location",
  "seats": 75,
  "price": 30.00
}
```

#### Example cURL Request:

```bash
curl -X 'PUT' \
  'http://localhost:8080/api/events/event789' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Updated Workshop",
  "description": "Updated description",
  "date": "2025-06-11T15:00:00",
  "location": "New Location",
  "seats": 75,
  "price": 30.00
}'
```

### DELETE /api/events/{id}

Deletes an event by ID.

#### Input:

No request body required.

#### Output:

No content in response body (HTTP 204)

#### Example cURL Request:

```bash
curl -X 'DELETE' \
  'http://localhost:8080/api/events/event789' \
  -H 'accept: application/json'
```

### GET /api/events/{id}/seats

Retrieves the number of available seats for a specific event.

#### Input:

No request body required.

#### Output:

Response Body:
```json
75
```

#### Example cURL Request:

```bash
curl -X 'GET' \
  'http://localhost:8080/api/events/event789/seats' \
  -H 'accept: application/json'
```

## Status Codes

- `200 OK`: The request was successful
- `201 Created`: A new resource was successfully created
- `204 No Content`: The request was successful but there is no representation to return
- `404 Not Found`: The requested resource could not be found