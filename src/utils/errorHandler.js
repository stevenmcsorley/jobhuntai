/**
 * Centralized error handling utilities
 */

class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class GroqError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'GroqError';
    this.originalError = originalError;
  }
}

/**
 * Enhanced error handler middleware for Express
 */
function errorHandler(err, req, res, next) {
  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Handle different error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
      details: err.details || null,
      field: err.field || null
    });
  }

  if (err.name === 'GroqError') {
    return res.status(503).json({
      error: 'AI service temporarily unavailable',
      message: 'Please try again in a few moments',
      retryAfter: 30
    });
  }

  if (err.name === 'APIError') {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    return res.status(500).json({
      error: 'Database error',
      message: 'A database error occurred. Please try again.'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again.' 
      : err.message
  });
}

/**
 * Async handler wrapper to catch promise rejections
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Retry mechanism for AI API calls
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors or 4xx client errors
      if (error.name === 'ValidationError' || 
          (error.status >= 400 && error.status < 500)) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new GroqError(`Failed after ${maxRetries} attempts`, lastError);
}

/**
 * Circuit breaker pattern for external services
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new APIError('Service temporarily unavailable', 503);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

/**
 * Performance monitoring for AI operations
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(operation) {
    const startTime = process.hrtime.bigint();
    return {
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        this.recordMetric(operation, duration);
        return duration;
      }
    };
  }

  recordMetric(operation, duration) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation);
    metrics.push({
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getStats(operation) {
    const metrics = this.metrics.get(operation) || [];
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { avg, min, max, count: durations.length };
  }

  getAllStats() {
    const stats = {};
    for (const [operation, _] of this.metrics) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }
}

// Global instances
const performanceMonitor = new PerformanceMonitor();
const groqCircuitBreaker = new CircuitBreaker();

module.exports = {
  APIError,
  GroqError,
  errorHandler,
  asyncHandler,
  retryWithBackoff,
  CircuitBreaker,
  PerformanceMonitor,
  performanceMonitor,
  groqCircuitBreaker
};