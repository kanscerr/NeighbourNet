// imports
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { logger } = require('./server/logger');
const { requestLogger } = require('./server/middleware/loggerMiddleware');

const app = express();
const PORT = 5000;

//connecting with mongodb compass locally
mongoose.connect('mongodb://127.0.0.1/NeighbourNet')
    .then(() => logger.info("Connected to database successfully!"))
    .catch((error) => logger.error("Database connection error:", error.message));

app.use(bodyParser.text());
app.use(express.json());

// Apply request logger middleware
app.use(requestLogger);

//listening to server at port
app.listen(PORT, () => logger.info(`Server running on https://localhost:${PORT}`));