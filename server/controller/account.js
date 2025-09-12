// import Account from '../model/Account.js';
// import Party from '../model/Party.js';
// import puppeteer from 'puppeteer'


// // Create a new account
// export const createAccount = async (req, res) => {
//   try {
//     const { partyname, credit = 0, debit = 0, remark } = req.body;
//     if (!partyname) {
//       return res.status(400).json({ message: 'Party name is required' });
//     }
//     // Verify party exists and belongs to the authenticated user
//     const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
//     if (!party) {
//       return res.status(404).json({ message: 'Party not found or you do not have access' });
//     }
//     const account = new Account({ partyname, credit, debit, remark, createdBy: req.user.id });
//     await account.save();
//     // Populate partyname in the response
//     const populatedAccount = await Account.findById(account._id).populate('partyname', 'partyname');
//     res.status(201).json({ message: 'Account created successfully', account: populatedAccount });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get all accounts for the authenticated user
// export const getAllAccounts = async (req, res) => {
//   try {
//     const parties = await Party.find({ createdBy: req.user.id }).select('_id');
//     const partyIds = parties.map(party => party._id);
//     const accounts = await Account.find({ partyname: { $in: partyIds } }).populate('partyname', 'partyname');
//     res.status(200).json(accounts);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get a single account by ID
// export const getAccountById = async (req, res) => {
//   try {
//     const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id }).populate('partyname', 'partyname');
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found or you do not have access' });
//     }
//     res.status(200).json(account);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Update an account
// export const updateAccount = async (req, res) => {
//   try {
//     const { partyname, credit = 0, debit = 0, remark } = req.body;
//     if (partyname) {
//       const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
//       if (!party) {
//         return res.status(404).json({ message: 'Party not found or you do not have access' });
//       }
//     }
//     const account = await Account.findOneAndUpdate(
//       { _id: req.params.id, createdBy: req.user.id },
//       { partyname, credit, debit, remark },
//       { new: true, runValidators: true }
//     ).populate('partyname', 'partyname');
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found or you do not have access' });
//     }
//     res.status(200).json({ message: 'Account updated successfully', account });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Delete an account
// export const deleteAccount = async (req, res) => {
//   try {
//     const account = await Account.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found or you do not have access' });
//     }
//     res.status(200).json({ message: 'Account deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Fetch account statement data
// // export const downloadStatement = async (req, res) => {
// //   try {
// //     const partyId = req.query.party;
// //     const query = { createdBy: req.user.id };
// //     if (partyId) {
// //       const party = await Party.findOne({ _id: partyId, createdBy: req.user.id });
// //       if (!party) {
// //         return res.status(404).json({ message: 'Party not found or you do not have access' });
// //       }
// //       query.partyname = partyId;
// //     }
// //     const accounts = await Account.find(query).populate('partyname', 'partyname').sort({ date: 1 });

// //     // Group accounts by party
// //     const grouped = {};
// //     accounts.forEach((acc) => {
// //       const pId = acc.partyname._id.toString();
// //       const pName = acc.partyname.partyname;
// //       if (!grouped[pId]) {
// //         grouped[pId] = { name: pName, accounts: [], totalCredit: 0, totalDebit: 0 };
// //       }
// //       grouped[pId].accounts.push({
// //         date: acc.date,
// //         credit: acc.credit,
// //         debit: acc.debit,
// //         remark: acc.remark || 'N/A'
// //       });
// //       grouped[pId].totalCredit += acc.credit;
// //       grouped[pId].totalDebit += acc.debit;
// //     });

// //     res.status(200).json(grouped);
// //   } catch (error) {
// //     res.status(500).json({ message: 'Server error', error: error.message });
// //   }
// // };



// export const downloadStatement = async (req, res) => {
//   try {
//     const partyId = req.query.party;
//     const query = { createdBy: req.user.id };
//     if (partyId) {
//       const party = await Party.findOne({ _id: partyId, createdBy: req.user.id });
//       if (!party) {
//         return res.status(404).json({ message: 'Party not found or you do not have access' });
//       }
//       query.partyname = partyId;
//     }
//     const accounts = await Account.find(query).populate('partyname', 'partyname').sort({ date: 1 });

//     // Group accounts by party
//     const grouped = {};
//     accounts.forEach((acc) => {
//       const pId = acc.partyname._id.toString();
//       const pName = acc.partyname.partyname;
//       if (!grouped[pId]) {
//         grouped[pId] = { name: pName, accounts: [], totalCredit: 0, totalDebit: 0 };
//       }
//       grouped[pId].accounts.push({
//         date: acc.date.toISOString().split('T')[0],
//         credit: acc.credit,
//         debit: acc.debit,
//         remark: acc.remark || 'N/A'
//       });
//       grouped[pId].totalCredit += acc.credit;
//       grouped[pId].totalDebit += acc.debit;
//     });

//     // Generate HTML content for PDF
//     let htmlContent = `
//       <html>
//         <head>
//           <style>
//             body { font-family: Arial, sans-serif; margin: 20px; }
//             h1 { text-align: center; }
//             table { width: 100%; border-collapse: collapse; margin: 20px 0; }
//             th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//             th { background-color: #f2f2f2; }
//             .total { font-weight: bold; }
//             .party-section { margin-bottom: 30px; }
//           </style>
//         </head>
//         <body>
//           <h1>Account Statement</h1>
//     `;

//     Object.keys(grouped).forEach((partyId) => {
//       const party = grouped[partyId];
//       htmlContent += `
//         <div class="party-section">
//           <h2>Party: ${party.name}</h2>
//           <table>
//             <tr>
//               <th>Date</th>
//               <th>Credit</th>
//               <th>Debit</th>
//               <th>Remark</th>
//             </tr>
//       `;
//       party.accounts.forEach((account) => {
//         htmlContent += `
//           <tr>
//             <td>${account.date}</td>
//             <td>${account.credit.toFixed(2)}</td>
//             <td>${account.debit.toFixed(2)}</td>
//             <td>${account.remark}</td>
//           </tr>
//         `;
//       });
//       htmlContent += `
//           <tr class="total">
//             <td>Total</td>
//             <td>${party.totalCredit.toFixed(2)}</td>
//             <td>${party.totalDebit.toFixed(2)}</td>
//             <td></td>
//           </tr>
//         </table>
//         </div>
//       `;
//     });

//     htmlContent += `
//         </body>
//       </html>
//     `;

//     // Launch Puppeteer and generate PDF
//     const browser = await puppeteer.launch({
//       executablePath: '/snap/bin/chromium',
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent);
    
//     const pdfBuffer = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: {
//         top: '20mm',
//         right: '20mm',
//         bottom: '20mm',
//         left: '20mm'
//       }
//     });

//     await browser.close();

//     // Set response headers for PDF download
//     res.set({
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': 'attachment; filename="statement.pdf"',
//       'Content-Length': pdfBuffer.length
//     });

//     // Send PDF buffer
//     res.status(200).send(pdfBuffer);

//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

import Account from '../model/Account.js';
import Party from '../model/Party.js';

// Create a new account
export const createAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark } = req.body;
    if (!partyname) {
      return res.status(400).json({ message: 'Party name is required' });
    }
    // Verify party exists and belongs to the authenticated user
    const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
    if (!party) {
      return res.status(404).json({ message: 'Party not found or you do not have access' });
    }
    const account = new Account({ partyname, credit, debit, remark, createdBy: req.user.id });
    await account.save();
    // Populate partyname in the response
    const populatedAccount = await Account.findById(account._id).populate('partyname', 'partyname');
    res.status(201).json({ message: 'Account created successfully', account: populatedAccount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all accounts for the authenticated user
export const getAllAccounts = async (req, res) => {
  try {
    const parties = await Party.find({ createdBy: req.user.id }).select('_id');
    const partyIds = parties.map(party => party._id);
    const accounts = await Account.find({ partyname: { $in: partyIds } }).populate('partyname', 'partyname');
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single account by ID
export const getAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id }).populate('partyname', 'partyname');
    if (!account) {
      return res.status(404).json({ message: 'Account not found or you do not have access' });
    }
    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an account
export const updateAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark } = req.body;
    if (partyname) {
      const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
      if (!party) {
        return res.status(404).json({ message: 'Party not found or you do not have access' });
      }
    }
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { partyname, credit, debit, remark },
      { new: true, runValidators: true }
    ).populate('partyname', 'partyname');
    if (!account) {
      return res.status(404).json({ message: 'Account not found or you do not have access' });
    }
    res.status(200).json({ message: 'Account updated successfully', account });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an account
export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or you do not have access' });
    }
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch account statement data
export const downloadStatement = async (req, res) => {
  try {
    const partyId = req.query.party;
    const query = { createdBy: req.user.id };
    if (partyId) {
      const party = await Party.findOne({ _id: partyId, createdBy: req.user.id });
      if (!party) {
        return res.status(404).json({ message: 'Party not found or you do not have access' });
      }
      query.partyname = partyId;
    }
    const accounts = await Account.find(query).populate('partyname', 'partyname').sort({ date: 1 });

    // Group accounts by party
    const grouped = {};
    accounts.forEach((acc) => {
      const pId = acc.partyname._id.toString();
      const pName = acc.partyname.partyname;
      if (!grouped[pId]) {
        grouped[pId] = { name: pName, accounts: [], totalCredit: 0, totalDebit: 0 };
      }
      grouped[pId].accounts.push({
        date: acc.date,
        credit: acc.credit,
        debit: acc.debit,
        remark: acc.remark || 'N/A'
      });
      grouped[pId].totalCredit += acc.credit;
      grouped[pId].totalDebit += acc.debit;
    });

    res.status(200).json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};