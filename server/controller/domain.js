import Domain from '../model/Domain.js';

// Create a new domain
export const createDomain = async (req, res) => {
  try {
    const { domainname } = req.body;
    if (!domainname) {
      return res.status(400).json({ message: 'Domain name is required' });
    }
    const domain = new Domain({ domainname, createdBy: req.user.id });
    await domain.save();
    res.status(201).json({ message: 'Domain created successfully', domain });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all domains for the authenticated user
export const getAllDomains = async (req, res) => {
  try {
    const domains = await Domain.find({ createdBy: req.user.id });
    res.status(200).json(domains);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single domain by ID
export const getDomainById = async (req, res) => {
  try {
    const domain = await Domain.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found or you do not have access' });
    }
    res.status(200).json(domain);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a domain
export const updateDomain = async (req, res) => {
  try {
    const { domainname } = req.body;
    const domain = await Domain.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { domainname },
      { new: true, runValidators: true }
    );
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found or you do not have access' });
    }
    res.status(200).json({ message: 'Domain updated successfully', domain });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a domain
export const deleteDomain = async (req, res) => {
  try {
    const domain = await Domain.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found or you do not have access' });
    }
    res.status(200).json({ message: 'Domain deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};