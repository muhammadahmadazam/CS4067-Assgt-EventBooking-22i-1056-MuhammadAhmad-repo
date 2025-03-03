# Booking Service API Documentation

This document provides an overview of the Booking Service API, built using Node.js with Express, PostgreSQL, RabbitMQ, and JWT authentication. The service handles event bookings, seat availability checks, payment processing (simulated), and notification publishing via message queues.

## Overview

The Booking Service allows users to create bookings for events after verifying seat availability, processing payments, and storing booking details in a PostgreSQL database. It integrates with a Spring Boot service for seat availability checks and uses RabbitMQ for asynchronous notification publishing.

### Technologies Used
- **Node.js** with **Express.js** for the API framework
- **PostgreSQL** for persistent storage of bookings
- **RabbitMQ** for message queuing and notifications
- **JWT** for authentication and authorization
- **axios** for HTTP requests to external services (e.g., Spring Boot)
- **dotenv** for environment variable management

## Endpoints

### POST /bookings
Creates a new booking for an event after validating seat availability, processing payment, and storing the booking in the database.

#### Input:
**Request Body:**
```json
{
  "eventId": "evt123"
}