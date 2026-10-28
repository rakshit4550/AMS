import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchDashboardSummary } from "../api/paginatedApi";
import DateRangePicker from "../components/DateRangePicker";
import { AiFillDashboard } from "react-icons/ai";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { BsReceiptCutoff } from "react-icons/bs";

const formatNumber = (n) => {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return "0";
  return Number(n).toLocaleString("en-IN");
};

const formatUtrDate = (d) => {
  if (!d || Number.isNaN(new Date(d).getTime())) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const getTodayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const formatISODateLabel = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    topClosingDrParties: [],
    topClosingCrParties: [],
    ledgerCountInRange: 0,
    utrCountInRange: 0,
    topUtrWithdraw: [],
    topUtrDeposit: [],
  });

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
  const todayStr = getTodayIST();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardSummary(dateFrom, dateTo);
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          const message = err.response?.data?.message || err.message;
          if (
            message === "No token available" ||
            String(message).includes("Invalid token")
          ) {
            navigate("/");
          } else {
            setError(message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo, navigate]);

  const rangeSummary = (() => {
    if (!dateFrom && !dateTo) return "No date selected";
    if (dateFrom && !dateTo) {
      return `From ${formatISODateLabel(dateFrom)} onwards`;
    }
    if (!dateFrom && dateTo) {
      return `Up to ${formatISODateLabel(dateTo)}`;
    }
    const from = dateFrom <= dateTo ? dateFrom : dateTo;
    const to = dateFrom <= dateTo ? dateTo : dateFrom;
    if (from === to) return formatISODateLabel(from);
    return `${formatISODateLabel(from)} – ${formatISODateLabel(to)}`;
  })();

  const {
    topClosingDrParties,
    topClosingCrParties,
    ledgerCountInRange,
    utrCountInRange,
    topUtrWithdraw,
    topUtrDeposit,
  } = summary;

  const rankedListScrollClass =
    "max-h-[40rem] overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch]";

  const partyClosingList = (items, tone, side) => {
    if (items.length === 0) {
      return (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          {side === "dr"
            ? "No party with Dr closing (debit balance)."
            : "No party with Cr closing (credit balance)."}
        </div>
      );
    }
    return (
      <div className={rankedListScrollClass}>
        <ol className="divide-y divide-slate-100">
          {items.map((row, i) => (
            <li
              key={row.partyId}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${tone.rank}`}
                >
                  {i + 1}
                </span>
                <p className="min-w-0 break-words text-sm font-medium leading-snug text-slate-800 sm:text-[15px]" title={row.name}>
                  {row.name}
                </p>
              </div>
              <p className={`shrink-0 text-base font-semibold tabular-nums ${tone.amount}`}>
                ₹ {formatNumber(Math.abs(row.closing))} {side === "dr" ? "Dr" : "Cr"}
              </p>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const utrRankList = (items, tone) => {
    if (items.length === 0) {
      return (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          No UTR entries in this date range.
        </div>
      );
    }
    return (
      <div className={rankedListScrollClass}>
        <ol className="divide-y divide-slate-100">
          {items.map((u, i) => (
            <li
              key={u._id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${tone.rank}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium text-slate-800">
                    {u.utrNo}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatUtrDate(u.date)}
                    {u.time ? ` · ${u.time}` : ""}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 text-base font-semibold tabular-nums ${tone.amount}`}>
                ₹ {formatNumber(u.amount)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <div className="z-[99] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-none flex-col gap-5 sm:gap-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#424687] text-white">
                  <AiFillDashboard className="h-4 w-4" aria-hidden />
                </span>
                <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {dateFrom || dateTo ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-slate-800">{rangeSummary}</span>
                    <span className="text-slate-400"> · IST</span>
                  </>
                ) : (
                  <span className="font-medium text-slate-700">{rangeSummary}</span>
                )}
              </p>
            </div>
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              max={todayStr}
              onChange={(nextFrom, nextTo) => {
                setDateFrom(nextFrom);
                setDateTo(nextTo);
              }}
            />
          </div>
          <div className={`mt-4 grid gap-3 ${isTrader ? "sm:grid-cols-2" : "sm:max-w-xs"}`}>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ledger rows</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#424687]">{formatNumber(ledgerCountInRange)}</p>
            </div>
            {isTrader && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">UTR rows</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#424687]">{formatNumber(utrCountInRange)}</p>
              </div>
            )}
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

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-red-50/90 to-white px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <FaArrowTrendDown className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Top 10 parties — closing Dr
                </h2>
              </div>
            </div>
            {partyClosingList(
              topClosingDrParties,
              {
                rank: "bg-red-100 text-red-800",
                amount: "text-red-700",
              },
              "dr",
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/90 to-white px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FaArrowTrendUp className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Top 10 parties — closing Cr
                </h2>
              </div>
            </div>
            {partyClosingList(
              topClosingCrParties,
              {
                rank: "bg-emerald-100 text-emerald-800",
                amount: "text-emerald-700",
              },
              "cr",
            )}
          </div>
        </div>

        {isTrader && (
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-[#424687]/10 to-white px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#424687]/15 text-[#424687]">
                  <BsReceiptCutoff className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    Top 10 UTR — Total withdraw
                  </h2>
                </div>
              </div>
              {utrRankList(topUtrWithdraw, {
                rank: "bg-slate-200 text-slate-800",
                amount: "text-red-700",
              })}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-[#424687]/10 to-white px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#424687]/15 text-[#424687]">
                  <BsReceiptCutoff className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    Top 10 UTR — Total deposit
                  </h2>
                </div>
              </div>
              {utrRankList(topUtrDeposit, {
                rank: "bg-slate-200 text-slate-800",
                amount: "text-emerald-700",
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
