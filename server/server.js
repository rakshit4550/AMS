import express from 'express';
import mongoose from 'mongoose';
import partyRoutes from './route/party.js';
import authRoutes from './route/user.js';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4050; // Use 4050 to match the error's port

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Routes
app.use('/api/parties', partyRoutes);
app.use('/api', authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});