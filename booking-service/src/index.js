// Load environment variables from a .env file
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const amqplib = require('amqplib');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
const JWT_SECRET = process.env.JWT_SECRET;

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
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let userEmail = decoded.sub || decoded.email || decoded.emailAddress;
    
    if (!userEmail || typeof userEmail !== 'string' || userEmail.trim() === '') {
      console.error('No valid email found in token payload:', decoded);
      return res.status(400).json({ error: 'Invalid or missing email in token' });
    }

    req.userEmail = userEmail.trim();
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: The ID of the event to book
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bookingId:
 *                   type: integer
 *       400:
 *         description: Bad request - Missing or invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       402:
 *         description: Payment required - Payment failed
 *       404:
 *         description: Not found - Event not found
 *       500:
 *         description: Internal server error
 */
app.post('/bookings', decodeToken, async (req, res) => {
  const { eventId } = req.body;
  const userEmail = req.userEmail;

  if (!eventId) {
    return res.status(400).json({ error: 'Missing required field: eventId' });
  }
  if (!userEmail || typeof userEmail !== 'string' || userEmail.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing user email' });
  }

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

  const paymentSuccessful = true;
  if (!paymentSuccessful) {
    return res.status(402).json({ error: 'Payment failed' });
  }

  try {
    const query = `
      INSERT INTO bookings (event_id, user_email)
      VALUES ($1, $2)
      RETURNING id
    `;
    const values = [eventId, userEmail];
    const result = await pool.query(query, values);
    const bookingId = result.rows[0].id;

    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    const message = JSON.stringify({ bookingId, eventId, userEmail });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });

    await channel.close();
    await connection.close();

    return res.status(201).json({
      message: 'Booking created successfully',
      bookingId
    });
  } catch (error) {
    console.error('Error processing booking:', error.message);
    return res.status(500).json({ error: 'Failed to process booking' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Booking service running on port ${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
});