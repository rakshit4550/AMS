import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaArrowLeft, FaEdit, FaReceipt, FaTimes, FaUsers } from "react-icons/fa";
import {
  clearSettlementError,
  createSettlementParty,
  createSettlementUsername,
  createSettlementEntry,
  fetchSettlementEntries,
  fetchSettlementParties,
  updateSettlementParty,
  updateSettlementUsername,
} from "../redux/settlementSlice";

const emptyPartyForm = {
  partyname: "",
  contactNo: "",
  partnershipPercentage: "",
};

const emptyUsernameForm = {
  username: "",
  partnershipPercentage: "",
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}%`;
};

const formatMoney = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.00";
  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const rupee = (value) => `₹${formatMoney(value)}`;

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const formatEntryDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Modal = ({ title, subtitle, onClose, children, wide = false, layer = 10050 }) => {
  useEffect(() => {
    const capture = layer > 10050;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (capture) event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, capture);
    return () => window.removeEventListener("keydown", onKey, capture);
  }, [onClose, layer]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-900/50 px-4 py-6"
      style={{ zIndex: layer }}
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`settlement-modal-title-${layer}`}
        className={`flex max-h-[min(88vh,760px)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id={`settlement-modal-title-${layer}`} className="text-lg font-bold text-slate-800">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
            aria-label="Close"
          >
            <FaTimes size={16} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

const EntryBook = ({
  party,
  username,
  usernames,
  form,
  onAmount,
  onType,
  onSubmit,
  onBack,
  onSwitchUser,
  amountRef,
  error,
  loading,
  percent,
  summary,
  rows,
  pagination,
  onPage,
  onLimit,
}) => {
  const typed = roundMoney(String(form.amount).trim());
  const share =
    percent && typed > 0 ? roundMoney((typed * Number(percent.partnershipPercentage)) / 100) : null;
  const total = share === null ? null : roundMoney(typed + share);
  const closing = Number(summary?.closingBalance);
  const ledgerStart = pagination ? (pagination.currentPage - 1) * pagination.limit : 0;
  const isDeposit = form.transactionType === "deposit";

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <form
        onSubmit={onSubmit}
        className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-[#424687]/[0.06] via-white to-white px-3 py-2"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <FaArrowLeft size={11} />
            Parties
          </button>

          <div className="flex min-w-0 items-center gap-2 border-l border-slate-200 pl-2.5">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {party.partyname}
              </p>
              <p className="truncate text-sm font-semibold leading-tight text-slate-900">
                {username.username}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                percent ? "bg-[#424687]/10 text-[#424687]" : "bg-red-50 text-red-600"
              }`}
              title={
                percent
                  ? percent.percentageSource === "username"
                    ? "From this username"
                    : "From the party"
                  : "Partnership % is missing"
              }
            >
              {percent ? `${percent.partnershipPercentage}%` : "No %"}
            </span>
          </div>

          {usernames.length > 1 && (
            <select
              aria-label="Username"
              value={username._id}
              onChange={(event) => onSwitchUser(event.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/30"
            >
              {usernames.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.username}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="inline-flex h-8 rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => onType("deposit")}
                className={`rounded-md px-3 text-xs font-semibold transition ${
                  isDeposit ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => onType("withdrawal")}
                className={`rounded-md px-3 text-xs font-semibold transition ${
                  !isDeposit ? "bg-red-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Withdraw
              </button>
            </div>

            <div className="flex h-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#424687]/30">
              <span className="flex items-center pl-2.5 text-xs font-medium text-slate-400">₹</span>
              <input
                ref={amountRef}
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => onAmount(event.target.value)}
                placeholder="Amount"
                aria-label="Amount"
                className="w-28 border-0 bg-transparent px-2 text-sm text-slate-900 outline-none [appearance:textfield] placeholder:text-slate-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="submit"
                disabled={!percent}
                className="bg-[#424687] px-3.5 text-xs font-semibold text-white hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
        {total !== null && (
          <p className="mt-1.5 text-right text-[11px] text-slate-500">
            Share {rupee(share)} · Total{" "}
            <span className="font-semibold text-slate-800">{rupee(total)}</span>
          </p>
        )}
        {(error || !percent) && (
          <p className="mt-1 text-xs text-red-600">
            {error || "Partnership % is missing, so a new entry cannot be saved."}
          </p>
        )}
      </form>

      <div className="grid shrink-0 grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="border-t-2 border-emerald-500 px-3 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Deposit</p>
          <p className="text-sm font-semibold tabular-nums text-slate-900">
            {rupee(summary?.deposit?.totalAmount)}
          </p>
        </div>
        <div className="border-t-2 border-red-400 px-3 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Withdrawal</p>
          <p className="text-sm font-semibold tabular-nums text-slate-900">
            {rupee(summary?.withdrawal?.totalAmount)}
          </p>
        </div>
        <div className="border-t-2 border-[#424687] px-3 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#424687]">Closing</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              closing < 0 ? "text-red-600" : "text-slate-900"
            }`}
          >
            {rupee(summary?.closingBalance)}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {loading && (
          <p className="border-b border-slate-100 bg-slate-50 py-1 text-center text-xs text-[#424687]">
            Loading…
          </p>
        )}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#424687] text-white">
                <th className="w-12 px-3 py-2 text-left text-xs font-semibold">Sr</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Type</th>
                <th className="px-3 py-2 text-right text-xs font-semibold">Amount</th>
                <th className="px-3 py-2 text-right text-xs font-semibold">Share</th>
                <th className="px-3 py-2 text-right text-xs font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const deposit = row.transactionType === "deposit";
                  return (
                    <tr
                      key={row._id}
                      className={`border-b border-slate-100 transition-colors hover:bg-indigo-50/50 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                      }`}
                    >
                      <td className="px-3 py-2 tabular-nums text-slate-500">
                        {ledgerStart + index + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {formatEntryDate(row.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            deposit ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                          }`}
                        >
                          {deposit ? "Deposit" : "Withdraw"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                        {rupee(row.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">
                        {rupee(row.percentageAmount)}
                        <span className="ml-1 text-[11px] text-slate-400">
                          {formatPercent(row.partnershipPercentage)}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold tabular-nums ${
                          deposit ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {rupee(row.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalRecords > 0 && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-1.5">
            <p className="text-xs text-slate-600">
              {ledgerStart + 1}–{Math.min(ledgerStart + rows.length, pagination.totalRecords)} of{" "}
              {pagination.totalRecords}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                Show
                <select
                  value={pagination.limit}
                  onChange={(event) => onLimit(Number(event.target.value))}
                  className="h-7 rounded-md border border-slate-300 bg-white px-1.5 text-xs"
                >
                  {[10, 20, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => onPage(Math.max(1, pagination.currentPage - 1))}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600">
                {pagination.currentPage} / {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => onPage(pagination.currentPage + 1)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const Settlement = () => {
  const dispatch = useDispatch();
  const { parties, loading, error, pagination } = useSelector(
    (state) => state.settlement,
  );

  const partyNameRef = useRef(null);
  const editPartyNameRef = useRef(null);
  const usernameRef = useRef(null);
  const editUsernameRef = useRef(null);
  const amountRef = useRef(null);

  const [partyForm, setPartyForm] = useState(emptyPartyForm);
  const [partyFormError, setPartyFormError] = useState("");
  const [editingPartyId, setEditingPartyId] = useState(null);
  const [editPartyForm, setEditPartyForm] = useState(emptyPartyForm);
  const [editPartyError, setEditPartyError] = useState("");
  const [usernameForm, setUsernameForm] = useState(emptyUsernameForm);
  const [usernameFormError, setUsernameFormError] = useState("");
  const [editingUsernameId, setEditingUsernameId] = useState(null);
  const [editUsernameForm, setEditUsernameForm] = useState(emptyUsernameForm);
  const [editUsernameError, setEditUsernameError] = useState("");
  const [ledgerUser, setLedgerUser] = useState(null);
  const [ledgerParty, setLedgerParty] = useState(null);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [ledgerPercent, setLedgerPercent] = useState(null);
  const [ledgerPagination, setLedgerPagination] = useState(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(20);
  const [ledgerReload, setLedgerReload] = useState(0);
  const [ledgerForm, setLedgerForm] = useState({ amount: "", transactionType: "deposit" });
  const [ledgerError, setLedgerError] = useState("");
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  useEffect(() => {
    dispatch(
      fetchSettlementParties({ page: currentPage, limit: entriesPerPage, search }),
    );
  }, [dispatch, currentPage, entriesPerPage, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedPartyId) return undefined;
    const timer = setTimeout(() => usernameRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [selectedPartyId]);

  useEffect(() => {
    if (!editingPartyId) return undefined;
    const timer = setTimeout(() => editPartyNameRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [editingPartyId]);

  useEffect(() => {
    if (!editingUsernameId) return undefined;
    const timer = setTimeout(() => editUsernameRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [editingUsernameId]);

  useEffect(() => {
    if (!ledgerUser) return undefined;
    const timer = setTimeout(() => amountRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [ledgerUser]);

  useEffect(() => {
    if (!ledgerUser || !ledgerParty) return undefined;
    let cancelled = false;

    const load = async () => {
      setLedgerLoading(true);
      const result = await dispatch(
        fetchSettlementEntries({
          partyId: ledgerParty._id,
          usernameId: ledgerUser._id,
          page: ledgerPage,
          limit: ledgerLimit,
        }),
      );
      if (cancelled) return;
      setLedgerLoading(false);
      if (fetchSettlementEntries.fulfilled.match(result)) {
        setLedgerRows(result.payload.entries || []);
        setLedgerSummary(result.payload.summary || null);
        setLedgerPercent(result.payload.appliedPercentage || null);
        setLedgerPagination(result.payload.pagination || null);
        setLedgerError("");
      } else {
        setLedgerError(result.payload || "Failed to load entries");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, ledgerUser, ledgerParty, ledgerPage, ledgerLimit, ledgerReload]);

  const selectedParty = parties.find((party) => party._id === selectedPartyId) || null;
  const selectedUsernames = selectedParty?.usernames || [];

  const fieldClass =
    "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#424687]/40";

  const parsePercent = (value, required) => {
    const text = String(value ?? "").trim();
    if (!text) {
      return required ? { error: "Partnership % is required" } : { value: null };
    }
    const number = Number(text);
    if (!Number.isFinite(number)) return { error: "Partnership % must be a number" };
    if (number < 0) return { error: "Partnership % cannot be less than 0" };
    return { value: number };
  };

  const partyToForm = (party) => ({
    partyname: party.partyname || "",
    contactNo: party.contactNo || "",
    partnershipPercentage:
      party.partnershipPercentage === null || party.partnershipPercentage === undefined
        ? ""
        : String(party.partnershipPercentage),
  });

  const usernameToForm = (entry) => ({
    username: entry.username || "",
    partnershipPercentage:
      entry.partnershipPercentage === null || entry.partnershipPercentage === undefined
        ? ""
        : String(entry.partnershipPercentage),
  });

  const resetPartyForm = () => {
    setPartyForm(emptyPartyForm);
    setPartyFormError("");
    partyNameRef.current?.focus();
  };

  const closeLedger = () => {
    setLedgerUser(null);
    setLedgerParty(null);
    setLedgerRows([]);
    setLedgerSummary(null);
    setLedgerPercent(null);
    setLedgerPagination(null);
    setLedgerForm({ amount: "", transactionType: "deposit" });
    setLedgerError("");
    setLedgerPage(1);
  };

  const closeUsernameModal = () => {
    closeLedger();
    setSelectedPartyId(null);
    setUsernameForm(emptyUsernameForm);
    setUsernameFormError("");
    setEditingUsernameId(null);
    setEditUsernameForm(emptyUsernameForm);
    setEditUsernameError("");
  };

  const openLedger = (username) => {
    if (!selectedParty) return;
    setLedgerParty({ _id: selectedParty._id, partyname: selectedParty.partyname });
    setLedgerForm({ amount: "", transactionType: "deposit" });
    setLedgerError("");
    setLedgerPage(1);
    setLedgerUser({ _id: username._id, username: username.username });
    setLedgerReload((value) => value + 1);
  };

  const switchLedgerUser = (usernameId) => {
    const next = selectedUsernames.find((item) => item._id === usernameId);
    if (!next || next._id === ledgerUser?._id) return;
    setLedgerForm((prev) => ({ amount: "", transactionType: prev.transactionType }));
    setLedgerError("");
    setLedgerPage(1);
    setLedgerUser({ _id: next._id, username: next.username });
    setLedgerReload((value) => value + 1);
  };

  const openEditParty = (party) => {
    if (editingPartyId === party._id) {
      setEditingPartyId(null);
      setEditPartyError("");
      return;
    }
    setEditPartyForm(partyToForm(party));
    setEditingPartyId(party._id);
    setEditPartyError("");
    dispatch(clearSettlementError());
  };

  const openUsernames = (party) => {
    setUsernameForm(emptyUsernameForm);
    setUsernameFormError("");
    setEditingUsernameId(null);
    setEditUsernameForm(emptyUsernameForm);
    setEditUsernameError("");
    dispatch(clearSettlementError());
    setSelectedPartyId(party._id);
  };

  const handlePartyChange = (event) => {
    const { name, value } = event.target;
    const next = name === "contactNo" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setPartyForm((prev) => ({ ...prev, [name]: next }));
  };

  const handlePartySubmit = async (event) => {
    event.preventDefault();
    setPartyFormError("");
    dispatch(clearSettlementError());

    const partyname = partyForm.partyname.trim();
    if (!partyname) {
      setPartyFormError("Party name is required");
      return;
    }
    if (partyForm.contactNo && !/^\d{10}$/.test(partyForm.contactNo)) {
      setPartyFormError("Mobile must be exactly 10 digits");
      return;
    }
    const partnership = parsePercent(partyForm.partnershipPercentage, true);
    if (partnership.error) {
      setPartyFormError(partnership.error);
      return;
    }

    const result = await dispatch(
      createSettlementParty({
        partyname,
        contactNo: partyForm.contactNo,
        partnershipPercentage: partnership.value,
      }),
    );
    if (!createSettlementParty.fulfilled.match(result)) return;

    resetPartyForm();
    setCurrentPage(1);
    dispatch(fetchSettlementParties({ page: 1, limit: entriesPerPage, search }));
  };

  const handleEditPartyChange = (event) => {
    const { name, value } = event.target;
    const next = name === "contactNo" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setEditPartyForm((prev) => ({ ...prev, [name]: next }));
  };

  const handleEditPartySubmit = async (event) => {
    event.preventDefault();
    if (!editingPartyId) return;
    setEditPartyError("");
    dispatch(clearSettlementError());

    const partyname = editPartyForm.partyname.trim();
    if (!partyname) {
      setEditPartyError("Party name is required");
      return;
    }
    if (editPartyForm.contactNo && !/^\d{10}$/.test(editPartyForm.contactNo)) {
      setEditPartyError("Mobile must be exactly 10 digits");
      return;
    }
    const partnership = parsePercent(editPartyForm.partnershipPercentage, true);
    if (partnership.error) {
      setEditPartyError(partnership.error);
      return;
    }

    const result = await dispatch(
      updateSettlementParty({
        id: editingPartyId,
        partyname,
        contactNo: editPartyForm.contactNo,
        partnershipPercentage: partnership.value,
      }),
    );
    if (updateSettlementParty.fulfilled.match(result)) {
      setEditingPartyId(null);
      setEditPartyError("");
    }
  };

  const handleUsernameChange = (event) => {
    const { name, value } = event.target;
    setUsernameForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearUsernameForm = () => {
    setUsernameForm(emptyUsernameForm);
    setUsernameFormError("");
    usernameRef.current?.focus();
  };

  const handleUsernameSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPartyId) return;
    setUsernameFormError("");
    dispatch(clearSettlementError());

    const username = usernameForm.username.trim();
    if (!username) {
      setUsernameFormError("Username is required");
      return;
    }
    const partnership = parsePercent(usernameForm.partnershipPercentage, false);
    if (partnership.error) {
      setUsernameFormError(partnership.error);
      return;
    }

    const result = await dispatch(
      createSettlementUsername({
        partyId: selectedPartyId,
        username,
        partnershipPercentage: partnership.value,
      }),
    );
    if (createSettlementUsername.fulfilled.match(result)) clearUsernameForm();
  };

  const openEditUsername = (entry) => {
    if (editingUsernameId === entry._id) {
      setEditingUsernameId(null);
      setEditUsernameError("");
      return;
    }
    setEditUsernameForm(usernameToForm(entry));
    setEditingUsernameId(entry._id);
    setEditUsernameError("");
    dispatch(clearSettlementError());
  };

  const handleEditUsernameChange = (event) => {
    const { name, value } = event.target;
    setEditUsernameForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditUsernameSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPartyId || !editingUsernameId) return;
    setEditUsernameError("");
    dispatch(clearSettlementError());

    const username = editUsernameForm.username.trim();
    if (!username) {
      setEditUsernameError("Username is required");
      return;
    }
    const partnership = parsePercent(editUsernameForm.partnershipPercentage, false);
    if (partnership.error) {
      setEditUsernameError(partnership.error);
      return;
    }

    const result = await dispatch(
      updateSettlementUsername({
        partyId: selectedPartyId,
        usernameId: editingUsernameId,
        username,
        partnershipPercentage: partnership.value,
      }),
    );
    if (updateSettlementUsername.fulfilled.match(result)) {
      setEditingUsernameId(null);
      setEditUsernameError("");
    }
  };

  const handleLedgerSubmit = async (event) => {
    event.preventDefault();
    if (!ledgerParty || !ledgerUser) return;
    setLedgerError("");

    const amount = Number(String(ledgerForm.amount).trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      setLedgerError("Amount must be greater than 0");
      return;
    }

    const result = await dispatch(
      createSettlementEntry({
        partyId: ledgerParty._id,
        usernameId: ledgerUser._id,
        amount,
        transactionType: ledgerForm.transactionType,
      }),
    );
    if (!createSettlementEntry.fulfilled.match(result)) {
      setLedgerError(result.payload || "Failed to add entry");
      return;
    }

    setLedgerForm({ amount: "", transactionType: ledgerForm.transactionType });
    setLedgerSummary(result.payload.summary || null);
    if (ledgerPage !== 1) setLedgerPage(1);
    setLedgerReload((value) => value + 1);
    amountRef.current?.focus();
  };

  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.limit : 0;

  if (ledgerUser && ledgerParty) {
    return (
      <div className="z-[99] box-border flex h-[calc(100dvh-var(--app-mobile-header-height)-var(--app-bottom-nav-height)-1.25rem)] flex-col py-1.5 sm:h-[calc(100dvh-var(--app-desktop-header-height)-2.25rem)]">
        <EntryBook
          party={ledgerParty}
          username={ledgerUser}
          usernames={selectedUsernames}
          form={ledgerForm}
          onAmount={(amount) => setLedgerForm((prev) => ({ ...prev, amount }))}
          onType={(transactionType) => setLedgerForm((prev) => ({ ...prev, transactionType }))}
          onSubmit={handleLedgerSubmit}
          onBack={closeUsernameModal}
          onSwitchUser={switchLedgerUser}
          amountRef={amountRef}
          error={ledgerError}
          loading={ledgerLoading}
          percent={ledgerPercent}
          summary={ledgerSummary}
          rows={ledgerRows}
          pagination={ledgerPagination}
          onPage={setLedgerPage}
          onLimit={(limit) => {
            setLedgerLimit(limit);
            setLedgerPage(1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        <section className="rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:px-4">
          <h2 className="text-sm font-semibold text-slate-800">Add party</h2>
          <form onSubmit={handlePartySubmit} className="mt-2 flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.7fr_auto] lg:items-end">
              <label className="block min-w-0">
                <span className="mb-0.5 block text-xs font-medium text-slate-600">Party name*</span>
                <input
                  ref={partyNameRef}
                  type="text"
                  name="partyname"
                  value={partyForm.partyname}
                  onChange={handlePartyChange}
                  placeholder="Party name"
                  className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                  autoComplete="off"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-0.5 block text-xs font-medium text-slate-600">Mobile</span>
                <input
                  type="text"
                  name="contactNo"
                  value={partyForm.contactNo}
                  onChange={handlePartyChange}
                  placeholder="10 digits, optional"
                  className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="off"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-0.5 block text-xs font-medium text-slate-600">Partnership %*</span>
                <input
                  type="number"
                  name="partnershipPercentage"
                  value={partyForm.partnershipPercentage}
                  onChange={handlePartyChange}
                  placeholder="0"
                  min="0"
                  step="any"
                  className="h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-[#424687] px-4 text-sm font-semibold text-white hover:bg-[#353a6e]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={resetPartyForm}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>
            {partyFormError && <p className="text-xs text-red-600">{partyFormError}</p>}
          </form>
        </section>

        <section className="flex min-h-[min(70vh,calc(100vh-14rem))] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Party list</h2>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search party or mobile"
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:w-64"
            />
          </div>

          {loading && (
            <p className="border-b border-slate-100 bg-slate-50 py-2 text-center text-sm text-[#424687]">
              Loading…
            </p>
          )}
          {error && !selectedPartyId && (
            <p className="border-b border-red-100 bg-red-50 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#424687] text-white">
                  <th className="w-14 px-3 py-2.5 text-left text-xs font-semibold">Sr</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold">Party name</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold">Mobile</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold">Partnership %</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold">Usernames</th>
                  <th className="w-40 px-3 py-2.5 text-right text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-500">
                      No settlement parties yet. Add one from the form above.
                    </td>
                  </tr>
                ) : (
                  parties.map((party, index) => {
                    const editing = editingPartyId === party._id;
                    return (
                      <React.Fragment key={party._id}>
                        <tr
                          className={`border-b border-slate-100 ${
                            editing ? "bg-indigo-50/70" : index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                          }`}
                        >
                          <td className="px-3 py-2.5 tabular-nums text-slate-500">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">{party.partyname}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700">
                            {party.contactNo || "—"}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700">
                            {formatPercent(party.partnershipPercentage)}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700">
                            {(party.usernames || []).length}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={() => openUsernames(party)}
                                className="rounded-md p-1.5 text-[#424687] transition hover:bg-[#424687]/10"
                                title="Usernames"
                              >
                                <FaUsers size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditParty(party)}
                                className="rounded-md p-1.5 text-[#424687] transition hover:bg-[#424687]/10"
                                title="Edit party"
                              >
                                <FaEdit size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editing && (
                          <tr className="border-b border-indigo-100 bg-indigo-50/40">
                            <td colSpan={6} className="px-3 py-3">
                              <form
                                onSubmit={handleEditPartySubmit}
                                className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.7fr_auto] lg:items-end"
                              >
                                <label className="block min-w-0">
                                  <span className="mb-0.5 block text-[11px] font-medium text-slate-600">
                                    Party name*
                                  </span>
                                  <input
                                    ref={editPartyNameRef}
                                    type="text"
                                    name="partyname"
                                    value={editPartyForm.partyname}
                                    onChange={handleEditPartyChange}
                                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                                  />
                                </label>
                                <label className="block min-w-0">
                                  <span className="mb-0.5 block text-[11px] font-medium text-slate-600">
                                    Mobile
                                  </span>
                                  <input
                                    type="text"
                                    name="contactNo"
                                    value={editPartyForm.contactNo}
                                    onChange={handleEditPartyChange}
                                    inputMode="numeric"
                                    maxLength={10}
                                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                                  />
                                </label>
                                <label className="block min-w-0">
                                  <span className="mb-0.5 block text-[11px] font-medium text-slate-600">
                                    Partnership %*
                                  </span>
                                  <input
                                    type="number"
                                    name="partnershipPercentage"
                                    value={editPartyForm.partnershipPercentage}
                                    onChange={handleEditPartyChange}
                                    min="0"
                                    step="any"
                                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                                  />
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    className="h-8 rounded-md bg-[#424687] px-3 text-xs font-semibold text-white hover:bg-[#353a6e]"
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPartyId(null)}
                                    className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                              {editPartyError && (
                                <p className="mt-2 text-xs text-red-600">{editPartyError}</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalRecords > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">
                {startIndex + 1}–{Math.min(startIndex + parties.length, pagination.totalRecords)} of{" "}
                {pagination.totalRecords}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  Show
                  <select
                    value={entriesPerPage}
                    onChange={(event) => {
                      setEntriesPerPage(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    {[10, 20, 50].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-600">
                    {pagination.currentPage} / {pagination.totalPages || 1}
                  </span>
                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setCurrentPage((page) => page + 1)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedParty && (
        <Modal
          title="Usernames"
          subtitle={selectedParty.partyname}
          onClose={closeUsernameModal}
          wide
        >
          <form onSubmit={handleUsernameSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Username*</span>
              <input
                ref={usernameRef}
                type="text"
                name="username"
                value={usernameForm.username}
                onChange={handleUsernameChange}
                placeholder="Enter username"
                className={fieldClass}
                autoComplete="off"
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Share %</span>
              <input
                type="number"
                name="partnershipPercentage"
                value={usernameForm.partnershipPercentage}
                onChange={handleUsernameChange}
                placeholder="Optional"
                min="0"
                step="any"
                className={fieldClass}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="h-10 rounded-md bg-[#424687] px-4 text-sm font-semibold text-white hover:bg-[#353a6e]"
              >
                Add
              </button>
              <button
                type="button"
                onClick={clearUsernameForm}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
              >
                Clear
              </button>
            </div>
          </form>
          {(usernameFormError || error) && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {usernameFormError || error}
            </p>
          )}

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="w-12 px-3 py-2 text-left text-xs font-semibold">Sr</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Username</th>
                  <th className="w-24 px-3 py-2 text-left text-xs font-semibold">Share %</th>
                  <th className="w-40 px-3 py-2 text-right text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedUsernames.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-500">
                      No usernames yet. Add the first one above.
                    </td>
                  </tr>
                ) : (
                  selectedUsernames.map((entry, index) => {
                    const editing = editingUsernameId === entry._id;
                    return (
                      <React.Fragment key={entry._id}>
                        <tr className={`border-t border-slate-100 ${editing ? "bg-indigo-50" : "bg-white"}`}>
                          <td className="px-3 py-2 tabular-nums text-slate-500">{index + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{entry.username}</td>
                          <td className="px-3 py-2 tabular-nums text-slate-700">
                            {formatPercent(entry.partnershipPercentage)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={() => openLedger(entry)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#424687] transition hover:bg-[#424687]/10"
                                title="Open entries"
                              >
                                <FaReceipt size={12} />
                                Entries
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditUsername(entry)}
                                className="rounded-md p-1.5 text-[#424687] transition hover:bg-[#424687]/10"
                                title="Edit username"
                              >
                                <FaEdit size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editing && (
                          <tr className="border-t border-indigo-100 bg-indigo-50/50">
                            <td colSpan={4} className="px-3 py-3">
                              <form
                                onSubmit={handleEditUsernameSubmit}
                                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
                              >
                                <label className="block min-w-0">
                                  <span className="mb-0.5 block text-[11px] font-medium text-slate-600">
                                    Username*
                                  </span>
                                  <input
                                    ref={editUsernameRef}
                                    type="text"
                                    name="username"
                                    value={editUsernameForm.username}
                                    onChange={handleEditUsernameChange}
                                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                                  />
                                </label>
                                <label className="block min-w-0">
                                  <span className="mb-0.5 block text-[11px] font-medium text-slate-600">
                                    Share %
                                  </span>
                                  <input
                                    type="number"
                                    name="partnershipPercentage"
                                    value={editUsernameForm.partnershipPercentage}
                                    onChange={handleEditUsernameChange}
                                    min="0"
                                    step="any"
                                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                                  />
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    className="h-8 rounded-md bg-[#424687] px-3 text-xs font-semibold text-white"
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingUsernameId(null)}
                                    className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                              {editUsernameError && (
                                <p className="mt-2 text-xs text-red-600">{editUsernameError}</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Settlement;
