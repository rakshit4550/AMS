import mongoose from 'mongoose';
import Utr from '../model/Utr.js';
import UtrSubtype from '../model/UtrSubtype.js';

const getTodayISTDateOnly = () => {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istDate.setHours(0, 0, 0, 0);
  return istDate;
};

const getCurrentISTTime = () => {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const canAccessUtr = (req) => {
  return req.user?.role === 'trader' || req.user?.role === 'admin';
};

// Create UTR
export const createUtr = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const {
      utrNo,
      amount,
      transactionType = 'deposit',
      subtype = '',
      date,
      remark = '',
    } = req.body;

    if (!utrNo || String(utrNo).trim() === '') {
      return res.status(400).json({ message: 'UTR No is required' });
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount is required and must be greater than 0' });
    }

    const cleanTransactionType = transactionType === 'withdraw' ? 'withdraw' : 'deposit';

    let subtypeId = null;
    let subtypeName = '';

    if (subtype) {
      if (!mongoose.Types.ObjectId.isValid(subtype)) {
        return res.status(400).json({ message: 'Invalid subtype ID' });
      }

      const subtypeQuery =
        req.user.role === 'admin'
          ? { _id: subtype }
          : { _id: subtype, createdBy: req.user.id };

      const subtypeDoc = await UtrSubtype.findOne(subtypeQuery);

      if (!subtypeDoc) {
        return res.status(404).json({ message: 'Subtype not found or you do not have access' });
      }

      subtypeId = subtypeDoc._id;
      subtypeName = subtypeDoc.name;
    }

    const utr = new Utr({
      utrNo: String(utrNo).trim(),
      amount: Number(amount),
      transactionType: cleanTransactionType,
      subtype: subtypeId,
      subtypeName,
      date: date ? new Date(date) : getTodayISTDateOnly(),
      time: getCurrentISTTime(),
      remark: remark || '',
      createdBy: req.user.id,
    });

    await utr.save();

    await utr.populate([
      { path: 'createdBy', select: 'username email role' },
      { path: 'subtype', select: 'name createdBy' },
    ]);

    res.status(201).json({
      message: 'UTR created successfully',
      utr,
    });
  } catch (error) {
    console.error('Create UTR error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all UTR entries
// export const getAllUtrs = async (req, res) => {
//   try {
//     if (!canAccessUtr(req)) {
//       return res.status(403).json({ message: 'Access denied: Trader role required' });
//     }

//     const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };

//     const utrs = await Utr.find(query)
//       .populate('createdBy', 'username email role')
//       .populate('subtype', 'name createdBy')
//       .sort({ createdAt: -1 });

//     res.status(200).json(utrs);
//   } catch (error) {
//     console.error('Get UTR error:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


export const getAllUtrs = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({
        message: "Access denied: Trader role required",
      });
    }

    const search = String(req.query.search || "").trim();

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    const skip = (page - 1) * limit;

    const fromDate = String(req.query.fromDate || "").trim();
    const toDate = String(req.query.toDate || "").trim();

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "date",
      "amount",
      "utr",
      "utrNumber",
      "status",
    ];

    const requestedSortBy = String(
      req.query.sortBy || "createdAt"
    ).trim();

    const sortBy = allowedSortFields.includes(requestedSortBy)
      ? requestedSortBy
      : "createdAt";

    const sortOrder =
      String(req.query.sortOrder || "desc").toLowerCase() === "asc"
        ? 1
        : -1;

    /*
     * Admin ko sabhi UTR records milenge.
     * Baaki allowed users ko sirf unke records milenge.
     */
    const query =
      req.user.role === "admin"
        ? {}
        : {
            createdBy: req.user.id,
          };

    /*
     * Search filter
     *
     * Aapke UTR model me jo fields available hain unke according
     * ye fields search hongi.
     */
    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchConditions = [
        {
          utr: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          utrNumber: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          transactionId: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          remark: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          status: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];

      /*
       * Search value amount ho to exact amount se bhi search hoga.
       */
      const cleanedNumericSearch = search.replace(/,/g, "").trim();
      const numericSearch = Number(cleanedNumericSearch);

      if (
        cleanedNumericSearch !== "" &&
        Number.isFinite(numericSearch)
      ) {
        searchConditions.push({
          amount: numericSearch,
        });
      }

      query.$or = searchConditions;
    }

    /*
     * Date filter
     * UTR creation date ke according filter hoga.
     */
    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        const parsedFromDate = new Date(
          `${fromDate}T00:00:00.000Z`
        );

        if (Number.isNaN(parsedFromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid fromDate. Use YYYY-MM-DD format",
          });
        }

        query.createdAt.$gte = parsedFromDate;
      }

      if (toDate) {
        const parsedToDate = new Date(
          `${toDate}T23:59:59.999Z`
        );

        if (Number.isNaN(parsedToDate.getTime())) {
          return res.status(400).json({
            message: "Invalid toDate. Use YYYY-MM-DD format",
          });
        }

        query.createdAt.$lte = parsedToDate;
      }
    }

    /*
     * Records aur total count parallel me fetch honge.
     */
    const [utrs, totalRecords] = await Promise.all([
      Utr.find(query)
        .populate("createdBy", "username email role")
        .populate("subtype", "name createdBy")
        .sort({
          [sortBy]: sortOrder,
          _id: sortOrder,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Utr.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      utrs,
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
        fromDate: fromDate || null,
        toDate: toDate || null,
        sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    console.error("Get UTR error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get single UTR
export const getUtrById = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid UTR ID' });
    }

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, createdBy: req.user.id };

    const utr = await Utr.findOne(query)
      .populate('createdBy', 'username email role')
      .populate('subtype', 'name createdBy');

    if (!utr) {
      return res.status(404).json({ message: 'UTR not found or you do not have access' });
    }

    res.status(200).json(utr);
  } catch (error) {
    console.error('Get UTR by ID error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete UTR
export const deleteUtr = async (req, res) => {
  try {
    if (!canAccessUtr(req)) {
      return res.status(403).json({ message: 'Access denied: Trader role required' });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid UTR ID' });
    }

    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, createdBy: req.user.id };

    const utr = await Utr.findOneAndDelete(query);

    if (!utr) {
      return res.status(404).json({ message: 'UTR not found or you do not have access' });
    }

    res.status(200).json({ message: 'UTR deleted successfully' });
  } catch (error) {
    console.error('Delete UTR error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};