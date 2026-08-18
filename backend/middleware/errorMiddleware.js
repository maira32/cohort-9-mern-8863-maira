import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  let statusCode = res.statusCode;
  if (statusCode === 200) {
    statusCode = err.statusCode || err.status || 500;
  }
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.error(err.stack);
  }
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};