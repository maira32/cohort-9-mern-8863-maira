import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import logger from './config/logger.js'; 
import { errorHandler } from './middleware/errorMiddleware.js'; 

dotenv.config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use(errorHandler);

try {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
} catch (error) {
  logger.error(`Failed to connect to the database: ${error.message}`);
  process.exit(1);
}