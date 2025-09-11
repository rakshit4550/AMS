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
    res.status(201).json({ message: 'Account created successfully', account });
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
    const accounts = await Account.find().populate('partyname', 'partyname');
    const doc = new PDFDocument();
    const stream = new Readable({
      read() {}
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=account_statement.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Account Statement', { align: 'center' });
    doc.moveDown();

    accounts.forEach((account, index) => {
      doc.fontSize(12).text(`Entry ${index + 1}:`);
      doc.text(`Party: ${account.partyname.partyname}`);
      doc.text(`Credit: ${account.credit}`);
      doc.text(`Debit: ${account.debit}`);
      doc.text(`Remark: ${account.remark || 'N/A'}`);
      doc.text(`Date: ${new Date(account.date).toLocaleDateString()}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};