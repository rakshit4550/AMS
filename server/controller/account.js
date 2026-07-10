// import mongoose from "mongoose";
// import Account from "../model/Account.js";
// import Party from "../model/Party.js";
// import nodemailer from "nodemailer";
// import User from '../model/User.js';

// // Define the nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "flagcartshop@gmail.com",
//     pass: "dtngccwcvtivixmt",
//   },
// });

// // Verify transporter configuration
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("Transporter verification failed:", error);
//   } else {
//     console.log("Transporter is ready to send emails");
//   }
// });

// // Send statement email manually
// export const sendStatementEmail = async (req, res) => {
//   try {
//     // Check for missing email credentials
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Server error', error: 'Email credentials are missing in environment variables' });
//     }

//     // Fetch user to get email
//     const user = await User.findById(req.user.id).select('email');
//     const toEmail = user?.email || process.env.FALLBACK_EMAIL;
//     console.log("Sending email to:", toEmail); // Debug the recipient email
//     if (!toEmail) {
//       return res.status(400).json({ message: 'No recipient email available. Please ensure your account has an email address or set a fallback email in environment variables.' });
//     }

//     const parties = await Party.find({ createdBy: req.user.id });
//     const partyIds = parties.map((p) => p._id);
//     const accounts = await Account.find({ partyname: { $in: partyIds } }).populate('partyname', 'partyname');

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
//         createdAt: acc.createdAt.toISOString(),
//       });
//       grouped[pId].totalCredit += Number(acc.credit) || 0;
//       grouped[pId].totalDebit += Number(acc.debit) || 0;
//     });

//     const jsonData = JSON.stringify(grouped, null, 2);

//     const mailOptions = {
//       from: process.env.EMAIL_FROM || "AMS Admin <flagcartshop@gmail.com>",
//       to: toEmail,
//       subject: 'Account Statement JSON',
//       text: 'Attached is your account data in JSON format.',
//       attachments: [
//         {
//           filename: 'account_data.json',
//           content: jsonData,
//         },
//       ],
//     };

//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: 'Email sent successfully', sentTo: toEmail });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Create a new account
// export const createAccount = async (req, res) => {
//   try {
//     const { partyname, credit = 0, debit = 0, remark, date, to } = req.body;
//     if (!partyname) {
//       return res.status(400).json({ message: "Party name is required" });
//     }
//     if (!date) {
//       return res.status(400).json({ message: "Date is required" });
//     }
//     // Verify party exists and belongs to the authenticated user
//     const party = await Party.findOne({
//       _id: partyname,
//       createdBy: req.user.id,
//     });
//     if (!party) {
//       return res
//         .status(404)
//         .json({ message: "Party not found or you do not have access" });
//     }
//     let toParty = null;
//     if (to && typeof to === "string" && to.trim() !== "") {
//       if (to === partyname) {
//         return res
//           .status(400)
//           .json({ message: "To party cannot be the same as the main party" });
//       }
//       toParty = await Party.findOne({ _id: to, createdBy: req.user.id });
//       if (!toParty) {
//         return res
//           .status(404)
//           .json({ message: "To party not found or you do not have access" });
//       }
//     }
//     let mainRemark = remark || "";
//     let toRemarkVar = remark || "";
//     if (toParty) {
//       if (debit > 0 && credit === 0) {
//         mainRemark = `${remark || ""} (Transfer to ${
//           toParty.partyname
//         })`.trim();
//         toRemarkVar = `${remark || ""} (Transfer from ${
//           party.partyname
//         })`.trim();
//       } else if (credit > 0 && debit === 0) {
//         mainRemark = `${remark || ""} (Transfer from ${
//           toParty.partyname
//         })`.trim();
//         toRemarkVar = `${remark || ""} (Transfer to ${party.partyname})`.trim();
//       } else {
//         mainRemark = `${remark || ""} (Transfer involving ${
//           toParty.partyname
//         })`.trim();
//         toRemarkVar = `${remark || ""} (Transfer involving ${
//           party.partyname
//         })`.trim();
//       }
//     }

//     // Create and save the main account
//     const account = new Account({
//       partyname,
//       credit,
//       debit,
//       remark: mainRemark,
//       date: new Date(date),
//       createdBy: req.user.id,
//       verified: false,
//     });
//     await account.save();

//     let toAccount = null;
//     if (toParty) {
//       const toCredit = debit;
//       const toDebit = credit;
//       toAccount = new Account({
//         partyname: to,
//         credit: toCredit,
//         debit: toDebit,
//         remark: toRemarkVar,
//         date: new Date(date),
//         createdBy: req.user.id,
//         verified: false,
//       });
//       try {
//         await toAccount.save();
//       } catch (error) {
//         // Rollback: Delete the main account if toAccount save fails
//         await Account.findByIdAndDelete(account._id);
//         return res
//           .status(500)
//           .json({
//             message: "Failed to save transfer account, transaction rolled back",
//             error: error.message,
//           });
//       }
//     }

//     // Populate both accounts in the response
//     const populatedAccount = await Account.findById(account._id).populate(
//       "partyname",
//       "partyname"
//     );
//     const populatedToAccount = toAccount
//       ? await Account.findById(toAccount._id).populate("partyname", "partyname")
//       : null;
//     res.status(201).json({
//       message: "Account created successfully",
//       account: populatedAccount,
//       toAccount: populatedToAccount,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Get all accounts for the authenticated user
// export const getAllAccounts = async (req, res) => {
//   try {
//     const parties = await Party.find({ createdBy: req.user.id }).select("_id");
//     const partyIds = parties.map((party) => party._id);
//     const accounts = await Account.find({ partyname: { $in: partyIds } })
//       .populate("partyname", "partyname")
//       .sort({ createdAt: -1 }); // Sort by createdAt descending
//     res.status(200).json(accounts);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Get a single account by ID
// export const getAccountById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid account ID" });
//     }
//     const account = await Account.findOne({
//       _id: id,
//       createdBy: req.user.id,
//     }).populate("partyname", "partyname");
//     if (!account) {
//       return res
//         .status(404)
//         .json({ message: "Account not found or you do not have access" });
//     }
//     res.status(200).json(account);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Update an account
// export const updateAccount = async (req, res) => {
//   try {
//     const { partyname, credit = 0, debit = 0, remark, date } = req.body;
//     const account = await Account.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });
//     if (!account) {
//       return res
//         .status(404)
//         .json({ message: "Account not found or you do not have access" });
//     }

//     // NOTE: verified account ko bhi update allow kiya hai.
//     // Delete verified account abhi bhi blocked rahega.

//     if (!date) {
//       return res.status(400).json({ message: "Date is required" });
//     }
//     if (partyname) {
//       const party = await Party.findOne({
//         _id: partyname,
//         createdBy: req.user.id,
//       });
//       if (!party) {
//         return res
//           .status(404)
//           .json({ message: "Party not found or you do not have access" });
//       }
//     }
//     const updatedAccount = await Account.findOneAndUpdate(
//       { _id: req.params.id, createdBy: req.user.id },
//       { partyname, credit, debit, remark, date: new Date(date) },
//       { new: true, runValidators: true }
//     ).populate("partyname", "partyname");
//     res
//       .status(200)
//       .json({
//         message: "Account updated successfully",
//         account: updatedAccount,
//       });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Delete an account
// export const deleteAccount = async (req, res) => {
//   try {
//     const account = await Account.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });
//     if (!account) {
//       return res
//         .status(404)
//         .json({ message: "Account not found or you do not have access" });
//     }
//     if (account.verified) {
//       return res
//         .status(403)
//         .json({ message: "Cannot delete a verified account" });
//     }
//     await Account.findOneAndDelete({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });
//     res.status(200).json({ message: "Account deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Verify an account
// export const verifyAccount = async (req, res) => {
//   try {
//     const account = await Account.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });
//     if (!account) {
//       return res
//         .status(404)
//         .json({ message: "Account not found or you do not have access" });
//     }
//     if (account.verified) {
//       return res.status(400).json({ message: "Account is already verified" });
//     }
//     const updatedAccount = await Account.findOneAndUpdate(
//       { _id: req.params.id, createdBy: req.user.id },
//       { verified: true },
//       { new: true }
//     ).populate("partyname", "partyname");
//     res
//       .status(200)
//       .json({
//         message: "Account verified successfully",
//         account: updatedAccount,
//       });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Fetch account statement data
// export const downloadStatement = async (req, res) => {
//   try {
//     const partyId = req.query.party;
//     const query = { createdBy: req.user.id };
//     if (partyId) {
//       const party = await Party.findOne({
//         _id: partyId,
//         createdBy: req.user.id,
//       });
//       if (!party) {
//         return res
//           .status(404)
//           .json({ message: "Party not found or you do not have access" });
//       }
//       query.partyname = partyId;
//     }
//     const accounts = await Account.find(query)
//       .populate("partyname", "partyname")
//       .sort({ createdAt: -1 }); // Sort by createdAt descending

//     // Group accounts by party
//     const grouped = {};
//     accounts.forEach((acc) => {
//       const pId = acc.partyname._id.toString();
//       const pName = acc.partyname.partyname;
//       if (!grouped[pId]) {
//         grouped[pId] = {
//           name: pName,
//           accounts: [],
//           totalCredit: 0,
//           totalDebit: 0,
//         };
//       }
//       grouped[pId].accounts.push({
//         _id: acc._id,
//         date: acc.date.toISOString(),
//         credit: Number(acc.credit) || 0,
//         debit: Number(acc.debit) || 0,
//         remark: acc.remark || "",
//         verified: acc.verified || false,
//         createdAt: acc.createdAt.toISOString(),
//       });
//       grouped[pId].totalCredit += Number(acc.credit) || 0;
//       grouped[pId].totalDebit += Number(acc.debit) || 0;
//     });

//     res.status(200).json(grouped);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Import accounts from JSON
// export const importAccounts = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }
//     const jsonData = JSON.parse(req.file.buffer.toString());

//     for (let pId in jsonData) {
//       const group = jsonData[pId];
//       let party = await Party.findOne({
//         partyname: group.name,
//         createdBy: req.user.id,
//       });
//       if (!party) {
//         party = new Party({ partyname: group.name, createdBy: req.user.id });
//         await party.save();
//       }

//       for (let acc of group.accounts) {
//         const newAcc = new Account({
//           partyname: party._id,
//           credit: acc.credit,
//           debit: acc.debit,
//           remark: acc.remark,
//           date: new Date(acc.date),
//           createdBy: req.user.id,
//           verified: acc.verified,
//         });
//         await newAcc.save();
//       }
//     }

//     res.status(200).json({ message: "Data imported successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Account from "../model/Account.js";
import Party from "../model/Party.js";
import User from "../model/User.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "flagcartshop@gmail.com",
    pass: "dtngccwcvtivixmt",
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Transporter verification failed:", error);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

export const sendStatementEmail = async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        message: "Server error",
        error: "Email credentials are missing in environment variables",
      });
    }

    const user = await User.findById(req.user.id).select("email");
    const toEmail = user?.email || process.env.FALLBACK_EMAIL;

    if (!toEmail) {
      return res.status(400).json({
        message:
          "No recipient email available. Please ensure your account has an email address or set a fallback email in environment variables.",
      });
    }

    const parties = await Party.find({ createdBy: req.user.id }).select("_id");
    const partyIds = parties.map((party) => party._id);

    const accounts = await Account.find({
      createdBy: req.user.id,
      partyname: { $in: partyIds },
    }).populate("partyname", "partyname");

    const grouped = {};

    accounts.forEach((acc) => {
      if (!acc.partyname) return;

      const partyId = acc.partyname._id.toString();
      const partyName = acc.partyname.partyname;

      if (!grouped[partyId]) {
        grouped[partyId] = {
          name: partyName,
          accounts: [],
          totalCredit: 0,
          totalDebit: 0,
        };
      }

      grouped[partyId].accounts.push({
        _id: acc._id,
        date: acc.date.toISOString(),
        credit: Number(acc.credit) || 0,
        debit: Number(acc.debit) || 0,
        remark: acc.remark || "",
        verified: Boolean(acc.verified),
        createdAt: acc.createdAt.toISOString(),
      });

      grouped[partyId].totalCredit += Number(acc.credit) || 0;
      grouped[partyId].totalDebit += Number(acc.debit) || 0;
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AMS Admin',
      to: toEmail,
      subject: "Account Statement JSON",
      text: "Attached is your account data in JSON format.",
      attachments: [
        {
          filename: "account_data.json",
          content: JSON.stringify(grouped, null, 2),
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Email sent successfully",
      sentTo: toEmail,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark, date, to } = req.body;

    if (!partyname) {
      return res.status(400).json({ message: "Party name is required" });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const party = await Party.findOne({
      _id: partyname,
      createdBy: req.user.id,
    });

    if (!party) {
      return res.status(404).json({
        message: "Party not found or you do not have access",
      });
    }

    let toParty = null;

    if (to && typeof to === "string" && to.trim() !== "") {
      if (to === partyname) {
        return res.status(400).json({
          message: "To party cannot be the same as the main party",
        });
      }

      toParty = await Party.findOne({
        _id: to,
        createdBy: req.user.id,
      });

      if (!toParty) {
        return res.status(404).json({
          message: "To party not found or you do not have access",
        });
      }
    }

    let mainRemark = remark || "";
    let toRemark = remark || "";

    if (toParty) {
      if (Number(debit) > 0 && Number(credit) === 0) {
        mainRemark = `${remark || ""} (Transfer to ${toParty.partyname})`.trim();
        toRemark = `${remark || ""} (Transfer from ${party.partyname})`.trim();
      } else if (Number(credit) > 0 && Number(debit) === 0) {
        mainRemark = `${remark || ""} (Transfer from ${toParty.partyname})`.trim();
        toRemark = `${remark || ""} (Transfer to ${party.partyname})`.trim();
      } else {
        mainRemark = `${remark || ""} (Transfer involving ${toParty.partyname})`.trim();
        toRemark = `${remark || ""} (Transfer involving ${party.partyname})`.trim();
      }
    }

    const account = await Account.create({
      partyname,
      credit,
      debit,
      remark: mainRemark,
      date: new Date(date),
      createdBy: req.user.id,
      verified: false,
    });

    let toAccount = null;

    if (toParty) {
      try {
        toAccount = await Account.create({
          partyname: to,
          credit: debit,
          debit: credit,
          remark: toRemark,
          date: new Date(date),
          createdBy: req.user.id,
          verified: false,
        });
      } catch (error) {
        await Account.findByIdAndDelete(account._id);
        return res.status(500).json({
          message: "Failed to save transfer account, transaction rolled back",
          error: error.message,
        });
      }
    }

    const populatedAccount = await Account.findById(account._id).populate(
      "partyname",
      "partyname",
    );

    const populatedToAccount = toAccount
      ? await Account.findById(toAccount._id).populate("partyname", "partyname")
      : null;

    return res.status(201).json({
      message: "Account created successfully",
      account: populatedAccount,
      toAccount: populatedToAccount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /accounts?party=<partyId>
// When party is provided, only that selected party's ledger is returned.
// Get accounts with party filter, pagination, search and date filters
export const getAllAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const partyId = String(req.query.party || "").trim();
    const search = String(req.query.search || "").trim();

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const skip = (page - 1) * limit;

    const fromDate = String(req.query.fromDate || "").trim();
    const toDate = String(req.query.toDate || "").trim();

    const sortByAllowedFields = [
      "createdAt",
      "updatedAt",
      "date",
      "credit",
      "debit",
      "remark",
    ];

    const requestedSortBy = String(
      req.query.sortBy || "createdAt"
    ).trim();

    const sortBy = sortByAllowedFields.includes(requestedSortBy)
      ? requestedSortBy
      : "createdAt";

    const sortOrder =
      String(req.query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;

    const query = {
      createdBy: userId,
    };

    /*
     * Party filter
     * Party select hone par sirf usi party ke accounts aayenge.
     */
    if (partyId) {
      if (!mongoose.Types.ObjectId.isValid(partyId)) {
        return res.status(400).json({
          message: "Invalid party ID",
        });
      }

      const party = await Party.findOne({
        _id: partyId,
        createdBy: userId,
      })
        .select("_id")
        .lean();

      if (!party) {
        return res.status(404).json({
          message: "Party not found or you do not have access",
        });
      }

      query.partyname = party._id;
    } else {
      /*
       * Party select nahi hai to bhi user ke hi accounts access honge.
       * Account model me createdBy available hone ke karan sab Party IDs
       * fetch karne ki zarurat nahi hai.
       */
      query.createdBy = userId;
    }

    /*
     * Date filter
     */
    if (fromDate || toDate) {
      query.date = {};

      if (fromDate) {
        const parsedFromDate = new Date(`${fromDate}T00:00:00.000Z`);

        if (Number.isNaN(parsedFromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid fromDate. Use YYYY-MM-DD format",
          });
        }

        query.date.$gte = parsedFromDate;
      }

      if (toDate) {
        const parsedToDate = new Date(`${toDate}T23:59:59.999Z`);

        if (Number.isNaN(parsedToDate.getTime())) {
          return res.status(400).json({
            message: "Invalid toDate. Use YYYY-MM-DD format",
          });
        }

        query.date.$lte = parsedToDate;
      }
    }

    const transactionType = String(req.query.transactionType || "").trim();
    const verificationStatus = String(
      req.query.verificationStatus || "",
    ).trim();

    if (transactionType === "debit") {
      query.debit = { $gt: 0 };
    } else if (transactionType === "credit") {
      query.credit = { $gt: 0 };
    }

    if (verificationStatus === "verified") {
      query.verified = true;
    } else if (verificationStatus === "unverified") {
      query.verified = false;
    }

    /*
     * Search filter
     * Search supports:
     * - Remark
     * - Exact credit/debit amount
     * - Party name
     */
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const matchingParties = await Party.find({
        createdBy: userId,
        partyname: {
          $regex: escapedSearch,
          $options: "i",
        },
      })
        .select("_id")
        .lean();

      const matchingPartyIds = matchingParties.map((party) => party._id);

      const searchConditions = [
        {
          remark: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];

      if (matchingPartyIds.length > 0) {
        searchConditions.push({
          partyname: {
            $in: matchingPartyIds,
          },
        });
      }

      const numericSearch = Number(search.replace(/,/g, ""));

      if (
        search.replace(/,/g, "").trim() !== "" &&
        Number.isFinite(numericSearch)
      ) {
        searchConditions.push(
          { credit: numericSearch },
          { debit: numericSearch }
        );
      }

      query.$or = searchConditions;
    }

    /*
     * Total count and paginated records parallel me fetch honge.
     */
    const sortSpec = { [sortBy]: sortOrder, _id: sortOrder };

    const fetchTasks = [
      Account.find(query)
        .populate("partyname", "partyname")
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean(),
      Account.countDocuments(query),
    ];

    if (partyId) {
      fetchTasks.push(
        Account.find(query)
          .select("debit credit createdAt _id")
          .sort(sortSpec)
          .lean(),
      );
    }

    const fetchResults = await Promise.all(fetchTasks);
    let accounts = fetchResults[0];
    const totalRecords = fetchResults[1];

    let partySummary = null;
    if (partyId) {
      const balanceRows = fetchResults[2] || [];
      const balanceById = {};
      let suffixSum = 0;
      for (let i = balanceRows.length - 1; i >= 0; i -= 1) {
        const row = balanceRows[i];
        suffixSum += (Number(row.debit) || 0) - (Number(row.credit) || 0);
        balanceById[String(row._id)] = suffixSum;
      }
      accounts = accounts.map((acc) => ({
        ...acc,
        runningBalance: balanceById[String(acc._id)] ?? 0,
      }));

      // Same as old client-side: sum ALL party ledger rows (not just current page)
      const totalDebit = balanceRows.reduce(
        (sum, row) => sum + (Number(row.debit) || 0),
        0,
      );
      const totalCredit = balanceRows.reduce(
        (sum, row) => sum + (Number(row.credit) || 0),
        0,
      );
      partySummary = {
        totalDebit,
        totalCredit,
        closingBalance: totalDebit - totalCredit,
        partyName:
          accounts[0]?.partyname?.partyname ||
          (await Party.findById(partyId).select("partyname").lean())
            ?.partyname ||
          "",
      };
    }

    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      accounts,
      partySummary,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        party: partyId || null,
        search: search || "",
        fromDate: fromDate || null,
        toDate: toDate || null,
        transactionType: transactionType || null,
        verificationStatus: verificationStatus || null,
        sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    console.error("getAllAccounts error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const account = await Account.findOne({
      _id: id,
      createdBy: req.user.id,
    }).populate("partyname", "partyname");

    if (!account) {
      return res.status(404).json({
        message: "Account not found or you do not have access",
      });
    }

    return res.status(200).json(account);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { partyname, credit = 0, debit = 0, remark, date } = req.body;

    const account = await Account.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found or you do not have access",
      });
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
        return res.status(404).json({
          message: "Party not found or you do not have access",
        });
      }
    }

    const updatedAccount = await Account.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      {
        partyname,
        credit,
        debit,
        remark,
        date: new Date(date),
      },
      { new: true, runValidators: true },
    ).populate("partyname", "partyname");

    return res.status(200).json({
      message: "Account updated successfully",
      account: updatedAccount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found or you do not have access",
      });
    }

    if (account.verified) {
      return res.status(403).json({
        message: "Cannot delete a verified account",
      });
    }

    await Account.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found or you do not have access",
      });
    }

    if (account.verified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    const updatedAccount = await Account.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { verified: true },
      { new: true },
    ).populate("partyname", "partyname");

    return res.status(200).json({
      message: "Account verified successfully",
      account: updatedAccount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const downloadStatement = async (req, res) => {
  try {
    const partyId = String(req.query.party || "").trim();
    const query = { createdBy: req.user.id };

    if (partyId) {
      if (!mongoose.Types.ObjectId.isValid(partyId)) {
        return res.status(400).json({ message: "Invalid party ID" });
      }

      const party = await Party.findOne({
        _id: partyId,
        createdBy: req.user.id,
      });

      if (!party) {
        return res.status(404).json({
          message: "Party not found or you do not have access",
        });
      }

      query.partyname = partyId;
    }

    const accounts = await Account.find(query)
      .populate("partyname", "partyname")
      .sort({ createdAt: -1 });

    const grouped = {};

    accounts.forEach((acc) => {
      if (!acc.partyname) return;

      const partyKey = acc.partyname._id.toString();

      if (!grouped[partyKey]) {
        grouped[partyKey] = {
          name: acc.partyname.partyname,
          accounts: [],
          totalCredit: 0,
          totalDebit: 0,
        };
      }

      grouped[partyKey].accounts.push({
        _id: acc._id,
        date: acc.date.toISOString(),
        credit: Number(acc.credit) || 0,
        debit: Number(acc.debit) || 0,
        remark: acc.remark || "",
        verified: Boolean(acc.verified),
        createdAt: acc.createdAt.toISOString(),
      });

      grouped[partyKey].totalCredit += Number(acc.credit) || 0;
      grouped[partyKey].totalDebit += Number(acc.debit) || 0;
    });

    return res.status(200).json(grouped);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const importAccounts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const jsonData = JSON.parse(req.file.buffer.toString());

    for (const partyId of Object.keys(jsonData)) {
      const group = jsonData[partyId];

      let party = await Party.findOne({
        partyname: group.name,
        createdBy: req.user.id,
      });

      if (!party) {
        party = await Party.create({
          partyname: group.name,
          createdBy: req.user.id,
        });
      }

      for (const acc of group.accounts || []) {
        await Account.create({
          partyname: party._id,
          credit: acc.credit,
          debit: acc.debit,
          remark: acc.remark,
          date: new Date(acc.date),
          createdBy: req.user.id,
          verified: acc.verified,
        });
      }
    }

    return res.status(200).json({ message: "Data imported successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};