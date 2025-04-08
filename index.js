// Load env variables
require('dotenv').config();

// imports
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const { logger } = require('./server/logger');
const { requestLogger } = require('./server/middleware/loggerMiddleware');

// Import routes
const societyRoutes = require('./server/routes/register_society');
const societySetupRoutes = require('./server/routes/society_setup');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect with MongoDB
mongoose.connect('mongodb://127.0.0.1/NeighbourNet')
    .then(() => logger.info("Connected to database successfully!"))
    .catch((error) => logger.error("Database connection error:", error.message));

// Middleware
app.use(bodyParser.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply request logger middleware
app.use(requestLogger);

// Routes
app.use('/api/society', societyRoutes);
app.use('/society/setup', societySetupRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to NeighbourNet API',
        version: '1.0.0'
    });
});

//listening to server at port
app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));