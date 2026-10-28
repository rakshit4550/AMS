import mongoose from 'mongoose';
import Event from '../model/Event.js';
import Market from '../model/Market.js';
import Entry from '../model/Entry.js';

const SELECTION_BY_BOOK_TYPE = {
  Bookmaker: ['Back', 'Lay'],
  Fancy: ['Yes', 'No'],
};

const isValidId = (id) => {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return false;
  try {
    return String(new mongoose.Types.ObjectId(id)) === id;
  } catch {
    return false;
  }
};

const normalizeText = (value) => String(value ?? '').trim();

const parseTeam = (value, event) => {
  const raw = normalizeText(value).toLowerCase();
  if (raw === 'team1' || raw === 'team 1' || raw === '1') {
    return { team: 'team1', teamname: event.team1 };
  }
  if (raw === 'team2' || raw === 'team 2' || raw === '2') {
    return { team: 'team2', teamname: event.team2 };
  }
  if (raw && raw === event.team1.toLowerCase()) {
    return { team: 'team1', teamname: event.team1 };
  }
  if (raw && raw === event.team2.toLowerCase()) {
    return { team: 'team2', teamname: event.team2 };
  }
  return { error: 'Select team 1 or team 2' };
};

const parsePositiveNumber = (value, label) => {
  if (typeof value === 'boolean' || value === null || value === undefined) {
    return { error: `${label} is required` };
  }
  const raw = typeof value === 'number' ? String(value) : normalizeText(value);
  if (!raw) return { error: `${label} is required` };
  if (!/^\d+(\.\d+)?$/.test(raw)) return { error: `${label} must be a number` };

  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) {
    return { error: `${label} must be greater than 0` };
  }
  return { value: number };
};

const parseSelection = (value, booktype) => {
  const allowed = SELECTION_BY_BOOK_TYPE[booktype] || [];
  const raw = normalizeText(value);
  const match = allowed.find((item) => item.toLowerCase() === raw.toLowerCase());
  if (!match) {
    return {
      error: booktype === 'Fancy'
        ? 'Fancy market must be Yes or No'
        : 'Bookmaker market must be Back or Lay',
    };
  }
  return { value: match };
};

const readEntryBody = (body, event, market) => {
  const stack = parsePositiveNumber(body.stack, 'Stack');
  const rate = parsePositiveNumber(body.rate, 'Rate');
  const selection = parseSelection(body.selection, market.booktype);

  if (stack.error) return { error: stack.error };
  if (rate.error) return { error: rate.error };
  if (selection.error) return { error: selection.error };

  const value = {
    stack: stack.value,
    rate: rate.value,
    selection: selection.value,
  };

  if (market.booktype === 'Fancy') {
    const run = parsePositiveNumber(body.run, 'Run');
    if (run.error) return { error: run.error };
    value.run = run.value;
    value.teamname = market.marketname;
    return { value };
  }

  const team = parseTeam(body.team, event);
  if (team.error) return { error: team.error };
  value.team = team.team;
  value.teamname = team.teamname;
  return { value };
};

const formatCreatedAt = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { createdDate: '', createdTime: '' };
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';

  return {
    createdDate: `${part('day')}/${part('month')}/${part('year')}`,
    createdTime: `${part('hour')}:${part('minute')}:${part('second')} ${part('dayPeriod').toLowerCase()}`,
  };
};

const fancyEntryAmount = (entry, run) => {
  if (entry.selection !== 'Yes' && entry.selection !== 'No') return null;

  const entryRun = Number(entry.run);
  const stack = Number(entry.stack);
  const rate = Number(entry.rate);
  if (!Number.isFinite(entryRun) || !Number.isFinite(stack) || stack <= 0) return null;

  const price = Number.isFinite(rate) && rate > 0 ? rate : 100;
  const rateAmount = (stack * price) / 100;
  const onOrAbove = run >= entryRun;

  if (entry.selection === 'Yes') return onOrAbove ? rateAmount : -stack;
  return onOrAbove ? -rateAmount : stack;
};

const presentEntry = (entry, market) => {
  const source = typeof entry?.toObject === 'function' ? entry.toObject() : entry;
  const rest = { ...source };
  delete rest.book;
  if (market?.booktype === 'Fancy') {
    delete rest.team;
    if (market.marketname) rest.teamname = market.marketname;
  }
  return {
    ...rest,
    ...formatCreatedAt(source.createdAt),
  };
};

const marketBook = (market, entries) => {
  const valid = entries.filter((entry) => fancyEntryAmount(entry, 0) !== null);
  if (!valid.length) return [];

  const runs = new Set();
  valid.forEach((entry) => {
    const run = Number(entry.run);
    runs.add(roundMoney(run - 1));
    runs.add(roundMoney(run));
    runs.add(roundMoney(run + 1));
  });

  const lines = [...runs]
    .sort((left, right) => left - right)
    .map((run) => ({
      run,
      amount: roundMoney(valid.reduce((sum, entry) => sum + fancyEntryAmount(entry, run), 0)),
    }));

  return [{ teamname: market.marketname, lines }];
};

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const bookmakerPosition = (event, entries) => {
  let team1Amount = 0;
  let team2Amount = 0;

  entries.forEach((entry) => {
    const stack = Number(entry.stack) || 0;
    const rate = Number(entry.rate) || 0;
    const onTeam1 = entry.team === 'team1';

    if (entry.selection === 'Back') {
      if (onTeam1) {
        team1Amount += rate;
        team2Amount -= stack;
      } else {
        team2Amount += rate;
        team1Amount -= stack;
      }
      return;
    }

    if (entry.selection === 'Lay') {
      if (onTeam1) {
        team1Amount -= rate;
        team2Amount += stack;
      } else {
        team2Amount -= rate;
        team1Amount += stack;
      }
    }
  });

  return {
    team1: { name: event.team1, amount: roundMoney(team1Amount) },
    team2: { name: event.team2, amount: roundMoney(team2Amount) },
  };
};

const clearFancyTeam = (owned, userId) => Entry.updateMany(
  {
    createdBy: userId,
    event: owned.event._id,
    market: owned.market._id,
    selection: { $in: ['Yes', 'No'] },
    team: { $exists: true },
  },
  { $unset: { team: '' } }
);

const loadBook = async (owned, userId) => {
  if (owned.market.booktype !== 'Fancy') return null;

  await clearFancyTeam(owned, userId);

  const rows = await Entry.find({
    createdBy: userId,
    event: owned.event._id,
    market: owned.market._id,
  })
    .select('selection run stack rate')
    .lean();

  return marketBook(owned.market, rows);
};

const loadPosition = async (owned, userId) => {
  if (owned.market.booktype !== 'Bookmaker') return null;

  const rows = await Entry.find({
    createdBy: userId,
    event: owned.event._id,
    market: owned.market._id,
  })
    .select('team stack rate selection')
    .lean();

  return bookmakerPosition(owned.event, rows);
};

const findOwnedMarket = async (eventId, marketId, userId) => {
  if (!isValidId(eventId)) return { error: 'Invalid event id', status: 400 };
  if (!isValidId(marketId)) return { error: 'Invalid market id', status: 400 };

  const event = await Event.findOne({ _id: eventId, createdBy: userId })
    .select('_id team1 team2')
    .lean();
  if (!event) return { error: 'Event not found or you do not have access', status: 404 };

  const market = await Market.findOne({
    _id: marketId,
    event: event._id,
    createdBy: userId,
  })
    .select('_id booktype marketname event')
    .lean();
  if (!market) return { error: 'Market not found or you do not have access', status: 404 };

  return { event, market };
};

export const createEntry = async (req, res) => {
  try {
    const owned = await findOwnedMarket(req.params.eventId, req.params.marketId, req.user.id);
    if (owned.error) {
      return res.status(owned.status).json({ message: owned.error });
    }

    const parsed = readEntryBody(req.body, owned.event, owned.market);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const entry = await Entry.create({
      ...parsed.value,
      event: owned.event._id,
      market: owned.market._id,
      createdBy: req.user.id,
    });

    const position = await loadPosition(owned, req.user.id);

    return res.status(201).json({
      message: 'Entry created successfully',
      entry: presentEntry(entry, owned.market),
      position,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getEntriesByMarket = async (req, res) => {
  try {
    const owned = await findOwnedMarket(req.params.eventId, req.params.marketId, req.user.id);
    if (owned.error) {
      return res.status(owned.status).json({ message: owned.error });
    }

    const search = normalizeText(req.query.search);
    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 10, 1), 50);
    const skip = (page - 1) * limit;

    const sortByAllowedFields = ['teamname', 'stack', 'rate', 'run', 'selection', 'createdAt', 'updatedAt'];
    const requestedSortBy = normalizeText(req.query.sortBy || 'createdAt');
    const sortBy = sortByAllowedFields.includes(requestedSortBy) ? requestedSortBy : 'createdAt';
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;

    const query = {
      createdBy: req.user.id,
      event: owned.event._id,
      market: owned.market._id,
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escapedSearch, $options: 'i' };
      const or = [
        { teamname: searchRegex },
        { selection: searchRegex },
      ];
      const numericSearch = Number(search.replace(/,/g, ''));
      if (search.replace(/,/g, '').trim() !== '' && Number.isFinite(numericSearch)) {
        or.push({ stack: numericSearch }, { rate: numericSearch }, { run: numericSearch });
      }
      query.$or = or;
    }

    const [entries, totalRecords] = await Promise.all([
      Entry.find(query)
        .sort({ [sortBy]: sortOrder, _id: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Entry.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);
    const position = await loadPosition(owned, req.user.id);
    const book = await loadBook(owned, req.user.id);

    return res.status(200).json({
      success: true,
      entries: entries.map((entry) => presentEntry(entry, owned.market)),
      position,
      book,
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
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getEntryById = async (req, res) => {
  try {
    if (!isValidId(req.params.eventId) || !isValidId(req.params.marketId) || !isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid entry id' });
    }

    const entry = await Entry.findOne({
      _id: req.params.id,
      event: req.params.eventId,
      market: req.params.marketId,
      createdBy: req.user.id,
    }).lean();

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found or you do not have access' });
    }

    const market = await Market.findOne({
      _id: req.params.marketId,
      event: req.params.eventId,
      createdBy: req.user.id,
    })
      .select('booktype marketname')
      .lean();

    return res.status(200).json(presentEntry(entry, market));
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMarketBook = async (req, res) => {
  try {
    const marketId = req.params.marketId || req.params.id;
    const owned = await findOwnedMarket(req.params.eventId, marketId, req.user.id);
    if (owned.error) {
      return res.status(owned.status).json({ message: owned.error });
    }

    if (owned.market.booktype !== 'Fancy') {
      return res.status(400).json({ message: 'Book is only available for a Fancy market' });
    }

    const book = await loadBook(owned, req.user.id);
    return res.status(200).json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateEntry = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid entry id' });
    }

    const owned = await findOwnedMarket(req.params.eventId, req.params.marketId, req.user.id);
    if (owned.error) {
      return res.status(owned.status).json({ message: owned.error });
    }

    const parsed = readEntryBody(req.body, owned.event, owned.market);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const update = { $set: parsed.value };
    if (owned.market.booktype === 'Fancy') update.$unset = { team: '' };
    else update.$unset = { run: '' };

    const entry = await Entry.findOneAndUpdate(
      {
        _id: req.params.id,
        event: owned.event._id,
        market: owned.market._id,
        createdBy: req.user.id,
      },
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found or you do not have access' });
    }

    const position = await loadPosition(owned, req.user.id);

    return res.status(200).json({
      message: 'Entry updated successfully',
      entry: presentEntry(entry, owned.market),
      position,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
