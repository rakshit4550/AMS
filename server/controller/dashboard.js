import mongoose from "mongoose";
import Account from "../model/Account.js";
import Utr from "../model/Utr.js";

const toObjectId = (id) => {
  if (!id) return id;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(String(id))) {
    return new mongoose.Types.ObjectId(String(id));
  }
  return id;
};

const parseDateRange = (fromDate, toDate) => {
  const range = {};
  if (fromDate) {
    const parsed = new Date(`${fromDate}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) {
      range.$gte = parsed;
    }
  }
  if (toDate) {
    const parsed = new Date(`${toDate}T23:59:59.999Z`);
    if (!Number.isNaN(parsed.getTime())) {
      range.$lte = parsed;
    }
  }
  return Object.keys(range).length ? range : null;
};

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = toObjectId(req.user.id);
    const fromDate = String(req.query.fromDate || "").trim();
    const toDate = String(req.query.toDate || "").trim();
    const isTrader =
      req.user?.role === "trader" || req.user?.role === "admin";

    const dateRange = parseDateRange(fromDate, toDate);
    const accountMatch = { createdBy: userId };
    if (dateRange) {
      accountMatch.date = dateRange;
    }

    const partyClosingPipeline = [
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: "$partyname",
          debit: { $sum: "$debit" },
          credit: { $sum: "$credit" },
        },
      },
      {
        $lookup: {
          from: "parties",
          localField: "_id",
          foreignField: "_id",
          as: "party",
        },
      },
      { $unwind: { path: "$party", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          partyId: { $toString: "$_id" },
          name: { $ifNull: ["$party.partyname", "Unknown Party"] },
          debit: 1,
          credit: 1,
          closing: { $subtract: ["$debit", "$credit"] },
        },
      },
    ];

    const tasks = [
      Account.aggregate(partyClosingPipeline),
      Account.countDocuments(accountMatch),
    ];

    if (isTrader) {
      const utrMatch =
        req.user.role === "admin" ? {} : { createdBy: userId };
      if (dateRange) {
        utrMatch.date = dateRange;
      }
      tasks.push(Utr.countDocuments(utrMatch));
      if (dateRange) {
        tasks.push(
          Utr.find(utrMatch)
            .sort({ amount: -1, date: -1 })
            .limit(50)
            .select("utrNo amount date time transactionType")
            .lean(),
        );
      } else {
        tasks.push(Promise.resolve([]));
      }
    }

    const results = await Promise.all(tasks);
    const partyRows = results[0];
    const ledgerCountInRange = results[1];
    const utrCountInRange = isTrader ? results[2] : 0;
    const utrsForRange = isTrader ? results[3] : [];

    const topClosingDrParties = partyRows
      .filter((r) => Number(r.closing) > 0)
      .sort(
        (a, b) =>
          Number(b.closing) - Number(a.closing) ||
          String(a.name).localeCompare(String(b.name)),
      )
      .slice(0, 10);

    const topClosingCrParties = partyRows
      .filter((r) => Number(r.closing) < 0)
      .sort(
        (a, b) =>
          Number(a.closing) - Number(b.closing) ||
          String(a.name).localeCompare(String(b.name)),
      )
      .slice(0, 10);

    let topUtrWithdraw = [];
    let topUtrDeposit = [];
    if (isTrader && utrsForRange.length) {
      topUtrWithdraw = utrsForRange
        .filter((u) => u.transactionType === "withdraw")
        .sort(
          (a, b) =>
            (Number(b.amount) || 0) - (Number(a.amount) || 0) ||
            new Date(b.date) - new Date(a.date),
        )
        .slice(0, 10);
      topUtrDeposit = utrsForRange
        .filter((u) => u.transactionType === "deposit")
        .sort(
          (a, b) =>
            (Number(b.amount) || 0) - (Number(a.amount) || 0) ||
            new Date(b.date) - new Date(a.date),
        )
        .slice(0, 10);
    }

    return res.status(200).json({
      success: true,
      topClosingDrParties,
      topClosingCrParties,
      ledgerCountInRange,
      utrCountInRange: isTrader ? utrCountInRange : 0,
      topUtrWithdraw,
      topUtrDeposit,
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    });
  } catch (error) {
    console.error("getDashboardSummary error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
