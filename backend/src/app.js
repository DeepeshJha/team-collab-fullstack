const express = require('express'); // Import Express framework
const cors = require('cors');       // Enable Cross-Origin Resource Sharing
const morgan = require('morgan');   // HTTP request logger middleware
require('dotenv').config();         // Load environment variables from .env

const indexRouter = require('./routes'); // Import main router

const app = express();              // Create Express app instance

app.use(cors());                    // Allow requests from other origins (frontend)
app.use(express.json());            // Parse incoming JSON requests
app.use(morgan('dev'));             // Log HTTP requests in development format

app.use('/', indexRouter);          // Use the main router for root path

const PORT = process.env.PORT || 5000; // Get port from .env or default to 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;               // Export app for testing or further use