import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEdit } from "react-icons/fa";
import { FiArrowLeft, FiEye } from "react-icons/fi";
import {
  createInterest,
  fetchInterests,
  fetchPartyOptions,
  updateInterest,
} from "../redux/interestSlice";

const todayInputDate = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const blankForm = () => ({
  party: "",
  amount: "",
  interestRate: "",
  interestType: "simple",
  months: "",
  date: todayInputDate(),
});

const money = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const showDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const typeLabel = (value) => (value === "advance" ? "Advance" : "Simple");

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const closeForDate = (loan, isoDate) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const days = (loan.schedule || []).flatMap((row) => row.days || []);
  const through = days.filter((day) => day.date <= isoDate);
  if (!through.length) return null;
  const accrued = Number(through[through.length - 1].accruedInterest || 0);
  const principalBefore = (loan.receipts || []).reduce((sum, item) => (
    item.date < isoDate ? sum + Number(item.principal || 0) : sum
  ), 0);
  const outstanding = roundMoney(Math.max(0, Number(loan.amount) - principalBefore));
  if (loan.interestType === "advance") return outstanding;
  const interestPaid = (loan.receipts || []).reduce((sum, item) => (
    item.date < isoDate ? sum + Number(item.interest || 0) : sum
  ), 0);
  return roundMoney(outstanding + Math.max(0, roundMoney(accrued - interestPaid)));
};

const fieldClass =
  "!h-8 !min-h-0 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/30";

const Interest = () => {
  const dispatch = useDispatch();
  const { interests, pagination, partyOptions, loading, error } = useSelector((state) => state.interest);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [interestType, setInterestType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loan, setLoan] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [receipt, setReceipt] = useState({ amount: "", date: todayInputDate() });
  const [editingReceiptDate, setEditingReceiptDate] = useState("");

  useEffect(() => {
    dispatch(fetchPartyOptions());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const params = { page, limit: 20, sortBy: "date", sortOrder: "desc" };
    if (search) params.search = search;
    if (interestType) params.interestType = interestType;
    if (status) params.status = status;
    dispatch(fetchInterests(params));
  }, [dispatch, page, search, interestType, status]);

  const partyName = (item) => item?.party?.partyname || "Party";

  const partyChoices = (selectedId) => {
    const list = [...partyOptions];
    if (selectedId && loan?.party?._id === selectedId && !list.some((item) => item._id === selectedId)) {
      list.unshift({ _id: loan.party._id, partyname: loan.party.partyname });
    }
    return list;
  };

  const onFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const reloadList = () => {
    const params = { page, limit: 20, sortBy: "date", sortOrder: "desc" };
    if (search) params.search = search;
    if (interestType) params.interestType = interestType;
    if (status) params.status = status;
    dispatch(fetchInterests(params));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    const result = await dispatch(createInterest({
      party: form.party,
      amount: Number(form.amount),
      interestRate: Number(form.interestRate),
      interestType: form.interestType,
      months: Number(form.months),
      date: form.date,
    }));
    setSaving(false);
    if (createInterest.rejected.match(result)) {
      setFormError(result.payload || "Could not create interest");
      return;
    }
    setForm(blankForm());
    if (page !== 1) setPage(1);
    else reloadList();
  };

  const saveLoan = async (body) => {
    setDetailError("");
    setSaving(true);
    const result = await dispatch(updateInterest({ id: loan._id, ...body }));
    setSaving(false);
    if (updateInterest.rejected.match(result)) {
      setDetailError(result.payload || "Could not update interest");
      return false;
    }
    setLoan(result.payload);
    reloadList();
    return true;
  };

  const handleTerms = async (event) => {
    event.preventDefault();
    const ok = await saveLoan({
      party: form.party,
      amount: Number(form.amount),
      interestRate: Number(form.interestRate),
      interestType: form.interestType,
      months: Number(form.months),
      date: form.date,
    });
    if (ok) setEditOpen(false);
  };

  const resetReceiptForm = () => {
    setEditingReceiptDate("");
    setReceipt({ amount: "", date: todayInputDate() });
  };

  const handleReceipt = async (event) => {
    event.preventDefault();
    const ok = await saveLoan({
      receivedAmount: Number(receipt.amount),
      receivedDate: editingReceiptDate || receipt.date,
    });
    if (ok) resetReceiptForm();
  };

  const startEditReceipt = (item) => {
    setEditingReceiptDate(item.date);
    setReceipt({ amount: String(item.amount ?? ""), date: item.date });
    setDetailError("");
  };

  const toggleReceived = async (month) => {
    const schedule = loan.schedule.map((row) => ({
      month: row.month,
      interestReceived: row.month === month ? !row.interestReceived : row.interestReceived,
    }));
    await saveLoan({ schedule });
  };

  const openEdit = () => {
    setForm({
      party: loan.party?._id || "",
      amount: String(loan.amount ?? ""),
      interestRate: String(loan.interestRate ?? ""),
      interestType: loan.interestType || "simple",
      months: String(loan.months ?? ""),
      date: loan.date || todayInputDate(),
    });
    setEditOpen(true);
    setDetailError("");
  };

  const openLoan = (item) => {
    setLoan(item);
    setEditOpen(false);
    setDetailError("");
    resetReceiptForm();
  };

  return (
    <div className="z-[99] -mx-3 flex min-h-[calc(100dvh-var(--app-mobile-header-height)-var(--app-bottom-nav-height)-1.25rem)] flex-col bg-white sm:-mx-4 sm:min-h-[calc(100dvh-var(--app-desktop-header-height))] lg:-mb-8">
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-sm font-bold text-slate-900">Interest</h1>
        {!loan && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search party"
              aria-label="Search party"
              className={`${fieldClass} sm:w-44`}
            />
            <select
              value={interestType}
              onChange={(event) => {
                setInterestType(event.target.value);
                setPage(1);
              }}
              aria-label="Interest type"
              className={`${fieldClass} sm:w-32`}
            >
              <option value="">All types</option>
              <option value="simple">Simple</option>
              <option value="advance">Advance</option>
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Status"
              className={`${fieldClass} sm:w-28`}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}
      </div>

      {loan ? (
        <LoanDetail
          loan={loan}
          form={form}
          editOpen={editOpen}
          saving={saving}
          detailError={detailError}
          receipt={receipt}
          editingReceiptDate={editingReceiptDate}
          parties={partyChoices(form.party)}
          onBack={() => setLoan(null)}
          onEdit={openEdit}
          onCancelEdit={() => setEditOpen(false)}
          onFormChange={onFormChange}
          onTerms={handleTerms}
          onReceiptChange={(event) => {
            const { name, value } = event.target;
            setReceipt((prev) => ({ ...prev, [name]: value }));
          }}
          onReceipt={handleReceipt}
          onEditReceipt={startEditReceipt}
          onCancelReceiptEdit={resetReceiptForm}
          onToggleReceived={toggleReceived}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
            <LoanForm
              form={form}
              parties={partyChoices(form.party)}
              saving={saving}
              errorText={formError}
              submitLabel="Add"
              onChange={onFormChange}
              onSubmit={handleCreate}
              onCancel={() => {
                setForm(blankForm());
                setFormError("");
              }}
            />
          {loading && <p className="border-b border-slate-100 py-2 text-center text-sm text-[#424687]">Loading…</p>}
          {error && <p className="border-b border-red-100 bg-red-50 py-2 text-center text-sm text-red-600">{error}</p>}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-[#353a6e] to-[#424687] text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                  <th className="px-3 py-2.5">Party</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5 text-right">Rate</th>
                  <th className="px-3 py-2.5 text-right">Months</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Principal</th>
                  <th className="px-3 py-2.5 text-right">Close amount</th>
                  <th className="px-3 py-2.5 text-right">Preview</th>
                </tr>
              </thead>
              <tbody>
                {interests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                      {loading ? "Loading…" : "No interest loans yet."}
                    </td>
                  </tr>
                ) : (
                  interests.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => openLoan(item)}
                      className="cursor-pointer border-b border-slate-100 hover:bg-indigo-50/40"
                    >
                      <td className="px-3 py-2.5 font-medium text-slate-900">{partyName(item)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{showDate(item.date)}</td>
                      <td className="px-3 py-2.5 text-slate-700">{typeLabel(item.interestType)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(item.amount)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{item.interestRate}%</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{item.months}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={item.status} />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(item.principalBalance)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-[#424687]">
                        {money(item.closeAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openLoan(item);
                          }}
                          title="Preview"
                          aria-label="Preview"
                          className="inline-flex !h-7 !w-7 !min-h-0 items-center justify-center rounded-md p-0 text-[#424687] hover:bg-[#424687]/10"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalRecords > 0 && (
            <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <span>
                {pagination.totalRecords} loan{pagination.totalRecords === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="inline-flex !h-8 items-center rounded-md bg-[#424687] px-2.5 font-semibold text-white">
                  {pagination.currentPage} / {pagination.totalPages || 1}
                </span>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((value) => value + 1)}
                  className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusPill = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      status === "closed" ? "bg-slate-200 text-slate-600" : "bg-emerald-50 text-emerald-700"
    }`}
  >
    {status === "closed" ? "Closed" : "Open"}
  </span>
);

const LoanForm = ({ form, parties, saving, errorText, submitLabel, onChange, onSubmit, onCancel }) => (
  <form onSubmit={onSubmit} className="grid grid-cols-2 items-end gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:flex sm:flex-wrap">
    <label className="col-span-2 min-w-0 sm:w-52">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">Party</span>
      <select name="party" value={form.party} onChange={onChange} required className={fieldClass}>
        <option value="">Select party</option>
        {parties.map((party) => (
          <option key={party._id} value={party._id}>{party.partyname}</option>
        ))}
      </select>
    </label>
    <label className="min-w-0 sm:w-32">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">Amount</span>
      <input type="number" name="amount" min="0.01" step="0.01" value={form.amount} onChange={onChange} required className={fieldClass} />
    </label>
    <label className="min-w-0 sm:w-28">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">Rate %</span>
      <input type="number" name="interestRate" step="any" value={form.interestRate} onChange={onChange} required className={fieldClass} />
    </label>
    <label className="min-w-0 sm:w-32">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">Type</span>
      <select name="interestType" value={form.interestType} onChange={onChange} className={fieldClass}>
        <option value="simple">Simple</option>
        <option value="advance">Advance</option>
      </select>
    </label>
    <label className="min-w-0 sm:w-24">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">Months</span>
      <input type="number" name="months" min="1" max="120" step="1" value={form.months} onChange={onChange} required className={fieldClass} />
    </label>
    <label className="min-w-0 sm:w-40">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">Start date</span>
      <input type="date" name="date" value={form.date} onChange={onChange} required className={fieldClass} />
    </label>
    <div className="col-span-2 flex items-center gap-2">
      <button type="submit" disabled={saving} className="inline-flex !h-8 !min-h-0 items-center rounded-md bg-[#424687] px-3 text-xs font-semibold text-white disabled:opacity-60">
        {saving ? "Saving…" : submitLabel}
      </button>
      <button type="button" onClick={onCancel} className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
        Cancel
      </button>
    </div>
    {errorText && <p className="col-span-2 text-xs text-red-600">{errorText}</p>}
  </form>
);

const Stat = ({ label, value, accent = "text-slate-900" }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-1 text-sm font-bold tabular-nums ${accent}`}>{value}</p>
  </div>
);

const LoanDetail = ({
  loan,
  form,
  editOpen,
  saving,
  detailError,
  receipt,
  editingReceiptDate,
  parties,
  onBack,
  onEdit,
  onCancelEdit,
  onFormChange,
  onTerms,
  onReceiptChange,
  onReceipt,
  onEditReceipt,
  onCancelReceiptEdit,
  onToggleReceived,
}) => {
  const calc = loan.calculation || {};
  const closeOnDate = loan.status === "closed" && !editingReceiptDate
    ? null
    : closeForDate(loan, receipt.date);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/60">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="inline-flex !h-8 !w-8 !min-h-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-bold text-slate-900">{loan.party?.partyname || "Party"}</p>
              <StatusPill status={loan.status} />
            </div>
            <p className="text-xs text-slate-500">
              {showDate(loan.date)} · {typeLabel(loan.interestType)} · {loan.interestRate}% · {loan.months} months
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex !h-8 !min-h-0 items-center gap-1.5 rounded-md bg-[#424687] px-3 text-xs font-semibold text-white hover:bg-[#353a6e]"
        >
          <FaEdit size={11} />
          Edit
        </button>
      </div>
      {editOpen && (
        <LoanForm
          form={form}
          parties={parties}
          saving={saving}
          errorText={detailError}
          submitLabel="Update"
          onChange={onFormChange}
          onSubmit={onTerms}
          onCancel={onCancelEdit}
        />
      )}
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Stat label="Amount" value={money(loan.amount)} />
          <Stat label="Disbursed" value={money(calc.disbursedAmount)} />
          <Stat label="Monthly interest" value={money(calc.monthlyInterest)} />
          <Stat label="Principal left" value={money(loan.principalBalance)} />
          <Stat label="Close amount" value={money(loan.closeAmount)} accent="text-[#424687]" />
        </div>

        <section className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#424687]">Receipt</p>
          </div>
          <form onSubmit={onReceipt} className="flex flex-wrap items-end gap-2 px-3 py-2.5">
            <label className="w-36">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Amount</span>
              <input type="number" name="amount" min="0.01" step="0.01" value={receipt.amount} onChange={onReceiptChange} required className={fieldClass} />
            </label>
            <label className="w-40">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Date</span>
              <input
                type="date"
                name="date"
                value={receipt.date}
                onChange={onReceiptChange}
                required
                disabled={Boolean(editingReceiptDate)}
                className={fieldClass}
              />
            </label>
            <button type="submit" disabled={saving || (loan.status === "closed" && !editingReceiptDate)} className="inline-flex !h-8 !min-h-0 items-center rounded-md bg-[#424687] px-3 text-xs font-semibold text-white disabled:opacity-50">
              {editingReceiptDate ? "Update" : "Save"}
            </button>
            {editingReceiptDate && (
              <button type="button" onClick={onCancelReceiptEdit} disabled={saving} className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
                Cancel
              </button>
            )}
            {closeOnDate != null && (
              <p className="basis-full text-xs text-slate-600">
                To close on this date: <span className="font-semibold tabular-nums text-[#424687]">{money(closeOnDate)}</span>
              </p>
            )}
          </form>
          {detailError && !editOpen && <p className="px-3 pb-2 text-xs text-red-600">{detailError}</p>}
          {loan.receipts?.length > 0 && (
            <table className="w-full border-collapse border-t border-slate-100 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="w-12 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {loan.receipts.map((item) => (
                  <tr key={item.date} className={`border-t border-slate-100 ${editingReceiptDate === item.date ? "bg-[#424687]/5" : ""}`}>
                    <td className="px-3 py-2.5">{showDate(item.date)}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{money(item.amount)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onEditReceipt(item)}
                        disabled={saving}
                        title="Edit receipt"
                        aria-label="Edit receipt"
                        className="inline-flex !h-7 !w-7 !min-h-0 items-center justify-center rounded-md p-0 text-[#424687] hover:bg-[#424687]/10"
                      >
                        <FaEdit size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#424687]">Schedule</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#353a6e] to-[#424687] text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                  <th className="px-3 py-2.5">Month</th>
                  <th className="px-3 py-2.5">Due</th>
                  <th className="px-3 py-2.5 text-right">Interest</th>
                  <th className="px-3 py-2.5">Received</th>
                </tr>
              </thead>
              <tbody>
                {(loan.schedule || []).map((row) => {
                  const locked = row.interestAlreadyTaken || row.closed;
                  return (
                    <tr key={row.month} className={`border-t border-slate-100 ${row.closed ? "bg-slate-50 text-slate-400" : row.amountReturned ? "bg-emerald-50/40" : "bg-white"}`}>
                      <td className="px-3 py-2.5 font-semibold text-[#424687]">
                        <span className="inline-flex items-center gap-1.5">
                          {row.month}
                          {row.amountReturned && (
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                              Returned
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{showDate(row.dueDate)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(row.interestAmount)}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={Boolean(row.interestReceived)}
                          disabled={locked || saving}
                          className="!h-4 !w-4 !min-h-0 accent-[#424687]"
                          onChange={() => onToggleReceived(row.month)}
                          aria-label={`Month ${row.month} interest received`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Interest;
