import express from 'express';
import mongoose from 'mongoose';
import partyRoutes from './route/party.js';
import authRoutes from './route/user.js';
import accountRoutes from './route/account.js';
import dotenv from 'dotenv';
import cors from 'cors';
import { createDefaultAdmin } from './controller/user.js';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from './model/User.js'; 
import Party from './model/Party.js';
import Account from './model/Account.js';

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

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Transporter verification failed:', error);
  } else {
    console.log('Transporter is ready to send emails');
  }
});

// Cron job to send daily emails at 1 PM
cron.schedule('0 0 11 * * *', async () => {
  console.log('Cron job started at', new Date().toISOString());
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (let user of users) {
      if (!user.email) {
        console.log(`Skipping user ${user._id}: No email provided`);
        continue;
      }

      if (!user.autoJobEnabled) {
        console.log(`Skipping user ${user.email}: Auto-job is disabled`);
        continue;
      }

      console.log(`Processing email for user: ${user.email}`);
      const parties = await Party.find({ createdBy: user._id });
      const partyIds = parties.map(p => p._id);
      console.log(`Found ${parties.length} parties for user ${user.email}`);

      const accounts = await Account.find({ partyname: { $in: partyIds } }).populate('partyname', 'partyname');
      console.log(`Found ${accounts.length} accounts for user ${user.email}`);

      const grouped = {};
      accounts.forEach(acc => {
        const pId = acc.partyname._id.toString();
        const pName = acc.partyname.partyname;
        if (!grouped[pId]) {
          grouped[pId] = { name: pName, accounts: [], totalCredit: 0, totalDebit: 0 };
        }
        grouped[pId].accounts.push({
          _id: acc._id,
          date: acc.date.toISOString(),
          credit: Number(acc.credit) || 0,
          debit: Number(acc.debit) || 0,
          remark: acc.remark || '',
          verified: acc.verified || false,
          createdAt: acc.createdAt.toISOString(),
        });
        grouped[pId].totalCredit += Number(acc.credit) || 0;
        grouped[pId].totalDebit += Number(acc.debit) || 0;
      });

      const jsonData = JSON.stringify(grouped, null, 2);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AMS Admin <flagcartshop@gmail.com>',
        to: user.email,
        subject: 'Daily Account Statement JSON',
        text: 'Attached is your daily account data in JSON format.',
        attachments: [
          {
            filename: 'account_data.json',
            content: jsonData,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${user.email}`);
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});