import Settlement from '../model/Settlement.js';
import Domain from '../model/Domain.js';

// Create a new settlement
export const createSettlement = async (req, res) => {
  try {
    const { date, domain, settlement, rate } = req.body;
    const createdBy = req.user.id;

    console.log('Create settlement request:', { date, domain, settlement, rate, createdBy }); // Debug log

    // Validate domain exists and belongs to the user
    const domainExists = await Domain.findOne({ _id: domain, createdBy });
    if (!domainExists) {
      return res.status(400).json({ message: 'Invalid domain or you are not authorized' });
    }

    // Validate settlement and rate
    const parsedSettlement = parseFloat(settlement);
    const parsedRate = parseFloat(rate);
    if (isNaN(parsedSettlement) || isNaN(parsedRate)) {
      return res.status(400).json({ message: 'Settlement and rate must be valid numbers' });
    }

    const newSettlement = new Settlement({
      date,
      domain,
      settlement: parsedSettlement,
      rate: parsedRate,
      createdBy,
    });

    const savedSettlement = await newSettlement.save();
    const populatedSettlement = await Settlement.findById(savedSettlement._id).populate('domain', 'domainname');
    res.status(201).json({ 
      message: 'Settlement created successfully',
      data: populatedSettlement 
    });
  } catch (error) {
    console.error('Create settlement error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Get all settlements for the authenticated user
export const getSettlements = async (req, res) => {
  try {
    console.log('Fetching settlements for user:', req.user.id); // Debug log
    const settlements = await Settlement.find({ createdBy: req.user.id }).populate('domain', 'domainname');
    console.log('Fetched settlements:', settlements); // Debug log
    res.status(200).json(settlements);
  } catch (error) {
    console.error('Get settlements error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a single settlement by ID
export const getSettlementById = async (req, res) => {
  try {
    const settlement = await Settlement.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).populate('domain', 'domainname');
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found or you are not authorized' });
    }
    res.status(200).json(settlement);
  } catch (error) {
    console.error('Get settlement by ID error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update a settlement
export const updateSettlement = async (req, res) => {
  try {
    const { date, domain, settlement, rate } = req.body;
    const createdBy = req.user.id;

    console.log('Update settlement request:', { date, domain, settlement, rate, createdBy }); // Debug log

    const domainExists = await Domain.findOne({ _id: domain, createdBy });
    if (!domainExists) {
      return res.status(400).json({ message: 'Invalid domain or you are not authorized' });
    }

    const parsedSettlement = parseFloat(settlement);
    const parsedRate = parseFloat(rate);
    if (isNaN(parsedSettlement) || isNaN(parsedRate)) {
      return res.status(400).json({ message: 'Settlement and rate must be valid numbers' });
    }

    const updatedSettlement = await Settlement.findOneAndUpdate(
      { _id: req.params.id, createdBy },
      { date, domain, settlement: parsedSettlement, rate: parsedRate },
      { new: true }
    ).populate('domain', 'domainname');
    if (!updatedSettlement) {
      return res.status(404).json({ message: 'Settlement not found or you are not authorized' });
    }
    res.status(200).json({ 
      message: 'Settlement updated successfully',
      data: updatedSettlement 
    });
  } catch (error) {
    console.error('Update settlement error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Delete a settlement
export const deleteSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found or you are not authorized' });
    }
    res.status(200).json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    console.error('Delete settlement error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Download settlements
export const downloadSettlement = async (req, res) => {
  try {
    const domainId = req.query.domain;
    const query = { createdBy: req.user.id };
    if (domainId && domainId !== 'null') {
      query.domain = domainId;
      const domainExists = await Domain.findOne({ _id: domainId, createdBy: req.user.id });
      if (!domainExists) {
        return res.status(400).json({ message: 'Invalid domain or you are not authorized' });
      }
    }
    const settlements = await Settlement.find(query).populate('domain', 'domainname').sort({ createdAt: -1 });

    const grouped = {};
    settlements.forEach((sett) => {
      const dName = sett.domain ? sett.domain.domainname : 'Unknown';
      if (!grouped[dName]) {
        grouped[dName] = {
          name: dName,
          accounts: [],
          totalSettlement: 0,
          totalRate: 0,
        };
      }
      grouped[dName].accounts.push({
        _id: sett._id,
        date: sett.date.toISOString(),
        domainname: sett.domain ? sett.domain.domainname : 'Unknown',
        domainId: sett.domain ? sett.domain._id : null,
        settlement: Number(sett.settlement) || 0,
        rate: Number(sett.rate) || 0,
        createdAt: sett.createdAt.toISOString(),
      });
      grouped[dName].totalSettlement += Number(sett.settlement) || 0;
      grouped[dName].totalRate += Number(sett.rate) || 0;
    });

    console.log('Download settlements response:', grouped); // Debug log
    res.status(200).json(grouped);
  } catch (error) {
    console.error('Download settlement error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all domains for the authenticated user
export const getDomains = async (req, res) => {
  try {
    console.log('Fetching domains for user:', req.user.id); // Debug log
    const domains = await Domain.find({ createdBy: req.user.id }).select('_id domainname');
    console.log('Fetched domains:', domains); // Debug log
    res.status(200).json(domains);
  } catch (error) {
    console.error('Get domains error:', error.message);
    res.status(500).json({ message: error.message });
  }
};