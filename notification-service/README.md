# Email Notification Service

## What It Is

The Email Notification Service is a Go-based microservice that handles automated email confirmations for an event booking system. It serves as the communication bridge between the booking system and users, ensuring customers receive timely confirmation of their event bookings.

## How It Works

### Core Functionality

The service operates through a simple but effective workflow:

1. **Message Queue Integration**: 
   - Connects to RabbitMQ and listens to the `booking_notifications` queue
   - Waits for booking confirmation messages triggered by the main application

2. **Message Processing**:
   - Consumes JSON messages containing booking details (bookingId, eventId, userEmail)
   - Deserializes the message into a BookingNotification struct
   - Validates the email address format

3. **Email Delivery**:
   - Utilizes Google's Gmail API for sending emails
   - Authenticates using OAuth2 protocol
   - Constructs confirmation emails with booking details
   - Sends personalized confirmation emails to users

### Technical Architecture

```
┌──────────────┐     ┌─────────┐     ┌────────────────────┐     ┌───────────┐
│ Booking      │     │         │     │                    │     │           │
│ Service      │────▶│ RabbitMQ │────▶│ Email Notification │────▶│ Gmail API │
│              │     │         │     │ Service            │     │           │
└──────────────┘     └─────────┘     └────────────────────┘     └───────────┘
```

### Authentication Mechanism

The service implements a robust OAuth2 authentication flow:

1. Loads Google API credentials from a file path specified in environment variables
2. Attempts to use an existing authentication token
3. If no valid token exists, initiates an interactive OAuth flow:
   - Starts a local server on port 8085 to receive the callback
   - Generates an authentication URL for manual authorization
   - Receives and processes the authorization code
   - Exchanges the code for an access token
   - Stores the token for future use

### Message Format

The service processes RabbitMQ messages in the following JSON structure:

```json
{
  "bookingId": 123,
  "eventId": "event_789",
  "userEmail": "user@example.com"
}
```

### Email Template

When a booking is confirmed, the service generates an email with the following format:

```
Subject: Booking Confirmation for Event {eventId}

Dear User,

Your registration for Event {eventId} (Booking ID: {bookingId}) was successful!

Thank you for booking with us. If you have any questions, feel free to contact us.

Best regards,
Your Event Booking Team
```

### Error Handling

The service includes comprehensive error handling for:
- Invalid email formats
- RabbitMQ connection failures
- Message parsing errors
- Gmail API authentication issues
- Email sending failures

### Logging

Detailed logging is implemented throughout the service workflow:
- Connection status with RabbitMQ
- Message receipt and processing
- OAuth2 authentication steps
- Email sending attempts and results
- Error conditions and recovery actions