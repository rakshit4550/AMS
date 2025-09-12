import Party from '../model/Party.js';

// Create a new party
export const createParty = async (req, res) => {
  try {
    const { partyname } = req.body;
    if (!partyname) {
      return res.status(400).json({ message: 'Party name is required' });
    }
    const party = new Party({ partyname, createdBy: req.user.id });
    await party.save();
    res.status(201).json({ message: 'Party created successfully', party });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all parties for the authenticated user
export const getAllParties = async (req, res) => {
  try {
    const parties = await Party.find({ createdBy: req.user.id });
    res.status(200).json(parties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single party by ID
export const getPartyById = async (req, res) => {
  try {
    const party = await Party.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!party) {
      return res.status(404).json({ message: 'Party not found or you do not have access' });
    }
    res.status(200).json(party);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a party
export const updateParty = async (req, res) => {
  try {
    const { partyname } = req.body;
    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { partyname },
      { new: true, runValidators: true }
    );
    if (!party) {
      return res.status(404).json({ message: 'Party not found or you do not have access' });
    }
    res.status(200).json({ message: 'Party updated successfully', party });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a party
export const deleteParty = async (req, res) => {
  try {
    const party = await Party.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!party) {
      return res.status(404).json({ message: 'Party not found or you do not have access' });
    }
    res.status(200).json({ message: 'Party deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};