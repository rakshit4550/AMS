import Party from '../model/Party.js';

// Create a new party
export const createParty = async (req, res) => {
  try {
    const { partyname, mobileNumber, city, remark } = req.body;
    if (!partyname) {
      return res.status(400).json({ message: 'Party name is required' });
    }
    const party = new Party({ partyname, mobileNumber, city, remark, createdBy: req.user.id });
    await party.save();
    res.status(201).json({ message: 'Party created successfully', party });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all parties for the authenticated user
// export const getAllParties = async (req, res) => {
//   try {
//     const parties = await Party.find({ createdBy: req.user.id });
//     res.status(200).json(parties);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


// Get parties with pagination and search
export const getAllParties = async (req, res) => {
  try {
    const userId = req.user.id;

    const search = String(req.query.search || "").trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    const skip = (page - 1) * limit;

    const sortByAllowedFields = [
      "partyname",
      "createdAt",
      "updatedAt",
    ];

    const requestedSortBy = String(
      req.query.sortBy || "partyname"
    ).trim();

    const sortBy = sortByAllowedFields.includes(requestedSortBy)
      ? requestedSortBy
      : "partyname";

    const sortOrder =
      String(req.query.sortOrder || "asc").toLowerCase() === "desc"
        ? -1
        : 1;

    const query = {
      createdBy: userId,
    };

    /*
     * Search by party name
     */
    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      query.partyname = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    /*
     * Paginated parties and total count parallel me fetch honge
     */
    const [parties, totalRecords] = await Promise.all([
      Party.find(query)
        .sort({
          [sortBy]: sortOrder,
          _id: sortOrder,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Party.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      parties,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search: search || "",
        sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    console.error("getAllParties error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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
    const { partyname, mobileNumber, city, remark } = req.body;
    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { partyname, mobileNumber, city, remark },
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