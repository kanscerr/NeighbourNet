const { logApiRequest, logApiResponse } = require('../logger');
const requestLogger = (req, res, next) => {
  const userId = req.user ? req.user.user_id : null;
  logApiRequest(
    req.method,
    req.originalUrl,
    userId,
    req.params,
    req.body
  );
  
  // Store the start time for calculating response time
  req.startTime = Date.now();
  
  // Capture the response
  const originalSend = res.send;
  res.send = function (body) {
    // Calculate response time
    const responseTime = Date.now() - req.startTime;
    
    // Log the response
    logApiResponse(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      userId
    );
    
    // Call the original send method
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = {
  requestLogger
}; 