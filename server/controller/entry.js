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

const parseStack = (value) => {
  if (typeof value === 'boolean' || value === null || value === undefined) {
    return { error: 'Stack is required' };
  }
  const raw = typeof value === 'number' ? String(value) : normalizeText(value);
  if (!raw) return { error: 'Stack is required' };
  if (!/^\d+(\.\d+)?$/.test(raw)) return { error: 'Stack must be a number' };

  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) {
    return { error: 'Stack must be greater than 0' };
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
  const team = parseTeam(body.team, event);
  const stack = parseStack(body.stack);
  const selection = parseSelection(body.selection, market.booktype);

  if (team.error) return { error: team.error };
  if (stack.error) return { error: stack.error };
  if (selection.error) return { error: selection.error };

  return {
    value: {
      team: team.team,
      teamname: team.teamname,
      stack: stack.value,
      selection: selection.value,
    },
  };
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
    .select('_id booktype event')
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

    return res.status(201).json({
      message: 'Entry created successfully',
      entry,
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

    const sortByAllowedFields = ['teamname', 'stack', 'selection', 'createdAt', 'updatedAt'];
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
        or.push({ stack: numericSearch });
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

    return res.status(200).json({
      success: true,
      entries,
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

    return res.status(200).json(entry);
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

    const entry = await Entry.findOneAndUpdate(
      {
        _id: req.params.id,
        event: owned.event._id,
        market: owned.market._id,
        createdBy: req.user.id,
      },
      { $set: parsed.value },
      { new: true, runValidators: true }
    ).lean();

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found or you do not have access' });
    }

    return res.status(200).json({
      message: 'Entry updated successfully',
      entry,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
