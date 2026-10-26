import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import {
  clearSettlementError,
  createSettlementParty,
  createSettlementUsername,
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

const Modal = ({ title, subtitle, onClose, children, wide = false }) => {
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
        className={`flex max-h-[min(88vh,760px)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
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
  const { parties, loading, error, pagination } = useSelector(
    (state) => state.settlement,
  );

  const partyNameRef = useRef(null);
  const usernameRef = useRef(null);

  const [partyForm, setPartyForm] = useState(emptyPartyForm);
  const [partyEditId, setPartyEditId] = useState(null);
  const [partyFormError, setPartyFormError] = useState("");
  const [usernameForm, setUsernameForm] = useState(emptyUsernameForm);
  const [usernameEditId, setUsernameEditId] = useState(null);
  const [usernameFormError, setUsernameFormError] = useState("");
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

  const resetPartyForm = () => {
    setPartyForm(emptyPartyForm);
    setPartyEditId(null);
    setPartyFormError("");
    partyNameRef.current?.focus();
  };

  const closeUsernameModal = () => {
    setSelectedPartyId(null);
    setUsernameForm(emptyUsernameForm);
    setUsernameEditId(null);
    setUsernameFormError("");
  };

  const openEditParty = (party) => {
    setPartyForm({
      partyname: party.partyname || "",
      contactNo: party.contactNo || "",
      partnershipPercentage:
        party.partnershipPercentage === null || party.partnershipPercentage === undefined
          ? ""
          : String(party.partnershipPercentage),
    });
    setPartyEditId(party._id);
    setPartyFormError("");
    dispatch(clearSettlementError());
    partyNameRef.current?.focus();
  };

  const openUsernames = (party) => {
    setUsernameForm(emptyUsernameForm);
    setUsernameEditId(null);
    setUsernameFormError("");
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

    const payload = {
      partyname,
      contactNo: partyForm.contactNo,
      partnershipPercentage: partnership.value,
    };
    const editingId = partyEditId;
    const action = editingId
      ? updateSettlementParty({ id: editingId, ...payload })
      : createSettlementParty(payload);
    const result = await dispatch(action);
    const succeeded = editingId
      ? updateSettlementParty.fulfilled.match(result)
      : createSettlementParty.fulfilled.match(result);
    if (!succeeded) return;

    resetPartyForm();
    if (!editingId) setCurrentPage(1);
    dispatch(
      fetchSettlementParties({
        page: editingId ? currentPage : 1,
        limit: entriesPerPage,
        search,
      }),
    );
  };

  const handleUsernameChange = (event) => {
    const { name, value } = event.target;
    setUsernameForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearUsernameForm = () => {
    setUsernameForm(emptyUsernameForm);
    setUsernameEditId(null);
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

    const body = {
      partyId: selectedPartyId,
      username,
      partnershipPercentage: partnership.value,
    };
    const action = usernameEditId
      ? updateSettlementUsername({ usernameId: usernameEditId, ...body })
      : createSettlementUsername(body);
    const result = await dispatch(action);
    const succeeded = usernameEditId
      ? updateSettlementUsername.fulfilled.match(result)
      : createSettlementUsername.fulfilled.match(result);
    if (succeeded) clearUsernameForm();
  };

  const handleUsernameEdit = (entry) => {
    setUsernameForm({
      username: entry.username || "",
      partnershipPercentage:
        entry.partnershipPercentage === null || entry.partnershipPercentage === undefined
          ? ""
          : String(entry.partnershipPercentage),
    });
    setUsernameEditId(entry._id);
    setUsernameFormError("");
    usernameRef.current?.focus();
  };

  const startIndex = pagination ? (pagination.currentPage - 1) * pagination.limit : 0;

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        <section className="rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:px-4">
          <h2 className="text-sm font-semibold text-slate-800">
            {partyEditId ? "Edit party" : "Add party"}
          </h2>
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
                  {partyEditId ? "Update" : "Save"}
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
                  parties.map((party, index) => (
                    <tr
                      key={party._id}
                      className={`border-b border-slate-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
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
                        <button
                          type="button"
                          onClick={() => openUsernames(party)}
                          className="mr-3 text-xs font-semibold text-[#424687] hover:underline"
                        >
                          Usernames
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditParty(party)}
                          className="text-xs font-semibold text-slate-600 hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
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
                {usernameEditId ? "Update" : "Add"}
              </button>
              {usernameEditId && (
                <button
                  type="button"
                  onClick={clearUsernameForm}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
              )}
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
                  <th className="w-16 px-3 py-2 text-right text-xs font-semibold">Edit</th>
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
                  selectedUsernames.map((entry, index) => (
                    <tr
                      key={entry._id}
                      className={`border-t border-slate-100 ${
                        usernameEditId === entry._id ? "bg-amber-50" : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-2 tabular-nums text-slate-500">{index + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{entry.username}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {formatPercent(entry.partnershipPercentage)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleUsernameEdit(entry)}
                          className="text-xs font-semibold text-[#424687] hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
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
