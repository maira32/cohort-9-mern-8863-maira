import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  let statusCode = res.statusCode;
  if (statusCode === 200) {
    statusCode = err.statusCode || err.status || 500;
  }
  
  const safeMethod = String(req.method).replace(/[\r\n]/g, '');
  const safeUrl = String(req.originalUrl).replace(/[\r\n]/g, '');
  const safeMessage = String(err.message).replace(/[\r\n]/g, '');

  logger.error(`[${safeMethod}] ${safeUrl} - ${safeMessage}`);
  
  if (process.env.NODE_ENV !== 'production') {
    const safeStack = String(err.stack).replace(/[\r\n]/g, ' ');
    logger.error(safeStack);
  }
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};