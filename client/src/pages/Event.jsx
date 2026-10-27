import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEdit, FaPlus } from "react-icons/fa";
import { createEvent, fetchEvents, updateEvent } from "../redux/eventSlice";
import { createMarket, fetchMarkets, updateMarket } from "../redux/marketSlice";

const BOOK_TYPES = ["Bookmaker", "Fancy"];

const todayInputDate = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const blankForm = () => ({
  team1: "",
  team2: "",
  date: todayInputDate(),
});

const blankMarket = () => ({
  booktype: "Bookmaker",
  marketname: "",
});

const toApiDate = (value) => {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const toInputDate = (value) => {
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const Event = () => {
  const dispatch = useDispatch();
  const { events, loading, error, pagination } = useSelector((state) => state.event);
  const {
    markets,
    loading: marketLoading,
    error: marketError,
  } = useSelector((state) => state.market);
  const [formData, setFormData] = useState(blankForm);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [marketForm, setMarketForm] = useState(blankMarket);
  const [marketFormError, setMarketFormError] = useState("");
  const [marketEditId, setMarketEditId] = useState(null);
  const [marketSaving, setMarketSaving] = useState(false);
  const [marketPage, setMarketPage] = useState(1);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketSearchInput, setMarketSearchInput] = useState("");
  const marketLimit = 20;
  const [formError, setFormError] = useState("");
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const fieldClass =
    "h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 text-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#424687]/40 lg:h-8";

  useEffect(() => {
    dispatch(fetchEvents({ page: currentPage, limit: entriesPerPage, search }));
  }, [dispatch, currentPage, entriesPerPage, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedEvent?._id) return;
    dispatch(
      fetchMarkets({
        eventId: selectedEvent._id,
        page: marketPage,
        limit: marketLimit,
        search: marketSearch,
      })
    );
  }, [dispatch, selectedEvent?._id, marketPage, marketLimit, marketSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMarketSearch(marketSearchInput.trim());
      setMarketPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [marketSearchInput]);

  useEffect(() => {
    setSelectedEvent((current) => {
      if (!current) return current;
      const fresh = events.find((item) => item._id === current._id);
      if (!fresh || (fresh.eventname === current.eventname && fresh.date === current.date)) {
        return current;
      }
      return fresh;
    });
  }, [events]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const resetForm = () => {
    setFormData(blankForm());
    setEditId(null);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const team1 = formData.team1.trim();
    const team2 = formData.team2.trim();
    const date = toApiDate(formData.date);

    if (!date) {
      setFormError("Date is required");
      return;
    }
    if (!team1) {
      setFormError("Team 1 is required");
      return;
    }
    if (!team2) {
      setFormError("Team 2 is required");
      return;
    }

    const payload = { date, team1, team2 };
    setSaving(true);
    const action = editId
      ? updateEvent({ id: editId, ...payload })
      : createEvent(payload);
    const result = await dispatch(action);
    setSaving(false);

    if (result.meta.requestStatus !== "fulfilled") return;

    const wasEdit = Boolean(editId);
    resetForm();
    if (!wasEdit) setCurrentPage(1);
    dispatch(
      fetchEvents({
        page: wasEdit ? currentPage : 1,
        limit: entriesPerPage,
        search,
      })
    );
  };

  const handleEdit = (item) => {
    setFormData({
      date: toInputDate(item.date),
      team1: item.team1 || "",
      team2: item.team2 || "",
    });
    setEditId(item._id);
    setFormError("");
  };

  const openEvent = (item) => {
    setSelectedEvent(item);
    setMarketForm(blankMarket());
    setMarketEditId(null);
    setMarketFormError("");
    setMarketSearchInput("");
    setMarketSearch("");
    setMarketPage(1);
  };

  const eventLabel = (item) => item?.eventname || `${item?.team1 || ""} vs ${item?.team2 || ""}`;

  const resetMarketForm = () => {
    setMarketForm(blankMarket());
    setMarketEditId(null);
    setMarketFormError("");
  };

  const handleMarketChange = (event) => {
    const { name, value } = event.target;
    setMarketForm((prev) => ({ ...prev, [name]: value }));
    setMarketFormError("");
  };

  const handleMarketSubmit = async (event) => {
    event.preventDefault();
    if (!selectedEvent?._id) return;
    const marketname = marketForm.marketname.trim();
    const booktype = BOOK_TYPES.includes(marketForm.booktype) ? marketForm.booktype : "";
    if (!booktype) {
      setMarketFormError("Book type must be Bookmaker or Fancy");
      return;
    }
    if (!marketname) {
      setMarketFormError("Market name is required");
      return;
    }

    const payload = { eventId: selectedEvent._id, booktype, marketname };
    setMarketSaving(true);
    const action = marketEditId
      ? updateMarket({ ...payload, id: marketEditId })
      : createMarket(payload);
    const result = await dispatch(action);
    setMarketSaving(false);
    if (result.meta.requestStatus !== "fulfilled") return;

    const stayOnPage = Boolean(marketEditId);
    resetMarketForm();
    if (!stayOnPage) setMarketPage(1);
    dispatch(
      fetchMarkets({
        eventId: selectedEvent._id,
        page: stayOnPage ? marketPage : 1,
        limit: marketLimit,
        search: marketSearch,
      })
    );
  };

  const handleMarketEdit = (item) => {
    setMarketForm({
      booktype: item.booktype || "Bookmaker",
      marketname: item.marketname || "",
    });
    setMarketEditId(item._id);
    setMarketFormError("");
  };

  return (
    <div className="z-[99] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:min-h-[calc(100vh-5rem)] sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        <div className="w-full rounded-xl border bg-white/95 px-2.5 py-2.5 shadow-sm sm:px-4 sm:py-3">
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-900">
              {editId ? "Update event" : "Add event"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {formData.team1.trim() && formData.team2.trim()
                ? `${formData.team1.trim()} vs ${formData.team2.trim()}`
                : "Team 1, team 2, date"}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-slate-100 pt-3">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                  Team 1*
                </label>
                <input
                  type="text"
                  name="team1"
                  value={formData.team1}
                  onChange={handleInputChange}
                  placeholder="Team 1"
                  className={fieldClass}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                  Team 2*
                </label>
                <input
                  type="text"
                  name="team2"
                  value={formData.team2}
                  onChange={handleInputChange}
                  placeholder="Team 2"
                  className={fieldClass}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                  Date*
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={fieldClass}
                />
              </div>
            </div>
            {(formError || error) && (
              <p className="text-xs text-red-600">{formError || error}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#424687] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:opacity-60 lg:h-8 lg:text-xs"
              >
                <span className="inline-flex items-center gap-1.5">
                  {editId ? <FaEdit size={13} /> : <FaPlus size={13} />}
                  {editId ? "Update" : "Submit"}
                </span>
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 lg:h-8 lg:text-xs"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md sm:min-h-[min(70vh,calc(100vh-12rem))]">
          <div className="border-b border-slate-100 px-3 py-2 sm:px-4">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search event or team…"
              className={fieldClass}
            />
          </div>
          {loading && (
            <p className="border-b border-slate-100 bg-slate-50 py-2 text-center text-sm text-[#424687]">
              Loading…
            </p>
          )}
          <div className="overflow-auto sm:min-h-0 sm:flex-1">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-[#424687] text-white">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Event
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Date
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">
                      {loading ? "Loading…" : "No events found."}
                    </td>
                  </tr>
                ) : (
                  events.map((item, index) => (
                    <React.Fragment key={item._id}>
                    <tr
                      className={`border-b border-slate-100/80 transition-colors hover:bg-indigo-50/40 ${
                        selectedEvent?._id === item._id
                          ? "bg-indigo-50"
                          : index % 2 === 0
                            ? "bg-slate-50/50"
                            : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-2.5 font-medium text-slate-900">{eventLabel(item)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-600">
                        {item.date}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEvent(item)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-[#424687] transition hover:bg-[#424687]/10"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                    {selectedEvent?._id === item._id && (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={3} className="px-3 py-3">
                          <form
                            onSubmit={handleMarketSubmit}
                            className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]"
                          >
                            <div className="min-w-0">
                              <label className="mb-0.5 block text-[11px] font-medium text-slate-600">
                                Book type*
                              </label>
                              <select
                                name="booktype"
                                value={marketForm.booktype}
                                onChange={handleMarketChange}
                                className={fieldClass}
                              >
                                {BOOK_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="min-w-0">
                              <label className="mb-0.5 block text-[11px] font-medium text-slate-600">
                                Market name*
                              </label>
                              <input
                                type="text"
                                name="marketname"
                                value={marketForm.marketname}
                                onChange={handleMarketChange}
                                placeholder="Market name"
                                className={fieldClass}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={marketSaving}
                              className="inline-flex h-10 items-center justify-center rounded-md bg-[#424687] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:opacity-60 lg:h-8 lg:text-xs"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {marketEditId ? <FaEdit size={13} /> : <FaPlus size={13} />}
                                {marketEditId ? "Update" : "Add"}
                              </span>
                            </button>
                          </form>
                          {(marketFormError || marketError) && (
                            <p className="mt-2 text-xs text-red-600">{marketFormError || marketError}</p>
                          )}
                          {marketLoading && (
                            <p className="mt-2 text-xs text-[#424687]">Loading…</p>
                          )}
                          {markets.length > 0 && (
                            <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                              {markets.map((market) => (
                                <li
                                  key={market._id}
                                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                >
                                  <span className="min-w-0 truncate font-medium text-slate-900">
                                    {market.marketname}
                                  </span>
                                  <span className="shrink-0 text-xs text-slate-500">{market.booktype}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleMarketEdit(market)}
                                    className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#424687] hover:bg-[#424687]/10"
                                  >
                                    Update
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalRecords > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                Showing{" "}
                {pagination.totalRecords
                  ? (pagination.currentPage - 1) * pagination.limit + 1
                  : 0}{" "}
                to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of{" "}
                {pagination.totalRecords} events
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600">Show</label>
                  <select
                    value={entriesPerPage}
                    onChange={(event) => {
                      setEntriesPerPage(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-md border border-slate-300 bg-white px-2 text-xs lg:h-8"
                  >
                    {[10, 20, 50].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="flex items-center text-xs text-slate-600">
                    Page {pagination.currentPage} of {pagination.totalPages || 1}
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
        </div>
      </div>
    </div>
  );
};

export default Event;
