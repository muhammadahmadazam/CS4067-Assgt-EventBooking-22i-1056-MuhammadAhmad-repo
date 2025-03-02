const express = require('express');
const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  console.log('Received request to /');
  res.send('Hello from Booking Service!');
});

// Start the server
app.listen(port, () => {
  console.log(`Booking Service listening at http://localhost:${port}`);
});