import express from 'express';
import mongoose from 'mongoose';
import partyRoutes from './route/party.js';
import authRoutes from './route/user.js';
import accountRoutes from './route/account.js';
import dotenv from 'dotenv';
import cors from 'cors';
import { createDefaultAdmin } from './controller/user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4050;

app.use(cors());
app.use(express.json());

app.use('/api/parties', partyRoutes);
app.use('/api', authRoutes);
app.use('/api/accounts', accountRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    createDefaultAdmin()
      .then(() => console.log('createDefaultAdmin executed successfully'))
      .catch((err) => console.error('Error executing createDefaultAdmin:', err.message));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); 
  });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});