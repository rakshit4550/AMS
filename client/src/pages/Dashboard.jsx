import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchDashboardSummary } from "../api/paginatedApi";
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

  const fromInputMax = dateTo || todayStr;

  const dateFieldClass =
    "h-9 min-w-[10.5rem] rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40";

  const onFromChange = (v) => {
    if (!v) {
      setDateFrom("");
      return;
    }
    const t = getTodayIST();
    let next = v;
    if (next > t) next = t;
    setDateFrom(next);
    if (dateTo && next > dateTo) setDateTo(next);
  };

  const onToChange = (v) => {
    if (!v) {
      setDateTo("");
      return;
    }
    const t = getTodayIST();
    let next = v;
    if (next > t) next = t;
    setDateTo(next);
    if (dateFrom && next < dateFrom) setDateFrom(next);
  };

  const rankedListScrollClass =
    "max-h-[min(42vh,20rem)] overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch]";

  const partyClosingList = (items, tone, side) => {
    if (items.length === 0) {
      return (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
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
              className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-slate-50/80 sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${tone.rank}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="break-words font-medium leading-snug text-slate-800"
                      title={row.name}
                    >
                      {row.name}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                      Overall closing balance (all ledger entries)
                    </p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`text-sm font-semibold tabular-nums ${tone.amount}`}
                >
                  ₹ {formatNumber(Math.abs(row.closing))}{" "}
                  {side === "dr" ? "Dr" : "Cr"}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {side === "dr" ? "Debit balance" : "Credit balance"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const utrRankList = (items, tone) => {
    if (items.length === 0) {
      return (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
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
              <span
                className={`text-sm font-semibold tabular-nums ${tone.amount}`}
              >
                ₹ {formatNumber(u.amount)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-4">
        <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-sm ring-1 ring-slate-100/80 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Date range
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 sm:w-auto">
              <label
                htmlFor="dash-date-from"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                From
              </label>
              <input
                id="dash-date-from"
                type="date"
                value={dateFrom}
                max={fromInputMax}
                onChange={(e) => onFromChange(e.target.value)}
                className={dateFieldClass}
              />
            </div>
            <div className="min-w-0 sm:w-auto">
              <label
                htmlFor="dash-date-to"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                To
              </label>
              <input
                id="dash-date-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max={todayStr}
                onChange={(e) => onToChange(e.target.value)}
                className={dateFieldClass}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const t = getTodayIST();
                setDateFrom(t);
                setDateTo(t);
              }}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:text-[#424687] sm:shrink-0"
            >
              Today (IST)
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {dateFrom || dateTo ? (
              <>
                Showing data for{" "}
                <span className="font-semibold text-slate-700">
                  {rangeSummary}
                </span>{" "}
                <span className="text-slate-400">(IST)</span>
                <span className="mx-1.5 text-slate-300">·</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-700">
                  {rangeSummary}
                </span>
                <span className="mx-1.5 text-slate-300">·</span>
              </>
            )}
            <span className="text-slate-600">
              {ledgerCountInRange} ledger row
              {ledgerCountInRange === 1 ? "" : "s"}
              {isTrader
                ? ` · ${utrCountInRange} UTR row${utrCountInRange === 1 ? "" : "s"}`
                : ""}
            </span>
          </p>
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
            <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-emerald-50/90 to-white px-4 py-3">
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
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/60">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-[#424687]/10 to-white px-4 py-3">
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
              <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-[#424687]/10 to-white px-4 py-3">
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
