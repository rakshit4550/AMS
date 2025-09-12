// import Account from '../model/Account.js';
// import Party from '../model/Party.js';
// import PDFDocument from 'pdfkit';
// import { Readable } from 'stream';

// // Create a new account
// export const createAccount = async (req, res) => {
//   try {
//     const { partyname, credit = 0, debit = 0, remark } = req.body;
//     if (!partyname) {
//       return res.status(400).json({ message: 'Party name is required' });
//     }
//     // Verify party exists
//     const party = await Party.findById(partyname);
//     if (!party) {
//       return res.status(404).json({ message: 'Party not found' });
//     }
//     const account = new Account({ partyname, credit, debit, remark });
//     await account.save();
//     res.status(201).json({ message: 'Account created successfully', account });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get all accounts
// export const getAllAccounts = async (req, res) => {
//   try {
//     const accounts = await Account.find().populate('partyname', 'partyname');
//     res.status(200).json(accounts);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get a single account by ID
// export const getAccountById = async (req, res) => {
//   try {
//     const account = await Account.findById(req.params.id).populate('partyname', 'partyname');
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found' });
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
//       const party = await Party.findById(partyname);
//       if (!party) {
//         return res.status(404).json({ message: 'Party not found' });
//       }
//     }
//     const account = await Account.findByIdAndUpdate(
//       req.params.id,
//       { partyname, credit, debit, remark },
//       { new: true, runValidators: true }
//     ).populate('partyname', 'partyname');
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found' });
//     }
//     res.status(200).json({ message: 'Account updated successfully', account });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Delete an account
// export const deleteAccount = async (req, res) => {
//   try {
//     const account = await Account.findByIdAndDelete(req.params.id);
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found' });
//     }
//     res.status(200).json({ message: 'Account deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Download account statement as PDF
// export const downloadStatement = async (req, res) => {
//   try {
//     const partyId = req.query.party;
//     if (partyId) {
//       const party = await Party.findById(partyId);
//       if (!party) {
//         return res.status(404).json({ message: 'Party not found' });
//       }
//     }
//     const query = partyId ? { partyname: partyId } : {};
//     const accounts = await Account.find(query).populate('partyname', 'partyname').sort({ date: 1 });

//     // Group accounts by party
//     const grouped = {};
//     accounts.forEach((acc) => {
//       const pId = acc.partyname._id.toString();
//       const pName = acc.partyname.partyname;
//       if (!grouped[pId]) {
//         grouped[pId] = { name: pName, accounts: [], totalCredit: 0, totalDebit: 0 };
//       }
//       grouped[pId].accounts.push(acc);
//       grouped[pId].totalCredit += acc.credit;
//       grouped[pId].totalDebit += acc.debit;
//     });

//     const doc = new PDFDocument();
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename=account_statement.pdf');
//     doc.pipe(res);

//     doc.fontSize(20).text('Account Statement', { align: 'center' });
//     doc.moveDown();

//     Object.keys(grouped).forEach((pId) => {
//       const group = grouped[pId];
//       doc.fontSize(16).text(`Party: ${group.name}`);
//       doc.moveDown();

//       // Table setup
//       const columnPositions = [50, 200, 300, 400];
//       const rowHeight = 20;
//       const tableTop = doc.y;
//       let currentY = tableTop;

//       // Draw headers
//       doc.fontSize(12)
//         .text('Date', columnPositions[0], currentY)
//         .text('Credit', columnPositions[1], currentY)
//         .text('Debit', columnPositions[2], currentY)
//         .text('Remark', columnPositions[3], currentY);

//       // Draw header underline
//       doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke();

//       currentY += rowHeight;

//       // Draw rows
//       group.accounts.forEach((acc) => {
//         doc.text(new Date(acc.date).toLocaleDateString(), columnPositions[0], currentY)
//           .text(acc.credit.toString(), columnPositions[1], currentY)
//           .text(acc.debit.toString(), columnPositions[2], currentY)
//           .text(acc.remark || 'N/A', columnPositions[3], currentY);
//         // Draw row underline
//         doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).dash(1, { space: 1 }).stroke();
//         currentY += rowHeight;
//       });

//       // Draw totals
//       doc.font('Helvetica-Bold')
//         .text('Total', columnPositions[0], currentY)
//         .text(group.totalCredit.toString(), columnPositions[1], currentY)
//         .text(group.totalDebit.toString(), columnPositions[2], currentY);
//       const balance = group.totalCredit - group.totalDebit;
//       doc.text(`Balance: ${balance} (${balance > 0 ? 'Lena Hai' : balance < 0 ? 'Dena Hai' : 'Zero'})`, columnPositions[3], currentY);

//       // Draw bottom line
//       doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke();

//       doc.font('Helvetica'); // Reset font
//       doc.moveDown(2);
//     });

//     doc.end();
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

import Account from '../model/Account.js';
import Party from '../model/Party.js';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

// Create a new account
export const createAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark } = req.body;
    if (!partyname) {
      return res.status(400).json({ message: 'Party name is required' });
    }
    // Verify party exists
    const party = await Party.findById(partyname);
    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }
    const account = new Account({ partyname, credit, debit, remark });
    await account.save();
    // Populate partyname in the response
    const populatedAccount = await Account.findById(account._id).populate('partyname', 'partyname');
    res.status(201).json({ message: 'Account created successfully', account: populatedAccount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all accounts
export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().populate('partyname', 'partyname');
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single account by ID
export const getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).populate('partyname', 'partyname');
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
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
      const party = await Party.findById(partyname);
      if (!party) {
        return res.status(404).json({ message: 'Party not found' });
      }
    }
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { partyname, credit, debit, remark },
      { new: true, runValidators: true }
    ).populate('partyname', 'partyname');
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.status(200).json({ message: 'Account updated successfully', account });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an account
export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Download account statement as PDF
export const downloadStatement = async (req, res) => {
  try {
    const partyId = req.query.party;
    if (partyId) {
      const party = await Party.findById(partyId);
      if (!party) {
        return res.status(404).json({ message: 'Party not found' });
      }
    }
    const query = partyId ? { partyname: partyId } : {};
    const accounts = await Account.find(query).populate('partyname', 'partyname').sort({ date: 1 });

    // Group accounts by party
    const grouped = {};
    accounts.forEach((acc) => {
      const pId = acc.partyname._id.toString();
      const pName = acc.partyname.partyname;
      if (!grouped[pId]) {
        grouped[pId] = { name: pName, accounts: [], totalCredit: 0, totalDebit: 0 };
      }
      grouped[pId].accounts.push(acc);
      grouped[pId].totalCredit += acc.credit;
      grouped[pId].totalDebit += acc.debit;
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=account_statement.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Account Statement', { align: 'center' });
    doc.moveDown();

    Object.keys(grouped).forEach((pId) => {
      const group = grouped[pId];
      doc.fontSize(16).text(`Party: ${group.name}`);
      doc.moveDown();

      // Table setup
      const columnPositions = [50, 200, 300, 400];
      const rowHeight = 20;
      const tableTop = doc.y;
      let currentY = tableTop;

      // Draw headers
      doc.fontSize(12)
        .text('Date', columnPositions[0], currentY)
        .text('Credit', columnPositions[1], currentY)
        .text('Debit', columnPositions[2], currentY)
        .text('Remark', columnPositions[3], currentY);

      // Draw header underline
      doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke();

      currentY += rowHeight;

      // Draw rows
      group.accounts.forEach((acc) => {
        const date = new Date(acc.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        doc.text(formattedDate, columnPositions[0], currentY)
          .text(acc.credit.toString(), columnPositions[1], currentY)
          .text(acc.debit.toString(), columnPositions[2], currentY)
          .text(acc.remark || 'N/A', columnPositions[3], currentY);
        // Draw row underline
        doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).dash(1, { space: 1 }).stroke();
        currentY += rowHeight;
      });

      // Draw totals
      doc.font('Helvetica-Bold')
        .text('Total', columnPositions[0], currentY)
        .text(group.totalCredit.toString(), columnPositions[1], currentY)
        .text(group.totalDebit.toString(), columnPositions[2], currentY);
      const balance = group.totalCredit - group.totalDebit;
      doc.text(`Balance: ${balance} (${balance > 0 ? 'Lena Hai' : balance < 0 ? 'Dena Hai' : 'Zero'})`, columnPositions[3], currentY);

      // Draw bottom line
      doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke();

      doc.font('Helvetica'); // Reset font
      doc.moveDown(2);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};