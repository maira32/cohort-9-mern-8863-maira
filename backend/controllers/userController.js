import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import bcrypt from 'bcryptjs';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: '30d', });

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      logger.warn('Missing signup fields');
      return res.status(400).json({ message: 'Please fill all fields' });
    }
    const userExists = await User.findOne({ email: String(email) });
    if (userExists) {
      logger.warn('Email already in use');
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({
      name,
      email: String(email),
      password,
    });
    logger.info('User successfully registered');
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error('Registration failed due to an internal server exception');
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      logger.warn('Missing login fields');
      return res.status(400).json({ message: 'Please enter email and password' });
    }
    const user = await User.findOne({ email: String(email) }).select('+password');
    if (!user) {
      logger.warn('User not found during login attempt');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Wrong password attempt');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    logger.info('User logged in successfully');
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error('Login failed due to an internal server exception');
    res.status(500).json({ message: 'Something went wrong' });
  }
};