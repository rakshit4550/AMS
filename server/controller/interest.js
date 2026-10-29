import mongoose from 'mongoose';
import Interest from '../model/Interest.js';
import Party from '../model/Party.js';

const MAX_MONTHS = 120;
const EDITABLE_FIELDS = ['party', 'amount', 'interestRate', 'interestType', 'months', 'date', 'schedule'];

const isValidId = (id) => {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return false;
  try {
    return String(new mongoose.Types.ObjectId(id)) === id;
  } catch {
    return false;
  }
};

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const roundRate = (value) => Math.round((value + Number.EPSILON) * 10000) / 10000;

const monthlyInterestOf = (amount, interestRate) => roundMoney((amount * interestRate) / 100);

const parseNumber = (value) => {
  if (typeof value === 'boolean' || value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const number = Number(value.trim());
    return Number.isFinite(number) ? number : null;
  }
  return null;
};

const parsePartyId = (value) => {
  if (!isValidId(value)) return { error: 'A valid party is required' };
  return { value };
};

const parseAmount = (value) => {
  const number = parseNumber(value);
  if (number === null || number <= 0) return { error: 'Amount must be greater than 0' };
  const amount = roundMoney(number);
  if (amount <= 0) return { error: 'Amount must be greater than 0' };
  if (amount > 1000000000000) return { error: 'Amount is too large' };
  return { value: amount };
};

const parseRate = (value) => {
  const number = parseNumber(value);
  if (number === null || number <= 0 || number > 100) {
    return { error: 'Interest rate must be greater than 0 and at most 100' };
  }
  const interestRate = roundRate(number);
  if (interestRate <= 0 || interestRate > 100) {
    return { error: 'Interest rate must be greater than 0 and at most 100' };
  }
  return { value: interestRate };
};

const parseType = (value) => {
  const interestType = String(value ?? '').trim().toLowerCase();
  if (interestType !== 'advance' && interestType !== 'simple') {
    return { error: 'Interest type must be advance or simple' };
  }
  return { value: interestType };
};

const parseMonths = (value) => {
  const number = parseNumber(value);
  if (number === null || !Number.isInteger(number) || number < 1 || number > MAX_MONTHS) {
    return { error: `Months must be a whole number from 1 to ${MAX_MONTHS}` };
  }
  return { value: number };
};

const parseDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

const formatDateOnly = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, count) => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + count);
  return next;
};

const monthStartFor = (start, index) => {
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + index;
  const day = start.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
};

const daysBetween = (start, end) => Math.round((end.getTime() - start.getTime()) / 86400000);

const buildInterestDays = (monthlyInterest, monthStart, dayCount, carriedInterest) => {
  let previousTotal = 0;

  return Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const totalInterest = roundMoney((monthlyInterest * day) / dayCount);
    const interest = roundMoney(totalInterest - previousTotal);
    previousTotal = totalInterest;
    return {
      day,
      date: formatDateOnly(addDays(monthStart, day - 1)),
      interest,
      totalInterest,
      accruedInterest: roundMoney(carriedInterest + totalInterest),
    };
  });
};

const parseBoolean = (value, label) => {
  if (typeof value !== 'boolean') return { error: `${label} must be true or false` };
  return { value };
};

const validateMoney = (amount, interestRate, interestType) => {
  const monthlyInterest = monthlyInterestOf(amount, interestRate);
  if (monthlyInterest <= 0) {
    return 'Interest for one month rounds to 0. Use a larger amount or rate';
  }
  if (interestType === 'advance' && monthlyInterest >= amount) {
    return 'Advance interest for one month must be less than the amount';
  }
  return null;
};

const validateScheduleRules = (schedule, interestType) => {
  const firstMonth = schedule.find((row) => row.month === 1);
  if (interestType === 'advance' && !firstMonth?.interestReceived) {
    return 'Advance interest for month 1 is already taken';
  }

  const returnedMonths = schedule.filter((row) => row.amountReturned);
  if (returnedMonths.length > 1) {
    return 'Amount can be marked returned on only one month';
  }

  if (returnedMonths.length === 1) {
    const returnedMonth = returnedMonths[0].month;
    const recordedAfterReturn = schedule.find(
      (row) => row.month > returnedMonth && (row.interestReceived || row.amountReturned),
    );
    if (recordedAfterReturn) {
      return 'Cannot record interest after the amount is returned';
    }
  }

  return null;
};

const buildDefaultSchedule = (months, interestType) => (
  Array.from({ length: months }, (_, index) => ({
    month: index + 1,
    interestReceived: interestType === 'advance' && index === 0,
    amountReturned: false,
  }))
);

const mergeSchedule = (previous, months, interestType) => {
  const previousByMonth = new Map(previous.map((row) => [row.month, row]));
  return Array.from({ length: months }, (_, index) => {
    const month = index + 1;
    const existing = previousByMonth.get(month);
    return {
      month,
      interestReceived: interestType === 'advance' && month === 1
        ? true
        : Boolean(existing?.interestReceived),
      amountReturned: Boolean(existing?.amountReturned),
    };
  });
};

const parseSchedule = (input, months, interestType) => {
  if (!Array.isArray(input)) return { error: 'Schedule must be a list of months' };
  if (input.length !== months) {
    return { error: `Schedule must include ${months} months` };
  }

  const rows = [];
  const seen = new Set();

  for (const item of input) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { error: 'Each schedule month must be an object' };
    }

    const month = parseNumber(item.month);
    if (month === null || !Number.isInteger(month) || month < 1 || month > months) {
      return { error: 'Schedule month is out of range' };
    }
    if (seen.has(month)) return { error: 'Schedule months must be unique' };
    seen.add(month);

    const interestReceived = parseBoolean(item.interestReceived, `Month ${month} interest received`);
    if (interestReceived.error) return interestReceived;
    const amountReturned = parseBoolean(item.amountReturned, `Month ${month} amount returned`);
    if (amountReturned.error) return amountReturned;

    rows.push({
      month,
      interestReceived: interestReceived.value,
      amountReturned: amountReturned.value,
    });
  }

  if (seen.size !== months) {
    return { error: `Schedule must include every month from 1 to ${months}` };
  }

  rows.sort((left, right) => left.month - right.month);
  const ruleError = validateScheduleRules(rows, interestType);
  if (ruleError) return { error: ruleError };
  return { value: rows };
};

const buildScheduleForSave = ({ months, interestType, schedule, previous }) => {
  if (schedule !== undefined) return parseSchedule(schedule, months, interestType);

  if (!previous) {
    const created = buildDefaultSchedule(months, interestType);
    const ruleError = validateScheduleRules(created, interestType);
    if (ruleError) return { error: ruleError };
    return { value: created };
  }

  const dropped = previous.filter(
    (row) => row.month > months && (row.interestReceived || row.amountReturned),
  );
  if (dropped.length) {
    const labels = dropped.map((row) => row.month).join(', ');
    return {
      error: `Month ${labels} already has a record. Send an updated schedule before shortening the term.`,
    };
  }

  const merged = mergeSchedule(previous, months, interestType);
  const ruleError = validateScheduleRules(merged, interestType);
  if (ruleError) return { error: ruleError };
  return { value: merged };
};

const idOf = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
};

const partyView = (party) => {
  if (!party || typeof party !== 'object') return null;
  return {
    _id: party._id,
    partyname: party.partyname || '',
  };
};

// Each interest month runs until the same date next month. February uses 28 or 29
// days, and a 31st starts on the last day of a shorter month. Daily interest is
// the monthly interest divided by that month's actual days, added up each day.
// Advance: 100000 at 1% is given as 99000. Month 1 interest is already taken.
// A later month collects 1000 interest, or 100000 when the principal comes back.
// Simple: 100000 at 1% for 3 months is 3000 interest, so 103000 is receivable.
export const presentInterest = (interest) => {
  const amount = interest.amount;
  const { months, interestType } = interest;
  const monthlyInterest = monthlyInterestOf(amount, interest.interestRate);
  const totalInterest = roundMoney(monthlyInterest * months);
  const interestTakenInAdvance = interestType === 'advance' ? monthlyInterest : 0;
  const disbursedAmount = interestType === 'advance'
    ? roundMoney(amount - monthlyInterest)
    : amount;
  const start = interest.date instanceof Date ? interest.date : new Date(interest.date);
  const returnedMonths = interest.schedule
    .filter((row) => row.amountReturned)
    .map((row) => row.month);
  const returnedOnMonth = returnedMonths.length ? Math.min(...returnedMonths) : null;

  const schedule = [...interest.schedule]
    .sort((left, right) => left.month - right.month)
    .map((row) => {
      const closed = returnedOnMonth != null && row.month > returnedOnMonth;
      const interestAlreadyTaken = interestType === 'advance' && row.month === 1;
      const monthStart = monthStartFor(start, row.month - 1);
      const dayCount = daysBetween(monthStart, monthStartFor(start, row.month));
      const carriedInterest = roundMoney(monthlyInterest * (row.month - 1));
      return {
        month: row.month,
        dueDate: formatDateOnly(monthStart),
        daysInMonth: dayCount,
        dailyInterest: closed ? 0 : roundMoney(monthlyInterest / dayCount),
        interestAmount: closed ? 0 : monthlyInterest,
        interestAlreadyTaken,
        interestToCollect: closed || interestAlreadyTaken ? 0 : monthlyInterest,
        principalIfReturned: closed ? 0 : amount,
        interestReceived: row.interestReceived,
        amountReturned: row.amountReturned,
        closed,
        days: closed ? [] : buildInterestDays(monthlyInterest, monthStart, dayCount, carriedInterest),
      };
    });

  return {
    _id: interest._id,
    party: partyView(interest.party),
    amount,
    interestRate: interest.interestRate,
    interestType,
    months,
    date: formatDateOnly(start),
    status: returnedOnMonth == null ? 'open' : 'closed',
    returnedOnMonth,
    calculation: {
      monthlyInterest,
      disbursedAmount,
      interestTakenInAdvance,
      totalInterest,
      totalReceivable: interestType === 'simple' ? roundMoney(amount + totalInterest) : null,
    },
    schedule,
    createdBy: interest.createdBy,
    createdAt: interest.createdAt,
    updatedAt: interest.updatedAt,
  };
};

const findOwnedParty = (partyId, userId) => Party.findOne({ _id: partyId, createdBy: userId }).select('_id');

const loadInterest = (id, userId) => Interest.findOne({ _id: id, createdBy: userId })
  .populate('party', 'partyname')
  .lean();

const sendServerError = (res, error, label) => {
  console.error(`${label} error:`, error);
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid interest details' });
  }
  return res.status(500).json({ message: 'Server error' });
};

const readInterestInput = (body, current) => {
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const next = {
    party: current?.party ? idOf(current.party) : undefined,
    amount: current?.amount,
    interestRate: current?.interestRate,
    interestType: current?.interestType,
    months: current?.months,
    date: current?.date,
  };

  if (!current || has('party')) {
    const party = parsePartyId(body.party);
    if (party.error) return party;
    next.party = party.value;
  }
  if (!current || has('amount')) {
    const amount = parseAmount(body.amount);
    if (amount.error) return amount;
    next.amount = amount.value;
  }
  if (!current || has('interestRate')) {
    const interestRate = parseRate(body.interestRate);
    if (interestRate.error) return interestRate;
    next.interestRate = interestRate.value;
  }
  if (!current || has('interestType')) {
    const interestType = parseType(body.interestType);
    if (interestType.error) return interestType;
    next.interestType = interestType.value;
  }
  if (!current || has('months')) {
    const months = parseMonths(body.months);
    if (months.error) return months;
    next.months = months.value;
  }
  if (!current || has('date')) {
    const date = parseDateOnly(body.date);
    if (!date) return { error: 'Date must be YYYY-MM-DD' };
    next.date = date;
  }

  const moneyError = validateMoney(next.amount, next.interestRate, next.interestType);
  if (moneyError) return { error: moneyError };

  const schedule = buildScheduleForSave({
    months: next.months,
    interestType: next.interestType,
    schedule: has('schedule') ? body.schedule : undefined,
    previous: current?.schedule,
  });
  if (schedule.error) return schedule;

  return { value: { ...next, schedule: schedule.value } };
};

export const createInterest = async (req, res) => {
  try {
    const body = req.body ?? {};
    const input = readInterestInput(body, null);
    if (input.error) return res.status(400).json({ message: input.error });

    const party = await findOwnedParty(input.value.party, req.user.id);
    if (!party) {
      return res.status(404).json({ message: 'Party not found or you do not have access' });
    }

    const created = await Interest.create({
      ...input.value,
      createdBy: req.user.id,
    });
    const interest = await Interest.findById(created._id).populate('party', 'partyname').lean();

    return res.status(201).json({
      message: 'Interest created successfully',
      interest: presentInterest(interest),
    });
  } catch (error) {
    return sendServerError(res, error, 'createInterest');
  }
};

export const getAllInterests = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = String(req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const skip = (page - 1) * limit;

    const sortByAllowedFields = ['date', 'amount', 'interestRate', 'createdAt', 'updatedAt'];
    const requestedSortBy = String(req.query.sortBy || 'date').trim();
    const sortBy = sortByAllowedFields.includes(requestedSortBy) ? requestedSortBy : 'date';
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;

    const query = { createdBy: userId };
    let partyFilter = '';
    let interestTypeFilter = '';

    if (req.query.interestType !== undefined && String(req.query.interestType).trim() !== '') {
      const interestType = parseType(req.query.interestType);
      if (interestType.error) return res.status(400).json({ message: interestType.error });
      interestTypeFilter = interestType.value;
      query.interestType = interestType.value;
    }

    if (req.query.party !== undefined && String(req.query.party).trim() !== '') {
      if (!isValidId(String(req.query.party))) {
        return res.status(400).json({ message: 'A valid party is required' });
      }
      partyFilter = String(req.query.party);
      query.party = partyFilter;
    }

    const status = String(req.query.status || '').trim().toLowerCase();
    if (status) {
      if (status !== 'open' && status !== 'closed') {
        return res.status(400).json({ message: 'Status must be open or closed' });
      }
      query.schedule = status === 'closed'
        ? { $elemMatch: { amountReturned: true } }
        : { $not: { $elemMatch: { amountReturned: true } } };
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parties = await Party.find({
        createdBy: userId,
        partyname: { $regex: escapedSearch, $options: 'i' },
      }).select('_id').lean();
      const partyIds = parties.map((party) => String(party._id));
      if (partyFilter && !partyIds.includes(partyFilter)) {
        query.party = { $in: [] };
      } else if (!partyFilter) {
        query.party = { $in: partyIds };
      }
    }

    const [interests, totalRecords] = await Promise.all([
      Interest.find(query)
        .sort({ [sortBy]: sortOrder, _id: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('party', 'partyname')
        .lean(),
      Interest.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 0;

    return res.status(200).json({
      success: true,
      interests: interests.map(presentInterest),
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search,
        party: partyFilter,
        interestType: interestTypeFilter,
        status,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      },
    });
  } catch (error) {
    return sendServerError(res, error, 'getAllInterests');
  }
};

export const getInterestById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interest id' });
    }

    const interest = await loadInterest(req.params.id, req.user.id);
    if (!interest) {
      return res.status(404).json({ message: 'Interest not found or you do not have access' });
    }

    return res.status(200).json(presentInterest(interest));
  } catch (error) {
    return sendServerError(res, error, 'getInterestById');
  }
};

export const updateInterest = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interest id' });
    }

    const body = req.body ?? {};
    if (!EDITABLE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const current = await Interest.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!current) {
      return res.status(404).json({ message: 'Interest not found or you do not have access' });
    }

    const input = readInterestInput(body, current);
    if (input.error) return res.status(400).json({ message: input.error });

    const party = await findOwnedParty(input.value.party, req.user.id);
    if (!party) {
      return res.status(404).json({ message: 'Party not found or you do not have access' });
    }

    current.party = input.value.party;
    current.amount = input.value.amount;
    current.interestRate = input.value.interestRate;
    current.interestType = input.value.interestType;
    current.months = input.value.months;
    current.date = input.value.date;
    current.schedule = input.value.schedule;
    current.markModified('schedule');
    await current.save();

    const interest = await Interest.findById(current._id).populate('party', 'partyname').lean();
    return res.status(200).json({
      message: 'Interest updated successfully',
      interest: presentInterest(interest),
    });
  } catch (error) {
    return sendServerError(res, error, 'updateInterest');
  }
};
