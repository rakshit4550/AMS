// import Account from '../model/Account.js';
// import Party from '../model/Party.js';

// // Create a new account
// export const createAccount = async (req, res) => {
//   try {
//     const { partyname, credit = 0, debit = 0, remark, date } = req.body;
//     if (!partyname) {
//       return res.status(400).json({ message: 'Party name is required' });
//     }
//     if (!date) {
//       return res.status(400).json({ message: 'Date is required' });
//     }
//     // Verify party exists and belongs to the authenticated user
//     const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
//     if (!party) {
//       return res.status(404).json({ message: 'Party not found or you do not have access' });
//     }
//     const account = new Account({ 
//       partyname, 
//       credit, 
//       debit, 
//       remark, 
//       date: new Date(date).toISOString(), 
//       createdBy: req.user.id, 
//       verified: false 
//     });
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
//     const accounts = await Account.find({ partyname: { $in: partyIds } })
//       .populate('partyname', 'partyname')
//       .sort({ createdAt: -1 }); // Sort by createdAt descending
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
//     const { partyname, credit = 0, debit = 0, remark, date } = req.body;
//     const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id });
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found or you do not have access' });
//     }
//     if (account.verified) {
//       return res.status(403).json({ message: 'Cannot update a verified account' });
//     }
//     if (!date) {
//       return res.status(400).json({ message: 'Date is required' });
//     }
//     if (partyname) {
//       const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
//       if (!party) {
//         return res.status(404).json({ message: 'Party not found or you do not have access' });
//       }
//     }
//     const updatedAccount = await Account.findOneAndUpdate(
//       { _id: req.params.id, createdBy: req.user.id },
//       { partyname, credit, debit, remark, date: new Date(date).toISOString() },
//       { new: true, runValidators: true }
//     ).populate('partyname', 'partyname');
//     res.status(200).json({ message: 'Account updated successfully', account: updatedAccount });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Delete an account
// export const deleteAccount = async (req, res) => {
//   try {
//     const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id });
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found or you do not have access' });
//     }
//     if (account.verified) {
//       return res.status(403).json({ message: 'Cannot delete a verified account' });
//     }
//     await Account.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
//     res.status(200).json({ message: 'Account deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Verify an account
// export const verifyAccount = async (req, res) => {
//   try {
//     const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id });
//     if (!account) {
//       return res.status(404).json({ message: 'Account not found or you do not have access' });
//     }
//     if (account.verified) {
//       return res.status(400).json({ message: 'Account is already verified' });
//     }
//     const updatedAccount = await Account.findOneAndUpdate(
//       { _id: req.params.id, createdBy: req.user.id },
//       { verified: true },
//       { new: true }
//     ).populate('partyname', 'partyname');
//     res.status(200).json({ message: 'Account verified successfully', account: updatedAccount });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Fetch account statement data
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
//     const accounts = await Account.find(query)
//       .populate('partyname', 'partyname')
//       .sort({ createdAt: -1 }); // Sort by createdAt descending

//     // Group accounts by party
//     const grouped = {};
//     accounts.forEach((acc) => {
//       const pId = acc.partyname._id.toString();
//       const pName = acc.partyname.partyname;
//       if (!grouped[pId]) {
//         grouped[pId] = { name: pName, accounts: [], totalCredit: 0, totalDebit: 0 };
//       }
//       grouped[pId].accounts.push({
//         _id: acc._id,
//         date: acc.date.toISOString(),
//         credit: Number(acc.credit) || 0,
//         debit: Number(acc.debit) || 0,
//         remark: acc.remark || '',
//         verified: acc.verified || false,
//         createdAt: acc.createdAt.toISOString() // Include createdAt
//       });
//       grouped[pId].totalCredit += Number(acc.credit) || 0;
//       grouped[pId].totalDebit += Number(acc.debit) || 0;
//     });

//     res.status(200).json(grouped);
//   } catch (error) {
//     console.error('Backend error in downloadStatement:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };



import Account from '../model/Account.js';
import Party from '../model/Party.js';

// Create a new account
export const createAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark, date, to } = req.body;
    if (!partyname) {
      return res.status(400).json({ message: 'Party name is required' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    // Verify party exists and belongs to the authenticated user
    const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
    if (!party) {
      return res.status(404).json({ message: 'Party not found or you do not have access' });
    }
    let toParty = null;
    if (to) {
      if (to === partyname) {
        return res.status(400).json({ message: 'To party cannot be the same as the main party' });
      }
      toParty = await Party.findOne({ _id: to, createdBy: req.user.id });
      if (!toParty) {
        return res.status(404).json({ message: 'To party not found or you do not have access' });
      }
    }
    const mainRemark = toParty ? `${remark || ''} (Transfer to ${toParty.partyname})`.trim() : remark;
    const account = new Account({ 
      partyname, 
      credit, 
      debit, 
      remark: mainRemark, 
      date: new Date(date), 
      createdBy: req.user.id, 
      verified: false 
    });
    await account.save();
    if (toParty) {
      const toCredit = debit;
      const toDebit = credit;
      const toRemark = `${remark || ''} (Transfer from ${party.partyname})`.trim();
      const toAccount = new Account({
        partyname: to,
        credit: toCredit,
        debit: toDebit,
        remark: toRemark,
        date: new Date(date),
        createdBy: req.user.id,
        verified: false
      });
      await toAccount.save();
    }
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
    const accounts = await Account.find({ partyname: { $in: partyIds } })
      .populate('partyname', 'partyname')
      .sort({ createdAt: -1 }); // Sort by createdAt descending
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
    const { partyname, credit = 0, debit = 0, remark, date } = req.body;
    const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or you do not have access' });
    }
    if (account.verified) {
      return res.status(403).json({ message: 'Cannot update a verified account' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    if (partyname) {
      const party = await Party.findOne({ _id: partyname, createdBy: req.user.id });
      if (!party) {
        return res.status(404).json({ message: 'Party not found or you do not have access' });
      }
    }
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { partyname, credit, debit, remark, date: new Date(date) },
      { new: true, runValidators: true }
    ).populate('partyname', 'partyname');
    res.status(200).json({ message: 'Account updated successfully', account: updatedAccount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an account
export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or you do not have access' });
    }
    if (account.verified) {
      return res.status(403).json({ message: 'Cannot delete a verified account' });
    }
    await Account.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify an account
export const verifyAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found or you do not have access' });
    }
    if (account.verified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { verified: true },
      { new: true }
    ).populate('partyname', 'partyname');
    res.status(200).json({ message: 'Account verified successfully', account: updatedAccount });
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
    const accounts = await Account.find(query)
      .populate('partyname', 'partyname')
      .sort({ createdAt: -1 }); // Sort by createdAt descending

    // Group accounts by party
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
        createdAt: acc.createdAt.toISOString() // Include createdAt
      });
      grouped[pId].totalCredit += Number(acc.credit) || 0;
      grouped[pId].totalDebit += Number(acc.debit) || 0;
    });

    res.status(200).json(grouped);
  } catch (error) {
    console.error('Backend error in downloadStatement:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};