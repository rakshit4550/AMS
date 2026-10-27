import mongoose from 'mongoose';
import Event from '../model/Event.js';
import Market from '../model/Market.js';

const BOOK_TYPES = ['Bookmaker', 'Fancy'];

const isValidId = (id) => {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return false;
  try {
    return String(new mongoose.Types.ObjectId(id)) === id;
  } catch {
    return false;
  }
};

const normalizeText = (value) => String(value ?? '').trim();

const parseBookType = (value) => {
  const raw = normalizeText(value);
  const match = BOOK_TYPES.find((item) => item.toLowerCase() === raw.toLowerCase());
  if (!match) return { error: 'Book type must be Bookmaker or Fancy' };
  return { value: match };
};

const readMarketBody = (body) => {
  const booktype = parseBookType(body.booktype);
  const marketname = normalizeText(body.marketname);

  if (booktype.error) return { error: booktype.error };
  if (!marketname) return { error: 'Market name is required' };

  return {
    value: {
      booktype: booktype.value,
      marketname,
    },
  };
};

const findOwnedEvent = async (eventId, userId) => {
  if (!isValidId(eventId)) return { error: 'Invalid event id', status: 400 };
  const event = await Event.findOne({ _id: eventId, createdBy: userId }).select('_id').lean();
  if (!event) return { error: 'Event not found or you do not have access', status: 404 };
  return { event };
};

export const createMarket = async (req, res) => {
  try {
    const owned = await findOwnedEvent(req.params.eventId, req.user.id);
    if (owned.error) {
      return res.status(owned.status).json({ message: owned.error });
    }
    const { event } = owned;

    const parsed = readMarketBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const market = await Market.create({
      ...parsed.value,
      event: event._id,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: 'Market created successfully',
      market,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMarketsByEvent = async (req, res) => {
  try {
    const owned = await findOwnedEvent(req.params.eventId, req.user.id);
    if (owned.error) {
      return res.status(owned.status).json({ message: owned.error });
    }
    const { event } = owned;

    const search = normalizeText(req.query.search);
    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 10, 1), 50);
    const skip = (page - 1) * limit;

    const sortByAllowedFields = ['marketname', 'booktype', 'createdAt', 'updatedAt'];
    const requestedSortBy = normalizeText(req.query.sortBy || 'createdAt');
    const sortBy = sortByAllowedFields.includes(requestedSortBy) ? requestedSortBy : 'createdAt';
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;

    const query = {
      createdBy: req.user.id,
      event: event._id,
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escapedSearch, $options: 'i' };
      const booktype = BOOK_TYPES.find((item) => item.toLowerCase() === search.toLowerCase());
      query.$or = [{ marketname: searchRegex }];
      if (booktype) query.$or.push({ booktype });
    }

    const [markets, totalRecords] = await Promise.all([
      Market.find(query)
        .sort({ [sortBy]: sortOrder, _id: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Market.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      markets,
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

export const getMarketById = async (req, res) => {
  try {
    if (!isValidId(req.params.eventId) || !isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid market id' });
    }

    const market = await Market.findOne({
      _id: req.params.id,
      event: req.params.eventId,
      createdBy: req.user.id,
    }).lean();

    if (!market) {
      return res.status(404).json({ message: 'Market not found or you do not have access' });
    }

    return res.status(200).json(market);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateMarket = async (req, res) => {
  try {
    if (!isValidId(req.params.eventId) || !isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid market id' });
    }

    const parsed = readMarketBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const market = await Market.findOneAndUpdate(
      {
        _id: req.params.id,
        event: req.params.eventId,
        createdBy: req.user.id,
      },
      { $set: parsed.value },
      { new: true, runValidators: true }
    ).lean();

    if (!market) {
      return res.status(404).json({ message: 'Market not found or you do not have access' });
    }

    return res.status(200).json({
      message: 'Market updated successfully',
      market,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
