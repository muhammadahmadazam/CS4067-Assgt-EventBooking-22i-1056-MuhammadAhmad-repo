// Load environment variables from a .env file
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const amqplib = require('amqplib');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// PostgreSQL connection setup using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Service URLs loaded from environment variables
const SPRING_BOOT_URL = process.env.SPRING_BOOT_URL || 'http://localhost:8080';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'booking_notifications';
const JWT_SECRET = process.env.JWT_SECRET; // JWT secret for decoding tokens

// Create bookings table if it doesn’t exist
pool.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating bookings table:', err));

// Middleware to decode JWT from cookies and attach user email to request
const decodeToken = (req, res, next) => {
  const token = req.cookies.token; // Get token from cookies
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded); // Log the full decoded payload for debugging

    // Try to extract email from different possible field names, prioritizing 'sub'
    let userEmail = decoded.sub || decoded.email || decoded.emailAddress;

    if (!userEmail || typeof userEmail !== 'string' || userEmail.trim() === '') {
      console.error('No valid email found in token payload:', decoded);
      return res.status(400).json({ error: 'Invalid or missing email in token' });
    }

    req.userEmail = userEmail.trim(); // Set userEmail to the found email value
    console.log('User email:', req.userEmail);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// POST /bookings endpoint
app.post('/bookings', decodeToken, async (req, res) => {
  const { eventId } = req.body;
  const userEmail = req.userEmail; // Extracted from the decoded token

  // Validate request body and userEmail
  if (!eventId) {
    return res.status(400).json({ error: 'Missing required field: eventId' });
  }
  if (!userEmail || typeof userEmail !== 'string' || userEmail.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing user email' });
  }

  // Step 1: Check seat availability via Spring Boot API
  try {
    const response = await axios.get(`${SPRING_BOOT_URL}/api/events/${eventId}/seats`);
    const availableSeats = response.data;

    if (availableSeats <= 0) {
      return res.status(400).json({ error: 'No seats available' });
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.error('Error checking seat availability:', error.message);
    return res.status(500).json({ error: 'Failed to check seat availability' });
  }

  // Step 2: Mock payment service call (assume success for simplicity)
  const paymentSuccessful = true; // Replace with actual payment logic if needed
  if (!paymentSuccessful) {
    return res.status(402).json({ error: 'Payment failed' });
  }

  // Step 3: Save booking to PostgreSQL (using eventId and userEmail only)
  try {
    const query = `
      INSERT INTO bookings (event_id, user_email)
      VALUES ($1, $2)
      RETURNING id
    `;
    const values = [eventId, userEmail];
    const result = await pool.query(query, values);
    const bookingId = result.rows[0].id;

    // Step 4: Publish booking confirmation to RabbitMQ
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    const message = JSON.stringify({ bookingId, eventId, userEmail });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
    console.log('Message published to RabbitMQ:', message);

    await channel.close();
    await connection.close();

    // Step 5: Return success response
    return res.status(201).json({
      message: 'Booking created successfully',
      bookingId
    });
  } catch (error) {
    console.error('Error processing booking:', error.message);
    return res.status(500).json({ error: 'Failed to process booking' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Booking service running on port ${PORT}`);
});