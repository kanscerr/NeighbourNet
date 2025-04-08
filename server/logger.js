const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('winston-daily-rotate-file');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format with timestamp, level, and message
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log levels (from most to least severe)
const levels = {
  error: 0,    // Critical errors that need immediate attention
  warn: 1,     // Warnings that don't stop execution but indicate problems
  info: 2,     // General information about application operation
  http: 3,     // HTTP request logs
  debug: 4,    // Detailed debugging information
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Set level based on environment
  levels,
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    
    // Daily rotate file for all logs (info and above)
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',        // Rotate when file reaches 10MB
      maxFiles: '14d',       // Keep logs for 14 days
      zippedArchive: true,   // Compress old logs
      level: 'info',         // Log info level and above
      format: logFormat
    }),
    
    // Daily rotate file for error logs only
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',        // Rotate when file reaches 10MB
      maxFiles: '30d',       // Keep error logs for 30 days
      zippedArchive: true,   // Compress old logs
      level: 'error',        // Log error level only
      format: logFormat
    }),
    
    // Daily rotate file for HTTP request logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',        // Rotate when file reaches 10MB
      maxFiles: '14d',       // Keep logs for 14 days
      zippedArchive: true,   // Compress old logs
      level: 'http',         // Log http level only
      format: logFormat
    }),
  ],
  exitOnError: false, // Don't exit on error
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log levels
const logError = (message, meta = {}) => {
  logger.error(message, meta);
};

const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

const logHttp = (message, meta = {}) => {
  logger.http(message, meta);
};

const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

// User action logger
const logUserAction = (userId, action, details = {}) => {
  logger.info(`User Action: ${action}`, {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// API request logger
const logApiRequest = (method, url, userId = null, params = {}, body = {}) => {
  logger.http(`API Request: ${method} ${url}`, {
    method,
    url,
    userId,
    params,
    body,
    timestamp: new Date().toISOString(),
  });
};

// API response logger
const logApiResponse = (method, url, statusCode, responseTime, userId = null) => {
  logger.http(`API Response: ${method} ${url} ${statusCode}`, {
    method,
    url,
    statusCode,
    responseTime,
    userId,
    timestamp: new Date().toISOString(),
  });
};

// Log rotation events
logger.on('rotate', function(oldFilename, newFilename) {
  logInfo(`Log file rotated: ${oldFilename} -> ${newFilename}`);
});

module.exports = {
  logger,
  logError,
  logWarn,
  logInfo,
  logHttp,
  logDebug,
  logUserAction,
  logApiRequest,
  logApiResponse,
}; 