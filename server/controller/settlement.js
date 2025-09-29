import Settlement from '../model/Settlement.js';

// Create a new settlement
export const createSettlement = async (req, res) => {
  try {
    const { date, domainname, settlement, rate } = req.body;
    const createdBy = req.user.id; 

    const newSettlement = new Settlement({
      date,
      domainname,
      settlement,
      rate,
      createdBy,
    });

    const savedSettlement = await newSettlement.save();
    res.status(201).json({ 
      message: 'Settlement created successfully',
      data: savedSettlement 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all settlements for the authenticated user
export const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find({ createdBy: req.user.id });
    res.status(200).json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single settlement by ID (only if created by the user)
export const getSettlementById = async (req, res) => {
  try {
    const settlement = await Settlement.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found or you are not authorized' });
    }
    res.status(200).json(settlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a settlement (only if created by the user)
export const updateSettlement = async (req, res) => {
  try {
    const { date, domainname, settlement, rate } = req.body;
    const updatedSettlement = await Settlement.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { date, domainname, settlement, rate },
      { new: true }
    );
    if (!updatedSettlement) {
      return res.status(404).json({ message: 'Settlement not found or you are not authorized' });
    }
    res.status(200).json({ 
      message: 'Settlement updated successfully',
      data: updatedSettlement 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a settlement (only if created by the user)
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
    res.status(500).json({ message: error.message });
  }
};


export const downloadSettlement = async (req, res) => {
  try {
    const domainname = req.query.domain;
    const query = { createdBy: req.user.id };
    if (domainname) {
      query.domainname = domainname; // Filter by domainname directly
    }
    const settlements = await Settlement.find(query).sort({ createdAt: -1 });

    // Group settlements by domainname
    const grouped = {};
    settlements.forEach((sett) => {
      const dName = sett.domainname;
      if (!grouped[dName]) {
        grouped[dName] = {
          name: dName,
          settlements: [],
          totalSettlement: 0,
          totalRate: 0,
        };
      }
      grouped[dName].settlements.push({
        _id: sett._id,
        date: sett.date.toISOString(),
        settlement: Number(sett.settlement) || 0,
        rate: Number(sett.rate) || 0,
        createdAt: sett.createdAt.toISOString(),
      });
      grouped[dName].totalSettlement += Number(sett.settlement) || 0;
      grouped[dName].totalRate += Number(sett.rate) || 0;
    });

    res.status(200).json(grouped);
  } catch (error) {
    console.error('Download settlement error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};