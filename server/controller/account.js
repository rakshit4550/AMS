import mongoose from "mongoose";
import Account from "../model/Account.js";
import Party from "../model/Party.js";
import nodemailer from "nodemailer";
import User from '../model/User.js';

// Define the nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "reider0009@gmail.com",
    pass: "haqnvddoeambjpul",
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter verification failed:", error);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

// Send statement email manually
export const sendStatementEmail = async (req, res) => {
  try {
    // Check for missing email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Server error', error: 'Email credentials are missing in environment variables' });
    }

    // Fetch user to get email
    const user = await User.findById(req.user.id).select('email');
    const toEmail = user?.email || process.env.FALLBACK_EMAIL;
    console.log("Sending email to:", toEmail); // Debug the recipient email
    if (!toEmail) {
      return res.status(400).json({ message: 'No recipient email available. Please ensure your account has an email address or set a fallback email in environment variables.' });
    }

    const parties = await Party.find({ createdBy: req.user.id });
    const partyIds = parties.map((p) => p._id);
    const accounts = await Account.find({ partyname: { $in: partyIds } }).populate('partyname', 'partyname');

    const grouped = {};
    accounts.forEach((acc) => {
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
      from: process.env.EMAIL_FROM || "AMS Admin <reider0009@gmail.com>",
      to: toEmail,
      subject: 'Account Statement JSON',
      text: 'Attached is your account data in JSON format.',
      attachments: [
        {
          filename: 'account_data.json',
          content: jsonData,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully', sentTo: toEmail });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new account
export const createAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark, date, to } = req.body;
    if (!partyname) {
      return res.status(400).json({ message: "Party name is required" });
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    // Verify party exists and belongs to the authenticated user
    const party = await Party.findOne({
      _id: partyname,
      createdBy: req.user.id,
    });
    if (!party) {
      return res
        .status(404)
        .json({ message: "Party not found or you do not have access" });
    }
    let toParty = null;
    if (to && typeof to === "string" && to.trim() !== "") {
      if (to === partyname) {
        return res
          .status(400)
          .json({ message: "To party cannot be the same as the main party" });
      }
      toParty = await Party.findOne({ _id: to, createdBy: req.user.id });
      if (!toParty) {
        return res
          .status(404)
          .json({ message: "To party not found or you do not have access" });
      }
    }
    let mainRemark = remark || "";
    let toRemarkVar = remark || "";
    if (toParty) {
      if (debit > 0 && credit === 0) {
        mainRemark = `${remark || ""} (Transfer to ${
          toParty.partyname
        })`.trim();
        toRemarkVar = `${remark || ""} (Transfer from ${
          party.partyname
        })`.trim();
      } else if (credit > 0 && debit === 0) {
        mainRemark = `${remark || ""} (Transfer from ${
          toParty.partyname
        })`.trim();
        toRemarkVar = `${remark || ""} (Transfer to ${party.partyname})`.trim();
      } else {
        mainRemark = `${remark || ""} (Transfer involving ${
          toParty.partyname
        })`.trim();
        toRemarkVar = `${remark || ""} (Transfer involving ${
          party.partyname
        })`.trim();
      }
    }

    // Create and save the main account
    const account = new Account({
      partyname,
      credit,
      debit,
      remark: mainRemark,
      date: new Date(date),
      createdBy: req.user.id,
      verified: false,
    });
    await account.save();

    let toAccount = null;
    if (toParty) {
      const toCredit = debit;
      const toDebit = credit;
      toAccount = new Account({
        partyname: to,
        credit: toCredit,
        debit: toDebit,
        remark: toRemarkVar,
        date: new Date(date),
        createdBy: req.user.id,
        verified: false,
      });
      try {
        await toAccount.save();
      } catch (error) {
        // Rollback: Delete the main account if toAccount save fails
        await Account.findByIdAndDelete(account._id);
        return res
          .status(500)
          .json({
            message: "Failed to save transfer account, transaction rolled back",
            error: error.message,
          });
      }
    }

    // Populate both accounts in the response
    const populatedAccount = await Account.findById(account._id).populate(
      "partyname",
      "partyname"
    );
    const populatedToAccount = toAccount
      ? await Account.findById(toAccount._id).populate("partyname", "partyname")
      : null;
    res.status(201).json({
      message: "Account created successfully",
      account: populatedAccount,
      toAccount: populatedToAccount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all accounts for the authenticated user
export const getAllAccounts = async (req, res) => {
  try {
    const parties = await Party.find({ createdBy: req.user.id }).select("_id");
    const partyIds = parties.map((party) => party._id);
    const accounts = await Account.find({ partyname: { $in: partyIds } })
      .populate("partyname", "partyname")
      .sort({ createdAt: -1 }); // Sort by createdAt descending
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single account by ID
export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }
    const account = await Account.findOne({
      _id: id,
      createdBy: req.user.id,
    }).populate("partyname", "partyname");
    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or you do not have access" });
    }
    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an account
export const updateAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark, date } = req.body;
    const account = await Account.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or you do not have access" });
    }
    if (account.verified) {
      return res
        .status(403)
        .json({ message: "Cannot update a verified account" });
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (partyname) {
      const party = await Party.findOne({
        _id: partyname,
        createdBy: req.user.id,
      });
      if (!party) {
        return res
          .status(404)
          .json({ message: "Party not found or you do not have access" });
      }
    }
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { partyname, credit, debit, remark, date: new Date(date) },
      { new: true, runValidators: true }
    ).populate("partyname", "partyname");
    res
      .status(200)
      .json({
        message: "Account updated successfully",
        account: updatedAccount,
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an account
export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or you do not have access" });
    }
    if (account.verified) {
      return res
        .status(403)
        .json({ message: "Cannot delete a verified account" });
    }
    await Account.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify an account
export const verifyAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or you do not have access" });
    }
    if (account.verified) {
      return res.status(400).json({ message: "Account is already verified" });
    }
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { verified: true },
      { new: true }
    ).populate("partyname", "partyname");
    res
      .status(200)
      .json({
        message: "Account verified successfully",
        account: updatedAccount,
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch account statement data
export const downloadStatement = async (req, res) => {
  try {
    const partyId = req.query.party;
    const query = { createdBy: req.user.id };
    if (partyId) {
      const party = await Party.findOne({
        _id: partyId,
        createdBy: req.user.id,
      });
      if (!party) {
        return res
          .status(404)
          .json({ message: "Party not found or you do not have access" });
      }
      query.partyname = partyId;
    }
    const accounts = await Account.find(query)
      .populate("partyname", "partyname")
      .sort({ createdAt: -1 }); // Sort by createdAt descending

    // Group accounts by party
    const grouped = {};
    accounts.forEach((acc) => {
      const pId = acc.partyname._id.toString();
      const pName = acc.partyname.partyname;
      if (!grouped[pId]) {
        grouped[pId] = {
          name: pName,
          accounts: [],
          totalCredit: 0,
          totalDebit: 0,
        };
      }
      grouped[pId].accounts.push({
        _id: acc._id,
        date: acc.date.toISOString(),
        credit: Number(acc.credit) || 0,
        debit: Number(acc.debit) || 0,
        remark: acc.remark || "",
        verified: acc.verified || false,
        createdAt: acc.createdAt.toISOString(),
      });
      grouped[pId].totalCredit += Number(acc.credit) || 0;
      grouped[pId].totalDebit += Number(acc.debit) || 0;
    });

    res.status(200).json(grouped);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Import accounts from JSON
export const importAccounts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const jsonData = JSON.parse(req.file.buffer.toString());

    for (let pId in jsonData) {
      const group = jsonData[pId];
      let party = await Party.findOne({
        partyname: group.name,
        createdBy: req.user.id,
      });
      if (!party) {
        party = new Party({ partyname: group.name, createdBy: req.user.id });
        await party.save();
      }

      for (let acc of group.accounts) {
        const newAcc = new Account({
          partyname: party._id,
          credit: acc.credit,
          debit: acc.debit,
          remark: acc.remark,
          date: new Date(acc.date),
          createdBy: req.user.id,
          verified: acc.verified,
        });
        await newAcc.save();
      }
    }

    res.status(200).json({ message: "Data imported successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};