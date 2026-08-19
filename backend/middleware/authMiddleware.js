import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && /^bearer\s+/i.test(authHeader)) {
    try {
      token = authHeader.split(/\s+/)[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      req.user = user;
      return next();
    } catch {
      logger.error('Token verification failed during authorization');
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    logger.warn('No token provided'); 
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};