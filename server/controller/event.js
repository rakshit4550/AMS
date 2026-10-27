import mongoose from 'mongoose';
import Event from '../model/Event.js';

const isValidId = (id) => {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return false;
  try {
    return String(new mongoose.Types.ObjectId(id)) === id;
  } catch {
    return false;
  }
};

const normalizeText = (value) => String(value ?? '').trim();

const parseDate = (value) => {
  const raw = normalizeText(value);
  if (!raw) return { error: 'Date is required' };

  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return { error: 'Invalid date. Use DD/MM/YYYY format' };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { error: 'Invalid date. Use DD/MM/YYYY format' };
  }

  return { value: parsed };
};

const formatDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const presentEvent = (event) => ({
  ...event,
  date: formatDate(event.date),
});

const readEventBody = (body) => {
  const eventname = normalizeText(body.eventname);
  const team1 = normalizeText(body.team1);
  const team2 = normalizeText(body.team2);
  const date = parseDate(body.date);

  if (!eventname) return { error: 'Event name is required' };
  if (date.error) return { error: date.error };
  if (!team1) return { error: 'Team 1 is required' };
  if (!team2) return { error: 'Team 2 is required' };

  return {
    value: {
      eventname,
      date: date.value,
      team1,
      team2,
    },
  };
};

export const createEvent = async (req, res) => {
  try {
    const parsed = readEventBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const event = await Event.create({
      ...parsed.value,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: 'Event created successfully',
      event: presentEvent(event.toObject()),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = normalizeText(req.query.search);
    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 10, 1), 50);
    const skip = (page - 1) * limit;

    const sortByAllowedFields = ['eventname', 'date', 'team1', 'team2', 'createdAt', 'updatedAt'];
    const requestedSortBy = normalizeText(req.query.sortBy || 'date');
    const sortBy = sortByAllowedFields.includes(requestedSortBy) ? requestedSortBy : 'date';
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;

    const query = { createdBy: userId };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escapedSearch, $options: 'i' };
      query.$or = [
        { eventname: searchRegex },
        { team1: searchRegex },
        { team2: searchRegex },
      ];
    }

    const [events, totalRecords] = await Promise.all([
      Event.find(query)
        .sort({ [sortBy]: sortOrder, _id: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      events: events.map(presentEvent),
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

export const getEventById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).lean();

    if (!event) {
      return res.status(404).json({ message: 'Event not found or you do not have access' });
    }

    return res.status(200).json(presentEvent(event));
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const parsed = readEventBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      parsed.value,
      { new: true, runValidators: true }
    ).lean();

    if (!event) {
      return res.status(404).json({ message: 'Event not found or you do not have access' });
    }

    return res.status(200).json({
      message: 'Event updated successfully',
      event: presentEvent(event),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
