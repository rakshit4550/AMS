import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAccounts, fetchParties } from "../redux/accountSlice";
import { fetchUtrs } from "../redux/utrSlice";
import { AiFillDashboard } from "react-icons/ai";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { BsReceiptCutoff } from "react-icons/bs";

const formatNumber = (n) => {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return "0";
  return Number(n).toLocaleString("en-IN");
};

const partyKeyFromAccount = (account) => {
  const p = account?.partyname;
  if (!p) return null;
  if (typeof p === "object" && p._id != null) return String(p._id);
  return String(p);
};

const partyNameFromAccount = (account, parties) => {
  const p = account?.partyname;
  if (p && typeof p === "object" && p.partyname) return p.partyname;
  const id = partyKeyFromAccount(account);
  if (!id) return "Unknown";
  const row = parties.find((x) => String(x._id) === id);
  return row?.partyname || "Unknown";
};

const topNByField = (rows, field, n = 5) =>
  [...rows]
    .filter((r) => (Number(r[field]) || 0) > 0)
    .sort(
      (a, b) =>
        (Number(b[field]) || 0) - (Number(a[field]) || 0) ||
        String(a.name).localeCompare(String(b.name)),
    )
    .slice(0, n);

const formatUtrDate = (d) => {
  if (!d || Number.isNaN(new Date(d).getTime())) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accounts, parties, loading, error } = useSelector(
    (state) => state.account,
  );
  const { utrs, loading: utrLoading } = useSelector((state) => state.utr);
  const { role } = useSelector((state) => state.user);

  const getRoleFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "";
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.role || "";
    } catch {
      return "";
    }
  };

  const userRole = role || getRoleFromToken();
  const isTrader = userRole === "trader";

  useEffect(() => {
    dispatch(fetchParties())
      .unwrap()
      .catch((err) => {
        if (err === "No token available" || String(err).includes("Invalid token")) {
          navigate("/");
        }
      });
    dispatch(fetchAccounts())
      .unwrap()
      .catch((err) => {
        if (err === "No token available" || String(err).includes("Invalid token")) {
          navigate("/");
        }
      });
  }, [dispatch, navigate]);

  useEffect(() => {
    if (!isTrader) return;
    dispatch(fetchUtrs())
      .unwrap()
      .catch((err) => {
        if (err === "No token available" || String(err).includes("Invalid token")) {
          navigate("/");
        }
      });
  }, [dispatch, navigate, isTrader]);

  const { topWithdrawParties, topDepositParties } = useMemo(() => {
    const map = {};
    for (const acc of accounts || []) {
      const key = partyKeyFromAccount(acc);
      if (!key) continue;
      if (!map[key]) {
        map[key] = {
          partyId: key,
          name: partyNameFromAccount(acc, parties || []),
          totalDebit: 0,
          totalCredit: 0,
        };
      }
      map[key].totalDebit += Number(acc.debit) || 0;
      map[key].totalCredit += Number(acc.credit) || 0;
      map[key].name = partyNameFromAccount(acc, parties || []);
    }
    const list = Object.values(map);
    return {
      topWithdrawParties: topNByField(list, "totalDebit", 5),
      topDepositParties: topNByField(list, "totalCredit", 5),
    };
  }, [accounts, parties]);

  const topUtrWithdraw = useMemo(() => {
    if (!isTrader || !utrs?.length) return [];
    return [...utrs]
      .filter((u) => u.transactionType === "withdraw")
      .sort(
        (a, b) =>
          (Number(b.amount) || 0) - (Number(a.amount) || 0) ||
          new Date(b.date) - new Date(a.date),
      )
      .slice(0, 5);
  }, [utrs, isTrader]);

  const topUtrDeposit = useMemo(() => {
    if (!isTrader || !utrs?.length) return [];
    return [...utrs]
      .filter((u) => u.transactionType === "deposit")
      .sort(
        (a, b) =>
          (Number(b.amount) || 0) - (Number(a.amount) || 0) ||
          new Date(b.date) - new Date(a.date),
      )
      .slice(0, 5);
  }, [utrs, isTrader]);

  const partyRankList = (items, amountKey, tone) => (
    <ol className="divide-y divide-slate-100">
      {items.length === 0 ? (
        <li className="px-4 py-8 text-center text-sm text-slate-500">
          No ledger data yet for this view.
        </li>
      ) : (
        items.map((row, i) => (
          <li
            key={row.partyId}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50/80"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${tone.rank}`}
              >
                {i + 1}
              </span>
              <span className="truncate font-medium text-slate-800">{row.name}</span>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${tone.amount}`}
            >
              ₹ {formatNumber(row[amountKey])}
            </span>
          </li>
        ))
      )}
    </ol>
  );

  const utrRankList = (items, tone) => (
    <ol className="divide-y divide-slate-100">
      {items.length === 0 ? (
        <li className="px-4 py-8 text-center text-sm text-slate-500">
          No UTR entries in this category.
        </li>
      ) : (
        items.map((u, i) => (
          <li
            key={u._id}
            className="flex flex-col gap-1 px-4 py-3 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${tone.rank}`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-medium text-slate-800 sm:text-sm">
                  {u.utrNo}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatUtrDate(u.date)}
                  {u.time ? ` · ${u.time}` : ""}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold tabular-nums ${tone.amount}`}>
              ₹ {formatNumber(u.amount)}
            </span>
          </li>
        ))
      )}
    </ol>
  );

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-sm sm:items-center sm:gap-4 sm:px-4 sm:py-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#424687] to-[#353a6e] text-white shadow-md shadow-[#424687]/25">
            <AiFillDashboard className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Dashboard
            </h1>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Top parties by total debit (withdraw) and total credit (deposit) across
              all ledger entries.
              {isTrader ? " As a trader, your largest UTR deposits and withdrawals are listed too." : ""}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 py-4 text-sm text-[#424687]">
            <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#424687]/40" />
            Loading dashboard…
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-red-50/90 to-white px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <FaArrowTrendDown className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Top 5 parties — withdraw (debit)
                </h2>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Highest total debit per party
                </p>
              </div>
            </div>
            {partyRankList(topWithdrawParties, "totalDebit", {
              rank: "bg-red-100 text-red-800",
              amount: "text-red-700",
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-emerald-50/90 to-white px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FaArrowTrendUp className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Top 5 parties — deposit (credit)
                </h2>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Highest total credit per party
                </p>
              </div>
            </div>
            {partyRankList(topDepositParties, "totalCredit", {
              rank: "bg-emerald-100 text-emerald-800",
              amount: "text-emerald-700",
            })}
          </div>
        </div>

        {isTrader && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-[#424687]/10 to-white px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#424687]/15 text-[#424687]">
                  <BsReceiptCutoff className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    Top 5 UTR — withdraw
                  </h2>
                  <p className="text-[11px] text-slate-500 sm:text-xs">
                    Largest withdraw amounts
                  </p>
                </div>
              </div>
              {utrLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#424687]/40" />
                  Loading UTR…
                </div>
              ) : (
                utrRankList(topUtrWithdraw, {
                  rank: "bg-slate-200 text-slate-800",
                  amount: "text-red-700",
                })
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-[#424687]/10 to-white px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#424687]/15 text-[#424687]">
                  <BsReceiptCutoff className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    Top 5 UTR — deposit
                  </h2>
                  <p className="text-[11px] text-slate-500 sm:text-xs">
                    Largest deposit amounts
                  </p>
                </div>
              </div>
              {utrLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#424687]/40" />
                  Loading UTR…
                </div>
              ) : (
                utrRankList(topUtrDeposit, {
                  rank: "bg-slate-200 text-slate-800",
                  amount: "text-emerald-700",
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
