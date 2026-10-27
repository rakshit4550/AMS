import mongoose from 'mongoose';
import SettlementParty from '../model/SettlementParty.js';
import SettlementUsername from '../model/SettlementUsername.js';
import SettlementEntry from '../model/SettlementEntry.js';

const isValidId = (id) => {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return false;
  try {
    return String(new mongoose.Types.ObjectId(id)) === id;
  } catch {
    return false;
  }
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const emptyBucket = () => ({
  amount: 0,
  percentageAmount: 0,
  totalAmount: 0,
});

const parseAmount = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return { error: 'Amount is required' };
  }
  if (typeof value === 'boolean') {
    return { error: 'Amount must be a number' };
  }

  const number = typeof value === 'string' ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(number)) {
    return { error: 'Amount must be a number' };
  }

  const rounded = roundMoney(number);
  if (rounded <= 0) {
    return { error: 'Amount must be greater than 0' };
  }
  return { value: rounded };
};

const parseTransactionType = (value) => {
  const transactionType = String(value ?? '').trim().toLowerCase();
  if (transactionType !== 'deposit' && transactionType !== 'withdrawal') {
    return { error: 'Transaction type must be deposit or withdrawal' };
  }
  return { value: transactionType };
};

const resolvePercentage = (party, username) => {
  const usernameHasPercentage = username.partnershipPercentage !== null
    && username.partnershipPercentage !== undefined;

  if (usernameHasPercentage) {
    return {
      partnershipPercentage: username.partnershipPercentage,
      percentageSource: 'username',
    };
  }

  if (party.partnershipPercentage === null || party.partnershipPercentage === undefined) {
    return { error: 'Settlement party partnership percentage is required' };
  }

  return {
    partnershipPercentage: party.partnershipPercentage,
    percentageSource: 'party',
  };
};

const calculateEntry = (amount, partnershipPercentage) => {
  const percentageAmount = roundMoney((amount * partnershipPercentage) / 100);
  return {
    percentageAmount,
    totalAmount: roundMoney(amount + percentageAmount),
  };
};

const toEntryResponse = (entry) => ({
  _id: entry._id,
  amount: entry.amount,
  transactionType: entry.transactionType,
  partnershipPercentage: entry.partnershipPercentage,
  percentageSource: entry.percentageSource,
  percentageAmount: entry.percentageAmount,
  totalAmount: entry.totalAmount,
  settlementParty: entry.settlementParty,
  settlementUsername: entry.settlementUsername,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

const findOwnedContext = async (partyId, usernameId, userId) => {
  const party = await SettlementParty.findOne({
    _id: partyId,
    createdBy: userId,
  }).lean();

  if (!party) {
    return { error: { status: 404, message: 'Settlement party not found or you do not have access' } };
  }

  const username = await SettlementUsername.findOne({
    _id: usernameId,
    settlementParty: party._id,
    createdBy: userId,
  }).lean();

  if (!username) {
    return { error: { status: 404, message: 'Username not found' } };
  }

  return { party, username };
};

const buildSummary = async (partyId, usernameId, userId) => {
  const groups = await SettlementEntry.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        settlementParty: new mongoose.Types.ObjectId(partyId),
        settlementUsername: new mongoose.Types.ObjectId(usernameId),
      },
    },
    {
      $group: {
        _id: '$transactionType',
        amount: { $sum: '$amount' },
        percentageAmount: { $sum: '$percentageAmount' },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ]);

  const deposit = emptyBucket();
  const withdrawal = emptyBucket();

  groups.forEach((group) => {
    const bucket = group._id === 'deposit'
      ? deposit
      : group._id === 'withdrawal'
        ? withdrawal
        : null;
    if (!bucket) return;
    bucket.amount = roundMoney(group.amount);
    bucket.percentageAmount = roundMoney(group.percentageAmount);
    bucket.totalAmount = roundMoney(group.totalAmount);
  });

  return {
    deposit,
    withdrawal,
    closingBalance: roundMoney(deposit.totalAmount - withdrawal.totalAmount),
  };
};

export const createSettlementEntry = async (req, res) => {
  try {
    if (!isValidId(req.params.partyId) || !isValidId(req.params.usernameId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const amount = parseAmount(req.body.amount);
    if (amount.error) {
      return res.status(400).json({ message: amount.error });
    }

    const transactionType = parseTransactionType(req.body.transactionType);
    if (transactionType.error) {
      return res.status(400).json({ message: transactionType.error });
    }

    const context = await findOwnedContext(req.params.partyId, req.params.usernameId, req.user.id);
    if (context.error) {
      return res.status(context.error.status).json({ message: context.error.message });
    }

    const percentage = resolvePercentage(context.party, context.username);
    if (percentage.error) {
      return res.status(400).json({ message: percentage.error });
    }

    const totals = calculateEntry(amount.value, percentage.partnershipPercentage);
    const entry = await SettlementEntry.create({
      settlementParty: context.party._id,
      settlementUsername: context.username._id,
      amount: amount.value,
      transactionType: transactionType.value,
      partnershipPercentage: percentage.partnershipPercentage,
      percentageSource: percentage.percentageSource,
      percentageAmount: totals.percentageAmount,
      totalAmount: totals.totalAmount,
      createdBy: req.user.id,
    });

    const summary = await buildSummary(context.party._id, context.username._id, req.user.id);

    res.status(201).json({
      message: 'Settlement entry added successfully',
      entry: toEntryResponse(entry),
      summary,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSettlementEntries = async (req, res) => {
  try {
    if (!isValidId(req.params.partyId) || !isValidId(req.params.usernameId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const context = await findOwnedContext(req.params.partyId, req.params.usernameId, req.user.id);
    if (context.error) {
      return res.status(context.error.status).json({ message: context.error.message });
    }

    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const allowedLimits = [10, 20, 50];
    const limit = allowedLimits.includes(parsedLimit) ? parsedLimit : 10;
    const skip = (page - 1) * limit;

    const query = {
      createdBy: req.user.id,
      settlementParty: context.party._id,
      settlementUsername: context.username._id,
    };

    const [entries, totalRecords, summary] = await Promise.all([
      SettlementEntry.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SettlementEntry.countDocuments(query),
      buildSummary(context.party._id, context.username._id, req.user.id),
    ]);

    const percentage = resolvePercentage(context.party, context.username);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      party: {
        _id: context.party._id,
        partyname: context.party.partyname,
        partnershipPercentage: context.party.partnershipPercentage,
      },
      username: {
        _id: context.username._id,
        username: context.username.username,
        partnershipPercentage: context.username.partnershipPercentage ?? null,
      },
      appliedPercentage: percentage.error
        ? null
        : {
          partnershipPercentage: percentage.partnershipPercentage,
          percentageSource: percentage.percentageSource,
        },
      entries: entries.map(toEntryResponse),
      summary,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const todayInIst = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const isRealDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year
    && utc.getUTCMonth() === month - 1
    && utc.getUTCDate() === day;
};

const istStart = (value) => new Date(`${value}T00:00:00.000+05:30`);
const istEnd = (value) => new Date(`${value}T23:59:59.999+05:30`);

const parseSettlementDateRange = (query) => {
  const rawFrom = String(query.fromDate || '').trim();
  const rawTo = String(query.toDate || '').trim();
  const fromDate = rawFrom || (rawTo ? '' : todayInIst());
  const toDate = rawTo || (rawFrom ? '' : todayInIst());

  if (fromDate && !isRealDate(fromDate)) {
    return { error: 'Invalid fromDate. Use YYYY-MM-DD format' };
  }
  if (toDate && !isRealDate(toDate)) {
    return { error: 'Invalid toDate. Use YYYY-MM-DD format' };
  }
  if (fromDate && toDate && fromDate > toDate) {
    return { error: 'fromDate cannot be after toDate' };
  }

  const createdAt = {};
  if (fromDate) createdAt.$gte = istStart(fromDate);
  if (toDate) createdAt.$lte = istEnd(toDate);

  return { fromDate: fromDate || null, toDate: toDate || null, createdAt };
};

const summaryFromEntries = (entries) => {
  const deposit = emptyBucket();
  const withdrawal = emptyBucket();

  entries.forEach((entry) => {
    const bucket = entry.transactionType === 'deposit'
      ? deposit
      : entry.transactionType === 'withdrawal'
        ? withdrawal
        : null;
    if (!bucket) return;
    bucket.amount += entry.amount;
    bucket.percentageAmount += entry.percentageAmount;
    bucket.totalAmount += entry.totalAmount;
  });

  const roundedDeposit = {
    amount: roundMoney(deposit.amount),
    percentageAmount: roundMoney(deposit.percentageAmount),
    totalAmount: roundMoney(deposit.totalAmount),
  };
  const roundedWithdrawal = {
    amount: roundMoney(withdrawal.amount),
    percentageAmount: roundMoney(withdrawal.percentageAmount),
    totalAmount: roundMoney(withdrawal.totalAmount),
  };

  return {
    deposit: roundedDeposit,
    withdrawal: roundedWithdrawal,
    closingBalance: roundMoney(roundedDeposit.totalAmount - roundedWithdrawal.totalAmount),
  };
};

const toPartyEntry = (entry) => ({
  _id: entry._id,
  transactionType: entry.transactionType,
  amount: entry.amount,
  partnershipPercentage: entry.partnershipPercentage,
  percentageSource: entry.percentageSource,
  percentageAmount: entry.percentageAmount,
  totalAmount: entry.totalAmount,
  createdAt: entry.createdAt,
});

const addBuckets = (left, right) => ({
  amount: roundMoney(left.amount + right.amount),
  percentageAmount: roundMoney(left.percentageAmount + right.percentageAmount),
  totalAmount: roundMoney(left.totalAmount + right.totalAmount),
});

export const getPartySettlement = async (req, res) => {
  try {
    if (!isValidId(req.params.partyId)) {
      return res.status(400).json({ message: 'Invalid settlement party id' });
    }

    const range = parseSettlementDateRange(req.query);
    if (range.error) {
      return res.status(400).json({ message: range.error });
    }

    const party = await SettlementParty.findOne({
      _id: req.params.partyId,
      createdBy: req.user.id,
    }).lean();

    if (!party) {
      return res.status(404).json({ message: 'Settlement party not found or you do not have access' });
    }

    const usernames = await SettlementUsername.find({
      settlementParty: party._id,
      createdBy: req.user.id,
    })
      .sort({ username: 1, _id: 1 })
      .select('username partnershipPercentage')
      .lean();

    const entries = await SettlementEntry.find({
      createdBy: req.user.id,
      settlementParty: party._id,
      createdAt: range.createdAt,
    })
      .sort({ createdAt: 1, _id: 1 })
      .select('amount transactionType partnershipPercentage percentageSource percentageAmount totalAmount settlementUsername createdAt')
      .lean();

    const entriesByUsername = new Map();
    entries.forEach((entry) => {
      const key = entry.settlementUsername.toString();
      const list = entriesByUsername.get(key) || [];
      list.push(toPartyEntry(entry));
      entriesByUsername.set(key, list);
    });

    const rows = usernames.flatMap((username) => {
      const usernameEntries = entriesByUsername.get(username._id.toString()) || [];
      if (!usernameEntries.length) return [];
      return [{
        _id: username._id,
        username: username.username,
        partnershipPercentage: username.partnershipPercentage ?? null,
        entries: usernameEntries,
        summary: summaryFromEntries(usernameEntries),
      }];
    });

    const partySummary = rows.reduce((total, row) => {
      const deposit = addBuckets(total.deposit, row.summary.deposit);
      const withdrawal = addBuckets(total.withdrawal, row.summary.withdrawal);
      return {
        deposit,
        withdrawal,
        closingBalance: roundMoney(deposit.totalAmount - withdrawal.totalAmount),
      };
    }, {
      deposit: emptyBucket(),
      withdrawal: emptyBucket(),
      closingBalance: 0,
    });

    res.status(200).json({
      success: true,
      party: {
        _id: party._id,
        partyname: party.partyname,
        contactNo: party.contactNo || '',
        partnershipPercentage: party.partnershipPercentage,
      },
      filters: {
        fromDate: range.fromDate,
        toDate: range.toDate,
      },
      usernames: rows,
      summary: partySummary,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
