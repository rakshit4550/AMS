import mongoose from 'mongoose';
import SettlementParty from '../model/SettlementParty.js';
import SettlementUsername from '../model/SettlementUsername.js';

const NAME_COLLATION = { locale: 'en', strength: 2 };

const isValidId = (id) => {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return false;
  try {
    return String(new mongoose.Types.ObjectId(id)) === id;
  } catch {
    return false;
  }
};

const normalizeText = (value) => String(value ?? '').trim();

const contactNoError = (contactNo) => {
  if (contactNo && !/^\d{10}$/.test(contactNo)) {
    return 'Contact number must be exactly 10 digits';
  }
  return null;
};

const parsePartnershipPercentage = (value, { required = true } = {}) => {
  const missing = value === undefined || value === null || String(value).trim() === '';
  if (missing) {
    if (required) return { error: 'Partnership percentage is required' };
    return { value: null };
  }
  if (typeof value === 'boolean') {
    return { error: 'Partnership percentage must be a number' };
  }

  const number = typeof value === 'string' ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(number)) {
    return { error: 'Partnership percentage must be a number' };
  }
  if (number < 0) {
    return { error: 'Partnership percentage must be at least 0' };
  }
  return { value: number };
};

const isDuplicateKey = (error) => error?.code === 11000;

const findOwnedParty = (partyId, userId) =>
  SettlementParty.findOne({ _id: partyId, createdBy: userId });

const attachUsernames = async (parties, userId) => {
  if (!parties.length) return [];

  const usernames = await SettlementUsername.find({
    createdBy: userId,
    settlementParty: { $in: parties.map((party) => party._id) },
  })
    .sort({ username: 1, _id: 1 })
    .select('username partnershipPercentage settlementParty createdAt updatedAt')
    .lean();

  const grouped = new Map();
  usernames.forEach((entry) => {
    const key = entry.settlementParty.toString();
    const list = grouped.get(key) || [];
    list.push({
      _id: entry._id,
      username: entry.username,
      partnershipPercentage: entry.partnershipPercentage ?? null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
    grouped.set(key, list);
  });

  return parties.map((party) => ({
    ...party,
    usernames: grouped.get(party._id.toString()) || [],
  }));
};

export const createSettlementParty = async (req, res) => {
  try {
    const partyname = normalizeText(req.body.partyname);
    const contactNo = normalizeText(req.body.contactNo);
    const partnership = parsePartnershipPercentage(req.body.partnershipPercentage);

    if (!partyname) {
      return res.status(400).json({ message: 'Party name is required' });
    }
    if (partnership.error) {
      return res.status(400).json({ message: partnership.error });
    }

    const contactError = contactNoError(contactNo);
    if (contactError) {
      return res.status(400).json({ message: contactError });
    }

    const party = await SettlementParty.create({
      partyname,
      contactNo,
      partnershipPercentage: partnership.value,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: 'Settlement party created successfully',
      party: { ...party.toObject(), usernames: [] },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllSettlementParties = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = normalizeText(req.query.search);
    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const allowedLimits = [10, 20, 50];
    const limit = allowedLimits.includes(parsedLimit) ? parsedLimit : 10;
    const skip = (page - 1) * limit;

    const sortByAllowedFields = ['partyname', 'createdAt', 'updatedAt'];
    const requestedSortBy = normalizeText(req.query.sortBy || 'partyname');
    const sortBy = sortByAllowedFields.includes(requestedSortBy)
      ? requestedSortBy
      : 'partyname';
    const sortOrder = String(req.query.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;

    const query = { createdBy: userId };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escapedSearch, $options: 'i' };
      query.$or = [{ partyname: searchRegex }, { contactNo: searchRegex }];
    }

    const [parties, totalRecords] = await Promise.all([
      SettlementParty.find(query)
        .sort({ [sortBy]: sortOrder, _id: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      SettlementParty.countDocuments(query),
    ]);

    const partiesWithUsernames = await attachUsernames(parties, userId);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      parties: partiesWithUsernames,
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSettlementPartyById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid settlement party id' });
    }

    const party = await SettlementParty.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).lean();

    if (!party) {
      return res.status(404).json({ message: 'Settlement party not found or you do not have access' });
    }

    const [partyWithUsernames] = await attachUsernames([party], req.user.id);
    res.status(200).json(partyWithUsernames);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSettlementParty = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid settlement party id' });
    }

    const partyname = normalizeText(req.body.partyname);
    if (!partyname) {
      return res.status(400).json({ message: 'Party name is required' });
    }

    const updates = { partyname };
    if (Object.prototype.hasOwnProperty.call(req.body, 'partnershipPercentage')) {
      const partnership = parsePartnershipPercentage(req.body.partnershipPercentage);
      if (partnership.error) {
        return res.status(400).json({ message: partnership.error });
      }
      updates.partnershipPercentage = partnership.value;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'contactNo')) {
      const contactNo = normalizeText(req.body.contactNo);
      const contactError = contactNoError(contactNo);
      if (contactError) {
        return res.status(400).json({ message: contactError });
      }
      updates.contactNo = contactNo;
    }

    const party = await SettlementParty.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!party) {
      return res.status(404).json({ message: 'Settlement party not found or you do not have access' });
    }

    const [partyWithUsernames] = await attachUsernames([party], req.user.id);
    res.status(200).json({
      message: 'Settlement party updated successfully',
      party: partyWithUsernames,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createSettlementUsername = async (req, res) => {
  try {
    if (!isValidId(req.params.partyId)) {
      return res.status(400).json({ message: 'Invalid settlement party id' });
    }

    const username = normalizeText(req.body.username);
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const partnership = parsePartnershipPercentage(req.body.partnershipPercentage, { required: false });
    if (partnership.error) {
      return res.status(400).json({ message: partnership.error });
    }

    const party = await findOwnedParty(req.params.partyId, req.user.id);
    if (!party) {
      return res.status(404).json({ message: 'Settlement party not found or you do not have access' });
    }

    const entry = await SettlementUsername.create({
      username,
      partnershipPercentage: partnership.value,
      settlementParty: party._id,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: 'Username added successfully',
      username: {
        _id: entry._id,
        username: entry.username,
        partnershipPercentage: entry.partnershipPercentage ?? null,
        settlementParty: entry.settlementParty,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    });
  } catch (error) {
    if (isDuplicateKey(error)) {
      return res.status(409).json({ message: 'Username already exists for this party' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSettlementUsernames = async (req, res) => {
  try {
    if (!isValidId(req.params.partyId)) {
      return res.status(400).json({ message: 'Invalid settlement party id' });
    }

    const party = await findOwnedParty(req.params.partyId, req.user.id).lean();
    if (!party) {
      return res.status(404).json({ message: 'Settlement party not found or you do not have access' });
    }

    const usernames = await SettlementUsername.find({
      settlementParty: party._id,
      createdBy: req.user.id,
    })
      .sort({ username: 1, _id: 1 })
      .select('username partnershipPercentage settlementParty createdAt updatedAt')
      .lean();

    res.status(200).json({ partyId: party._id, usernames });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSettlementUsername = async (req, res) => {
  try {
    if (!isValidId(req.params.partyId) || !isValidId(req.params.usernameId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const username = normalizeText(req.body.username);
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const updates = { username };
    if (Object.prototype.hasOwnProperty.call(req.body, 'partnershipPercentage')) {
      const partnership = parsePartnershipPercentage(req.body.partnershipPercentage, { required: false });
      if (partnership.error) {
        return res.status(400).json({ message: partnership.error });
      }
      updates.partnershipPercentage = partnership.value;
    }

    const party = await findOwnedParty(req.params.partyId, req.user.id).lean();
    if (!party) {
      return res.status(404).json({ message: 'Settlement party not found or you do not have access' });
    }

    const duplicate = await SettlementUsername.findOne({
      settlementParty: party._id,
      username,
      _id: { $ne: req.params.usernameId },
    }).collation(NAME_COLLATION);

    if (duplicate) {
      return res.status(409).json({ message: 'Username already exists for this party' });
    }

    const entry = await SettlementUsername.findOneAndUpdate(
      {
        _id: req.params.usernameId,
        settlementParty: party._id,
        createdBy: req.user.id,
      },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!entry) {
      return res.status(404).json({ message: 'Username not found' });
    }

    res.status(200).json({
      message: 'Username updated successfully',
      username: {
        _id: entry._id,
        username: entry.username,
        partnershipPercentage: entry.partnershipPercentage ?? null,
        settlementParty: entry.settlementParty,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    });
  } catch (error) {
    if (isDuplicateKey(error)) {
      return res.status(409).json({ message: 'Username already exists for this party' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
