import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const protect = async (req, res, next) => {
let token;
if (
    req.headers.authorization && req.headers.authorization.startsWith('Bearer')
) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      req.user = user;
      return next();
    } catch (error) {
      logger.error(`Token error: ${error.message}`);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
if (!token) {
    logger.warn('No token provided'); 
    return res.status(401).json({ message: 'Not authorized, no token' });
}
};