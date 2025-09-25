// import express from 'express';
// import mongoose from 'mongoose';
// import partyRoutes from './route/party.js';
// import authRoutes from './route/user.js';
// import accountRoutes from './route/account.js';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import { createDefaultAdmin } from './controller/user.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 4050;

// app.use(cors());
// app.use(express.json());

// app.use('/api/parties', partyRoutes);
// app.use('/api', authRoutes);
// app.use('/api/accounts', accountRoutes);

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('Connected to MongoDB');
//     createDefaultAdmin()
//       .then(() => console.log('createDefaultAdmin executed successfully'))
//       .catch((err) => console.error('Error executing createDefaultAdmin:', err.message));
//   })
//   .catch((error) => {
//     console.error('MongoDB connection error:', error.message);
//     process.exit(1); 
//   });


// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });



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

// Email transporter setup (assuming Gmail; configure .env with EMAIL_USER, EMAIL_PASS, EMAIL_FROM)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Cron job to send daily emails at 11 AM
cron.schedule('0 0 11 * * *', async () => {
  try {
    const users = await User.find({});
    for (let user of users) {
      if (!user.email) continue; // Skip if no email

      const parties = await Party.find({ createdBy: user._id });
      const partyIds = parties.map(p => p._id);
      const accounts = await Account.find({ partyname: { $in: partyIds } }).populate('partyname', 'partyname');

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
        from: process.env.EMAIL_FROM,
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
      console.log(`Email sent to ${user.email}`);
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});