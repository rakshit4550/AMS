import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEdit, FaPlus, FaTimes } from "react-icons/fa";
import {
  clearSettlementError,
  createSettlementEntry,
  createSettlementParty,
  createSettlementUsername,
  fetchPartySettlement,
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

const todayInIst = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

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

const Modal = ({ title, subtitle, onClose, children }) => {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-900/50 px-4 py-6"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settlement-modal-title"
        className="flex max-h-[min(88vh,760px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="settlement-modal-title" className="text-lg font-bold text-slate-800">
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

const Settlement = () => {
  const dispatch = useDispatch();
  const { parties, loading, error } = useSelector((state) => state.settlement);

  const partyNameRef = useRef(null);
  const usernameRef = useRef(null);
  const amountRef = useRef(null);

  const [partyForm, setPartyForm] = useState(emptyPartyForm);
  const [partyFormError, setPartyFormError] = useState("");
  const [partyModal, setPartyModal] = useState(null);
  const [usernameForm, setUsernameForm] = useState(emptyUsernameForm);
  const [usernameFormError, setUsernameFormError] = useState("");
  const [userModal, setUserModal] = useState(null);
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [ledgerUser, setLedgerUser] = useState(null);
  const [ledgerParty, setLedgerParty] = useState(null);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [ledgerPagination, setLedgerPagination] = useState(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(20);
  const [ledgerReload, setLedgerReload] = useState(0);
  const [ledgerForm, setLedgerForm] = useState({ amount: "", transactionType: "deposit" });
  const [ledgerError, setLedgerError] = useState("");
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [fromDate, setFromDate] = useState(todayInIst);
  const [toDate, setToDate] = useState(todayInIst);
  const [partySettlement, setPartySettlement] = useState(null);
  const [partySettlementError, setPartySettlementError] = useState("");
  const [partySettlementLoading, setPartySettlementLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchSettlementParties({ all: true }));
  }, [dispatch]);

  useEffect(() => {
    if (partyModal !== "add") return undefined;
    const timer = setTimeout(() => partyNameRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [partyModal]);

  useEffect(() => {
    if (userModal !== "add") return undefined;
    const timer = setTimeout(() => usernameRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [userModal]);

  useEffect(() => {
    if (!selectedUserId) return undefined;
    const timer = setTimeout(() => amountRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [selectedUserId]);

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
  const usernames = selectedParty?.usernames || [];

  useEffect(() => {
    if (!selectedPartyId) {
      setPartySettlement(null);
      setPartySettlementError("");
      return undefined;
    }
    let cancelled = false;
    setPartySettlement(null);
    setPartySettlementLoading(true);

    const load = async () => {
      const result = await dispatch(
        fetchPartySettlement({ partyId: selectedPartyId, fromDate, toDate }),
      );
      if (cancelled) return;
      setPartySettlementLoading(false);
      if (fetchPartySettlement.fulfilled.match(result)) {
        setPartySettlement(result.payload);
        setPartySettlementError("");
      } else {
        setPartySettlement(null);
        setPartySettlementError(result.payload || "Failed to load party settlement");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedPartyId, fromDate, toDate, ledgerReload, usernames.length]);
  const selectedUser = usernames.find((item) => item._id === selectedUserId) || null;

  const appliedPercent = (() => {
    if (!selectedUser) return null;
    if (selectedUser.partnershipPercentage !== null && selectedUser.partnershipPercentage !== undefined) {
      return {
        partnershipPercentage: selectedUser.partnershipPercentage,
        percentageSource: "username",
      };
    }
    if (
      selectedParty &&
      selectedParty.partnershipPercentage !== null &&
      selectedParty.partnershipPercentage !== undefined
    ) {
      return {
        partnershipPercentage: selectedParty.partnershipPercentage,
        percentageSource: "party",
      };
    }
    return null;
  })();

  const typed = roundMoney(String(ledgerForm.amount).trim());
  const share =
    appliedPercent && typed > 0
      ? roundMoney((typed * Number(appliedPercent.partnershipPercentage)) / 100)
      : null;
  const total = share === null ? null : roundMoney(typed + share);
  const closing = Number(ledgerSummary?.closingBalance);
  const ledgerStart = ledgerPagination ? (ledgerPagination.currentPage - 1) * ledgerPagination.limit : 0;
  const isDeposit = ledgerForm.transactionType === "deposit";

  const fieldClass =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#424687]/40";
  const selectClass =
    "h-8 min-w-[9.5rem] rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/30";

  const parsePercent = (value, required) => {
    const text = String(value ?? "").trim();
    if (!text) return required ? { error: "Partnership % is required" } : { value: null };
    const number = Number(text);
    if (!Number.isFinite(number)) return { error: "Partnership % must be a number" };
    if (number < 0) return { error: "Partnership % cannot be less than 0" };
    return { value: number };
  };

  const clearLedger = () => {
    setLedgerUser(null);
    setLedgerParty(null);
    setLedgerRows([]);
    setLedgerSummary(null);
    setLedgerPagination(null);
    setLedgerError("");
    setLedgerPage(1);
  };

  const onPartyChange = (partyId) => {
    setSelectedPartyId(partyId);
    setSelectedUserId("");
    setLedgerForm((prev) => ({ ...prev, amount: "" }));
    clearLedger();
  };

  const onUserChange = (userId) => {
    const party = parties.find((item) => item._id === selectedPartyId);
    const user = party?.usernames?.find((item) => item._id === userId);
    setSelectedUserId(userId);
    setLedgerForm((prev) => ({ ...prev, amount: "" }));
    setLedgerError("");
    if (!party || !user) {
      clearLedger();
      return;
    }
    setLedgerPage(1);
    setLedgerParty({ _id: party._id, partyname: party.partyname });
    setLedgerUser({ _id: user._id, username: user.username });
    setLedgerReload((value) => value + 1);
  };

  const openAddParty = () => {
    setPartyForm(emptyPartyForm);
    setPartyFormError("");
    dispatch(clearSettlementError());
    setPartyModal("add");
  };

  const openEditParty = () => {
    if (!selectedParty) return;
    setPartyForm({
      partyname: selectedParty.partyname || "",
      contactNo: selectedParty.contactNo || "",
      partnershipPercentage:
        selectedParty.partnershipPercentage === null || selectedParty.partnershipPercentage === undefined
          ? ""
          : String(selectedParty.partnershipPercentage),
    });
    setPartyFormError("");
    dispatch(clearSettlementError());
    setPartyModal("edit");
  };

  const openAddUser = () => {
    if (!selectedParty) return;
    setUsernameForm(emptyUsernameForm);
    setUsernameFormError("");
    dispatch(clearSettlementError());
    setUserModal("add");
  };

  const openEditUser = () => {
    if (!selectedUser) return;
    setUsernameForm({
      username: selectedUser.username || "",
      partnershipPercentage:
        selectedUser.partnershipPercentage === null || selectedUser.partnershipPercentage === undefined
          ? ""
          : String(selectedUser.partnershipPercentage),
    });
    setUsernameFormError("");
    dispatch(clearSettlementError());
    setUserModal("edit");
  };

  const handlePartyField = (event) => {
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

    const payload = {
      partyname,
      contactNo: partyForm.contactNo,
      partnershipPercentage: partnership.value,
    };

    const result =
      partyModal === "edit"
        ? await dispatch(updateSettlementParty({ id: selectedPartyId, ...payload }))
        : await dispatch(createSettlementParty(payload));

    const ok =
      partyModal === "edit"
        ? updateSettlementParty.fulfilled.match(result)
        : createSettlementParty.fulfilled.match(result);
    if (!ok) {
      setPartyFormError(result.payload || "Could not save party");
      return;
    }

    if (partyModal === "add" && result.payload?._id) {
      onPartyChange(result.payload._id);
    }
    setPartyModal(null);
    setPartyForm(emptyPartyForm);
  };

  const handleUsernameField = (event) => {
    const { name, value } = event.target;
    setUsernameForm((prev) => ({ ...prev, [name]: value }));
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

    const result =
      userModal === "edit"
        ? await dispatch(
            updateSettlementUsername({
              partyId: selectedPartyId,
              usernameId: selectedUserId,
              username,
              partnershipPercentage: partnership.value,
            }),
          )
        : await dispatch(
            createSettlementUsername({
              partyId: selectedPartyId,
              username,
              partnershipPercentage: partnership.value,
            }),
          );

    const ok =
      userModal === "edit"
        ? updateSettlementUsername.fulfilled.match(result)
        : createSettlementUsername.fulfilled.match(result);
    if (!ok) {
      setUsernameFormError(result.payload || "Could not save user");
      return;
    }

    if (userModal === "add" && result.payload?._id && selectedParty) {
      const created = result.payload;
      setSelectedUserId(created._id);
      setLedgerForm((prev) => ({ ...prev, amount: "" }));
      setLedgerError("");
      setLedgerPage(1);
      setLedgerParty({ _id: selectedParty._id, partyname: selectedParty.partyname });
      setLedgerUser({ _id: created._id, username: created.username });
      setLedgerReload((value) => value + 1);
    } else if (ledgerUser && selectedUserId === ledgerUser._id) {
      setLedgerUser({ _id: selectedUserId, username });
    }
    setUserModal(null);
    setUsernameForm(emptyUsernameForm);
  };

  const handleEntrySubmit = async (event) => {
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

    setLedgerForm((prev) => ({ amount: "", transactionType: prev.transactionType }));
    setLedgerSummary(result.payload.summary || null);
    if (ledgerPage !== 1) setLedgerPage(1);
    setLedgerReload((value) => value + 1);
    amountRef.current?.focus();
  };

  return (
    <div className="z-[99] box-border flex h-[calc(100dvh-var(--app-mobile-header-height)-var(--app-bottom-nav-height)-1.25rem)] flex-col py-1.5 sm:h-[calc(100dvh-var(--app-desktop-header-height)-2.25rem)]">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#424687] to-[#353a6e] px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Settlement entry</h2>
            <p className="text-[11px] text-indigo-100">Party, username, type, amount</p>
          </div>
          <button
            type="button"
            onClick={openAddParty}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-[#424687] shadow-sm hover:bg-indigo-50"
          >
            <FaPlus size={10} />
            Add party
          </button>
        </div>

        <form onSubmit={handleEntrySubmit} className="shrink-0 border-b border-slate-100 px-3 py-2.5">
          <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.25fr)_auto_auto]">
            <label className="block min-w-0">
              <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>1 · Party</span>
                <button
                  type="button"
                  onClick={openEditParty}
                  disabled={!selectedParty}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#424687] disabled:cursor-not-allowed disabled:opacity-30"
                  title="Edit party"
                >
                  <FaEdit size={10} />
                  Edit
                </button>
              </span>
              <select
                value={selectedPartyId}
                onChange={(event) => onPartyChange(event.target.value)}
                className={`${selectClass} w-full`}
              >
                <option value="">Select party</option>
                {parties.map((party) => (
                  <option key={party._id} value={party._id}>
                    {party.partyname}
                  </option>
                ))}
              </select>
            </label>

            <div className="min-w-0">
              <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span>2 · Username</span>
                <button
                  type="button"
                  onClick={openEditUser}
                  disabled={!selectedUser}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#424687] disabled:cursor-not-allowed disabled:opacity-30"
                  title="Edit username"
                >
                  <FaEdit size={10} />
                  Edit
                </button>
              </span>
              <div className="flex gap-1.5">
                <select
                  value={selectedUserId}
                  onChange={(event) => onUserChange(event.target.value)}
                  disabled={!selectedParty}
                  className={`${selectClass} min-w-0 flex-1 disabled:bg-slate-50 disabled:text-slate-400`}
                >
                  <option value="">
                    {!selectedParty
                      ? "Select party first"
                      : usernames.length === 0
                        ? "No username yet"
                        : "Select username"}
                  </option>
                  {usernames.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.username}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openAddUser}
                  disabled={!selectedParty}
                  className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                    selectedParty && usernames.length === 0
                      ? "bg-[#424687] text-white hover:bg-[#353a6e]"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-[#424687]/40 hover:text-[#424687]"
                  }`}
                  title={selectedParty ? `Add username for ${selectedParty.partyname}` : "Select a party first"}
                >
                  <FaPlus size={10} />
                  Add
                </button>
              </div>
            </div>

            <div>
              <span className="mb-1 block text-[11px] font-medium text-slate-500">3 · Type</span>
              <div className="inline-flex h-8 rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setLedgerForm((prev) => ({ ...prev, transactionType: "deposit" }))}
                  className={`rounded-md px-3 text-xs font-semibold transition ${
                    isDeposit ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600"
                  }`}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerForm((prev) => ({ ...prev, transactionType: "withdrawal" }))}
                  className={`rounded-md px-3 text-xs font-semibold transition ${
                    !isDeposit ? "bg-red-600 text-white shadow-sm" : "text-slate-600"
                  }`}
                >
                  Withdraw
                </button>
              </div>
            </div>

            <div>
              <span className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium text-slate-500">
                <span>4 · Amount</span>
                {appliedPercent && (
                  <span className="font-semibold text-[#424687]">
                    {appliedPercent.partnershipPercentage}%{" "}
                    {appliedPercent.percentageSource === "username" ? "username" : "party"}
                  </span>
                )}
              </span>
              <div className="flex h-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#424687]/30">
                <span className="flex items-center pl-2.5 text-xs font-medium text-slate-400">₹</span>
                <input
                  ref={amountRef}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={ledgerForm.amount}
                  onChange={(event) =>
                    setLedgerForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="Amount"
                  aria-label="Amount"
                  disabled={!selectedUser}
                  className="w-28 border-0 bg-transparent px-2 text-sm text-slate-900 outline-none [appearance:textfield] placeholder:text-slate-400 disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="submit"
                  disabled={!selectedUser || !appliedPercent}
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
          {(ledgerError || (selectedUser && !appliedPercent) || (error && !partyModal && !userModal)) && (
            <p className="mt-1 text-xs text-red-600">
              {ledgerError ||
                error ||
                "Partnership % is missing, so a new entry cannot be saved."}
            </p>
          )}
        </form>

        {selectedUser ? (
          <>
            <div className="grid shrink-0 grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="border-t-2 border-emerald-500 px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                  Deposit
                </p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {rupee(ledgerSummary?.deposit?.totalAmount)}
                </p>
              </div>
              <div className="border-t-2 border-red-400 px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                  Withdrawal
                </p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {rupee(ledgerSummary?.withdrawal?.totalAmount)}
                </p>
              </div>
              <div className="border-t-2 border-[#424687] px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#424687]">
                  Closing
                </p>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    closing < 0 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {rupee(ledgerSummary?.closingBalance)}
                </p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {ledgerLoading && (
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
                    {ledgerRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                          No entries yet. Choose Deposit or Withdraw, type the amount, and save.
                        </td>
                      </tr>
                    ) : (
                      ledgerRows.map((row, index) => {
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
                                  deposit
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-600"
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

              {ledgerPagination && ledgerPagination.totalRecords > 0 && (
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-1.5">
                  <p className="text-xs text-slate-600">
                    {ledgerStart + 1}–
                    {Math.min(ledgerStart + ledgerRows.length, ledgerPagination.totalRecords)} of{" "}
                    {ledgerPagination.totalRecords}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      Show
                      <select
                        value={ledgerPagination.limit}
                        onChange={(event) => {
                          setLedgerLimit(Number(event.target.value));
                          setLedgerPage(1);
                        }}
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
                      disabled={!ledgerPagination.hasPreviousPage}
                      onClick={() => setLedgerPage((page) => Math.max(1, page - 1))}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-600">
                      {ledgerPagination.currentPage} / {ledgerPagination.totalPages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={!ledgerPagination.hasNextPage}
                      onClick={() => setLedgerPage((page) => page + 1)}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : selectedParty ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-end justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{selectedParty.partyname}</p>
                <p className="text-[11px] text-slate-500">
                  {selectedParty.contactNo || "No mobile"}
                  {" · "}
                  {formatPercent(selectedParty.partnershipPercentage)} partnership
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="mb-0.5 block text-[11px] font-medium text-slate-500">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[11px] font-medium text-slate-500">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                  />
                </label>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="border-t-2 border-emerald-500 px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Deposit</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {rupee(partySettlement?.summary?.deposit?.totalAmount)}
                </p>
              </div>
              <div className="border-t-2 border-red-400 px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Withdrawal</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {rupee(partySettlement?.summary?.withdrawal?.totalAmount)}
                </p>
              </div>
              <div className="border-t-2 border-[#424687] px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#424687]">Closing</p>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    Number(partySettlement?.summary?.closingBalance) < 0
                      ? "text-red-600"
                      : "text-slate-900"
                  }`}
                >
                  {rupee(partySettlement?.summary?.closingBalance)}
                </p>
              </div>
            </div>
            {partySettlementLoading && (
              <p className="border-b border-slate-100 bg-slate-50 py-1 text-center text-xs text-[#424687]">
                Loading…
              </p>
            )}
            {partySettlementError && (
              <p className="border-b border-red-100 bg-red-50 py-1 text-center text-xs text-red-600">
                {partySettlementError}
              </p>
            )}
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#424687] text-white">
                    <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Type</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold">Amount</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold">Share</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(partySettlement?.usernames || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        {partySettlementLoading
                          ? "Loading party settlement…"
                          : "No entries in this date range."}
                      </td>
                    </tr>
                  ) : (
                    partySettlement.usernames.map((item) => (
                      <React.Fragment key={item._id}>
                        <tr
                          onClick={() => onUserChange(item._id)}
                          className="cursor-pointer border-b border-indigo-100 bg-indigo-50/70 hover:bg-indigo-50"
                        >
                          <td colSpan={5} className="px-3 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-slate-900">
                                {item.username}
                                <span className="ml-2 text-xs font-medium text-slate-500">
                                  {formatPercent(item.partnershipPercentage)}
                                </span>
                              </p>
                              <p className="text-xs tabular-nums text-slate-600">
                                Deposit{" "}
                                <span className="font-semibold text-emerald-700">
                                  {rupee(item.summary?.deposit?.totalAmount)}
                                </span>
                                <span className="mx-2 text-slate-300">|</span>
                                Withdrawal{" "}
                                <span className="font-semibold text-red-600">
                                  {rupee(item.summary?.withdrawal?.totalAmount)}
                                </span>
                                <span className="mx-2 text-slate-300">|</span>
                                Closing{" "}
                                <span
                                  className={`font-semibold ${
                                    Number(item.summary?.closingBalance) < 0
                                      ? "text-red-600"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {rupee(item.summary?.closingBalance)}
                                </span>
                              </p>
                            </div>
                          </td>
                        </tr>
                        {(item.entries || []).map((entry) => {
                          const deposit = entry.transactionType === "deposit";
                          return (
                            <tr key={entry._id} className="border-b border-slate-100">
                              <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                                {formatEntryDate(entry.createdAt)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    deposit
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-red-50 text-red-600"
                                  }`}
                                >
                                  {deposit ? "Deposit" : "Withdraw"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                                {rupee(entry.amount)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">
                                {rupee(entry.percentageAmount)}
                                <span className="ml-1 text-[11px] text-slate-400">
                                  {formatPercent(entry.partnershipPercentage)}
                                </span>
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-semibold tabular-nums ${
                                  deposit ? "text-emerald-700" : "text-red-600"
                                }`}
                              >
                                {rupee(entry.totalAmount)}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(partySettlement?.usernames || []).length > 0 && (
              <p className="shrink-0 border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                Click a username to open that user’s full entry list.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-medium text-slate-700">
                {loading ? "Loading parties…" : "Select a party"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                The party’s entries for the selected dates show here. Choose a username for that user’s full list.
              </p>
            </div>
          </div>
        )}
      </section>

      {partyModal && (
        <Modal
          title={partyModal === "edit" ? "Edit party" : "Add party"}
          subtitle="A party is added only when you need a new one"
          onClose={() => setPartyModal(null)}
        >
          <form onSubmit={handlePartySubmit} className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Party name*</span>
              <input
                ref={partyNameRef}
                name="partyname"
                value={partyForm.partyname}
                onChange={handlePartyField}
                placeholder="Party name"
                className={fieldClass}
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Mobile</span>
              <input
                name="contactNo"
                value={partyForm.contactNo}
                onChange={handlePartyField}
                placeholder="10 digits, optional"
                inputMode="numeric"
                maxLength={10}
                className={fieldClass}
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Partnership %*</span>
              <input
                type="number"
                name="partnershipPercentage"
                value={partyForm.partnershipPercentage}
                onChange={handlePartyField}
                placeholder="0"
                min="0"
                step="any"
                className={fieldClass}
              />
            </label>
            {partyFormError && <p className="text-sm text-red-600">{partyFormError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPartyModal(null)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-[#424687] px-4 text-sm font-semibold text-white hover:bg-[#353a6e]"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {userModal && selectedParty && (
        <Modal
          title={userModal === "edit" ? "Edit username" : "Add username"}
          subtitle={selectedParty.partyname}
          onClose={() => setUserModal(null)}
        >
          <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Username*</span>
              <input
                ref={usernameRef}
                name="username"
                value={usernameForm.username}
                onChange={handleUsernameField}
                placeholder="Username"
                className={fieldClass}
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Share %</span>
              <input
                type="number"
                name="partnershipPercentage"
                value={usernameForm.partnershipPercentage}
                onChange={handleUsernameField}
                placeholder="Optional. Blank uses the party %"
                min="0"
                step="any"
                className={fieldClass}
              />
            </label>
            {usernameFormError && <p className="text-sm text-red-600">{usernameFormError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUserModal(null)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-lg bg-[#424687] px-4 text-sm font-semibold text-white hover:bg-[#353a6e]"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Settlement;
