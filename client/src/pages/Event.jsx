import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEdit, FaPlus } from "react-icons/fa";
import { createEvent, fetchEvents, updateEvent } from "../redux/eventSlice";
import { createMarket, fetchMarkets, updateMarket } from "../redux/marketSlice";
import { createEntry, fetchEntries, updateEntry } from "../redux/entrySlice";

const selectionsFor = (booktype) => (booktype === "Fancy" ? ["Yes", "No"] : ["Back", "Lay"]);

const entryRowClass = (selection) => {
  const value = String(selection || "").toLowerCase();
  if (value === "back" || value === "yes") return "bg-blue-100";
  if (value === "lay" || value === "no") return "bg-pink-100";
  return "bg-white";
};

const blankEntry = (booktype) => ({
  team: "team1",
  stack: "",
  rate: "",
  runRate: "",
  selection: selectionsFor(booktype)[0],
});

const parseRunRate = (value) => {
  const text = String(value ?? "").trim();
  const parts = text.split("/");
  if (!text || parts.length > 2) return { error: "Use run/rate, for example 50/100" };
  const runRaw = parts[0].trim();
  const rateRaw = parts.length === 2 ? parts[1].trim() : "0";
  if (!/^\d+(\.\d+)?$/.test(runRaw) || Number(runRaw) <= 0) {
    return { error: "Run must be greater than 0" };
  }
  if (rateRaw !== "" && !/^\d+(\.\d+)?$/.test(rateRaw)) {
    return { error: "Rate must be a number" };
  }
  const rate = Number(rateRaw);
  return {
    run: Number(runRaw),
    rate: !Number.isFinite(rate) || rate <= 0 ? 100 : rate,
  };
};

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

const formatPosition = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  const formatted = Math.abs(number).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return number < 0 ? `−${formatted}` : formatted;
};

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
  const {
    entries,
    position,
    book,
    loading: entryLoading,
    error: entryError,
  } = useSelector((state) => state.entry);
  const [formData, setFormData] = useState(blankForm);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [marketForm, setMarketForm] = useState(blankMarket);
  const [marketFormError, setMarketFormError] = useState("");
  const [marketEditId, setMarketEditId] = useState(null);
  const [marketSaving, setMarketSaving] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [entryForm, setEntryForm] = useState(blankEntry());
  const [entryFormError, setEntryFormError] = useState("");
  const [entryEditId, setEntryEditId] = useState(null);
  const [entrySaving, setEntrySaving] = useState(false);
  const [marketPage, setMarketPage] = useState(1);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketSearchInput, setMarketSearchInput] = useState("");
  const marketLimit = 20;
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [bookOpen, setBookOpen] = useState(false);

  const fieldClass =
    "!h-8 !min-h-0 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#424687]/40";

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
    if (!selectedEvent?._id || !selectedMarket?._id) return;
    dispatch(fetchEntries({ eventId: selectedEvent._id, marketId: selectedMarket._id }));
  }, [dispatch, selectedEvent?._id, selectedMarket?._id]);

  useEffect(() => {
    if (!selectedEvent?._id) return undefined;
    const eventId = selectedEvent._id;
    const onPointerDown = (event) => {
      const row = event.target.closest?.("[data-event-id]");
      if (row?.getAttribute("data-event-id") === String(eventId)) return;
      setSelectedEvent(null);
      setSelectedMarket(null);
      setMarketForm(blankMarket());
      setMarketEditId(null);
      setMarketFormError("");
      setEntryEditId(null);
      setEntryFormError("");
      setBookOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [selectedEvent?._id]);

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
    setFormOpen(false);
    if (!wasEdit) setCurrentPage(1);
    dispatch(
      fetchEvents({
        page: wasEdit ? currentPage : 1,
        limit: entriesPerPage,
        search,
      })
    );
  };

  const openAddForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setFormOpen(true);
    setFormData({
      date: toInputDate(item.date),
      team1: item.team1 || "",
      team2: item.team2 || "",
    });
    setEditId(item._id);
    setFormError("");
  };

  const openEvent = (item) => {
    if (selectedEvent?._id === item._id) {
      setSelectedEvent(null);
      setSelectedMarket(null);
      setMarketForm(blankMarket());
      setMarketEditId(null);
      setMarketFormError("");
      setEntryEditId(null);
      setEntryFormError("");
      setBookOpen(false);
      return;
    }
    setSelectedEvent(item);
    setSelectedMarket(null);
    setMarketForm(blankMarket());
    setMarketEditId(null);
    setMarketFormError("");
    setMarketSearchInput("");
    setMarketSearch("");
    setMarketPage(1);
    setEntryEditId(null);
    setEntryFormError("");
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

  const openMarket = (market) => {
    if (selectedMarket?._id === market._id) {
      setSelectedMarket(null);
      setEntryEditId(null);
      setEntryFormError("");
      setBookOpen(false);
      return;
    }
    setSelectedMarket(market);
    setEntryForm(blankEntry(market.booktype));
    setEntryEditId(null);
    setEntryFormError("");
    setBookOpen(false);
  };

  const handleEntryChange = (event) => {
    const { name, value } = event.target;
    setEntryForm((prev) => ({ ...prev, [name]: value }));
    setEntryFormError("");
  };

  const handleEntrySubmit = async (event) => {
    event.preventDefault();
    if (!selectedEvent?._id || !selectedMarket?._id) return;
    const allowed = selectionsFor(selectedMarket.booktype);
    const isFancy = selectedMarket.booktype === "Fancy";
    const team = isFancy ? "team1" : entryForm.team === "team2" ? "team2" : "team1";
    const selection = allowed.includes(entryForm.selection) ? entryForm.selection : "";
    const stack = Number(entryForm.stack);
    if (!selection) {
      setEntryFormError(
        selectedMarket.booktype === "Fancy"
          ? "Fancy market must be Yes or No"
          : "Bookmaker market must be Back or Lay"
      );
      return;
    }
    if (!Number.isFinite(stack) || stack <= 0) {
      setEntryFormError("Stack must be greater than 0");
      return;
    }
    let rate = Number(entryForm.rate);
    let run;
    if (isFancy) {
      const parsed = parseRunRate(entryForm.runRate);
      if (parsed.error) {
        setEntryFormError(parsed.error);
        return;
      }
      run = parsed.run;
      rate = parsed.rate;
    } else if (!Number.isFinite(rate) || rate <= 0) {
      setEntryFormError("Bhav/rate must be greater than 0");
      return;
    }

    const payload = {
      eventId: selectedEvent._id,
      marketId: selectedMarket._id,
      team,
      stack,
      rate,
      selection,
      ...(isFancy ? { run } : {}),
    };
    setEntrySaving(true);
    const action = entryEditId ? updateEntry({ ...payload, id: entryEditId }) : createEntry(payload);
    const result = await dispatch(action);
    setEntrySaving(false);
    if (result.meta.requestStatus !== "fulfilled") return;

    setEntryForm(blankEntry(selectedMarket.booktype));
    setEntryEditId(null);
    setEntryFormError("");
    dispatch(fetchEntries({ eventId: selectedEvent._id, marketId: selectedMarket._id }));
  };

  const handleEntryEdit = (entry) => {
    setEntryForm({
      team: entry.team === "team2" ? "team2" : "team1",
      stack: entry.stack ?? "",
      rate: entry.rate ?? "",
      runRate:
        entry.run != null && entry.run !== ""
          ? `${entry.run}/${entry.rate ?? 0}`
          : "",
      selection: entry.selection || selectionsFor(selectedMarket?.booktype)[0],
    });
    setEntryEditId(entry._id);
    setEntryFormError("");
  };

  return (
    <div className="z-[99] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:min-h-[calc(100vh-5rem)] sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        <div className="events-page flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md sm:min-h-[min(70vh,calc(100vh-12rem))]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 sm:px-4">
            <h2 className="text-base font-bold text-slate-900">Events</h2>
            <div className="flex items-center gap-2">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search…"
                className="!h-8 !min-h-0 w-28 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:w-40"
              />
              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex !h-8 !min-h-0 shrink-0 items-center gap-1.5 rounded-md bg-[#424687] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#353a6e]"
              >
                <FaPlus size={12} />
                Add event
              </button>
            </div>
          </div>
          {formOpen && (
          <form onSubmit={handleSubmit} className="border-b border-slate-100 px-3 py-2 sm:px-4">
            <p className="mb-1.5 text-[11px] text-slate-500">
              {editId
                ? "Update event"
                : formData.team1.trim() && formData.team2.trim()
                  ? `${formData.team1.trim()} vs ${formData.team2.trim()}`
                  : ""}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <div className="min-w-0 sm:w-36">
                  <label className="mb-0.5 block text-[11px] font-medium text-slate-600">
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
                <div className="min-w-0 sm:w-36">
                  <label className="mb-0.5 block text-[11px] font-medium text-slate-600">
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
                <div className="col-span-2 min-w-0 sm:w-36">
                  <label className="mb-0.5 block text-[11px] font-medium text-slate-600">
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
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex !h-8 !min-h-0 items-center justify-center rounded-md bg-[#424687] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#353a6e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {editId ? <FaEdit size={12} /> : <FaPlus size={12} />}
                    {editId ? "Update" : "Submit"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                  className="inline-flex !h-8 !min-h-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
            {(formError || error) && (
              <p className="mt-1.5 text-xs text-red-600">{formError || error}</p>
            )}
          </form>
          )}
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
                  events.map((item, index) => {
                    const eventOpen = selectedEvent?._id === item._id;
                    return (
                    <React.Fragment key={item._id}>
                    <tr
                      data-event-id={item._id}
                      onClick={() => openEvent(item)}
                      className={`cursor-pointer border-b border-slate-100/80 transition-colors hover:bg-indigo-50/40 ${
                        eventOpen
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
                          <span className="inline-flex !h-7 !min-h-0 items-center rounded-md px-2 text-xs font-semibold text-[#424687]">
                            {eventOpen ? "Close" : "Open"}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(item);
                            }}
                            className="rounded-md p-1.5 text-[#424687] transition hover:bg-[#424687]/10 !h-7 !w-7 !min-h-0 inline-flex items-center justify-center"
                            title="Update"
                            aria-label="Update"
                          >
                            <FaEdit size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {eventOpen && (
                      <tr data-event-id={item._id} className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={3} className="px-3 py-2">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#424687]">
                            Market
                          </p>
                          <form
                            onSubmit={handleMarketSubmit}
                            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:flex sm:flex-wrap"
                          >
                            <select
                              name="booktype"
                              aria-label="Book type"
                              value={marketForm.booktype}
                              onChange={handleMarketChange}
                              className="!h-8 !min-h-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
                            >
                              {BOOK_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              name="marketname"
                              value={marketForm.marketname}
                              onChange={handleMarketChange}
                              placeholder="Market name"
                              aria-label="Market name"
                              className="!h-8 !min-h-0 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 placeholder:text-slate-400 sm:w-52"
                            />
                            <button
                              type="submit"
                              disabled={marketSaving}
                              className="inline-flex !h-8 !min-h-0 items-center rounded-md bg-[#424687] px-2.5 text-xs font-semibold text-white hover:bg-[#353a6e] disabled:opacity-60"
                            >
                              {marketEditId ? "Save" : "Add"}
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
                              {markets.map((market) => {
                                const marketOpen = selectedMarket?._id === market._id;
                                return (
                                <li key={market._id} className="text-sm">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openMarket(market)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openMarket(market);
                                      }
                                    }}
                                    className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_4.75rem_4.75rem] items-center gap-1 px-2 py-1.5 sm:grid-cols-[minmax(0,1fr)_7.5rem_5.5rem] sm:gap-2 sm:px-3 sm:py-2 ${
                                      marketOpen ? "bg-[#424687]/5" : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <span className="min-w-0 truncate font-medium text-slate-900">
                                      {market.marketname}
                                    </span>
                                    <span className="truncate text-xs text-slate-500">{market.booktype}</span>
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="inline-flex !h-7 !min-h-0 items-center rounded-md px-2 text-xs font-semibold text-[#424687]">
                                        {marketOpen ? "Close" : "Open"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleMarketEdit(market);
                                        }}
                                        className="inline-flex !h-7 !w-7 !min-h-0 items-center justify-center rounded-md p-0 text-[#424687] hover:bg-[#424687]/10"
                                        title="Update"
                                        aria-label="Update"
                                      >
                                        <FaEdit size={15} />
                                      </button>
                                    </div>
                                  </div>
                                  {marketOpen && (
                                    <div className="border-t border-slate-100 px-2 py-2 sm:px-3">
                                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#424687]">
                                        Entry · {market.marketname}
                                      </p>
                                      <div className="flex items-start gap-2">
                                      <form
                                        onSubmit={handleEntrySubmit}
                                        className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-end"
                                      >
                                        <div className="flex flex-wrap items-center gap-1.5">
                                        {market.booktype !== "Fancy" && (
                                        <div className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                                          {[
                                            ["team1", selectedEvent.team1 || "Team 1"],
                                            ["team2", selectedEvent.team2 || "Team 2"],
                                          ].map(([value, label]) => (
                                            <button
                                              key={value}
                                              type="button"
                                              onClick={() =>
                                                setEntryForm((prev) => ({ ...prev, team: value }))
                                              }
                                              className={`inline-flex !h-7 !min-h-0 items-center px-2.5 text-xs font-semibold ${
                                                entryForm.team === value
                                                  ? "bg-[#424687] text-white"
                                                  : "text-slate-500 hover:text-slate-700"
                                              }`}
                                            >
                                              {label}
                                            </button>
                                          ))}
                                        </div>
                                        )}
                                        <div className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                                          {selectionsFor(market.booktype).map((option) => {
                                            const active = entryForm.selection === option;
                                            const isBlue = option === "Back" || option === "Yes";
                                            return (
                                              <button
                                                key={option}
                                                type="button"
                                                onClick={() =>
                                                  setEntryForm((prev) => ({ ...prev, selection: option }))
                                                }
                                                className={`inline-flex !h-7 !min-h-0 items-center px-2.5 text-xs font-semibold ${
                                                  active
                                                    ? isBlue
                                                      ? "bg-blue-600 text-white"
                                                      : "bg-pink-500 text-white"
                                                    : isBlue
                                                      ? "text-blue-700 hover:text-blue-800"
                                                      : "text-pink-600 hover:text-pink-700"
                                                }`}
                                              >
                                                {option}
                                              </button>
                                            );
                                          })}
                                        </div>
                                        </div>
                                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto] items-end gap-1.5 sm:flex">
                                          <label className="min-w-0 sm:w-20">
                                            <span className="mb-0.5 block text-[10px] font-medium text-slate-500">
                                              Stack
                                            </span>
                                            <input
                                              type="number"
                                              min="0.01"
                                              step="0.01"
                                              name="stack"
                                              value={entryForm.stack}
                                              onChange={handleEntryChange}
                                              placeholder="Stack"
                                              aria-label="Stack"
                                              className="!h-7 !min-h-0 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
                                            />
                                          </label>
                                          {market.booktype === "Fancy" ? (
                                            <label className="min-w-0 sm:w-28">
                                              <span className="mb-0.5 block text-[10px] font-medium text-slate-500">
                                                Run/rate
                                              </span>
                                              <input
                                                type="text"
                                                name="runRate"
                                                value={entryForm.runRate}
                                                onChange={handleEntryChange}
                                                placeholder="50/100"
                                                aria-label="Run/rate"
                                                className="!h-7 !min-h-0 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
                                              />
                                            </label>
                                          ) : (
                                            <label className="min-w-0 sm:w-24">
                                              <span className="mb-0.5 block text-[10px] font-medium text-slate-500">
                                                Bhav/rate
                                              </span>
                                              <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                name="rate"
                                                value={entryForm.rate}
                                                onChange={handleEntryChange}
                                                placeholder="Bhav/rate"
                                                aria-label="Bhav/rate"
                                                className="!h-7 !min-h-0 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
                                              />
                                            </label>
                                          )}
                                          <button
                                            type="submit"
                                            disabled={entrySaving}
                                            className="inline-flex !h-7 !min-h-0 items-center rounded-md bg-[#424687] px-2.5 text-xs font-semibold text-white hover:bg-[#353a6e] disabled:opacity-60"
                                          >
                                            {entryEditId ? "Save" : "Add"}
                                          </button>
                                        </div>
                                      </form>
                                      {market.booktype === "Bookmaker" && position?.team1 && position?.team2 && (
                                        <div className="ml-auto inline-flex max-w-full shrink-0 flex-col overflow-hidden rounded-lg border border-[#424687]/15 bg-white shadow-sm">
                                          {[
                                            ["team1", position.team1],
                                            ["team2", position.team2],
                                          ].map(([key, side], index) => {
                                            const amount = Number(side.amount);
                                            const tone =
                                              amount < 0
                                                ? "text-rose-600"
                                                : amount > 0
                                                  ? "text-emerald-700"
                                                  : "text-slate-700";
                                            return (
                                              <div
                                                key={key}
                                                className={`flex items-center justify-between gap-6 px-2.5 py-1 ${
                                                  index === 0 ? "border-b border-slate-100" : ""
                                                }`}
                                              >
                                                <span className="max-w-[9rem] truncate text-xs font-medium text-slate-600">
                                                  {side.name}
                                                </span>
                                                <span className={`shrink-0 text-xs font-bold tabular-nums ${tone}`}>
                                                  {formatPosition(amount)}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      </div>
                                      {(entryFormError || entryError) && (
                                        <p className="mt-2 text-xs text-red-600">
                                          {entryFormError || entryError}
                                        </p>
                                      )}
                                      {entryLoading && (
                                        <p className="mt-2 text-xs text-[#424687]">Loading…</p>
                                      )}
                                      {entries.length > 0 && (
                                        <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
                                          <table className="w-full border-collapse text-xs">
                                            <thead>
                                              <tr className="bg-slate-100 text-left text-[11px] font-semibold text-slate-500">
                                                <th className="px-2 py-1.5 font-semibold">
                                                  {market.booktype === "Fancy" ? "Market name" : "Team"}
                                                </th>
                                                <th className="px-2 py-1.5 font-semibold">Stack</th>
                                                <th className="px-2 py-1.5 font-semibold">Bhav/rate</th>
                                                {market.booktype === "Fancy" && (
                                                  <th className="px-2 py-1.5 font-semibold">Run</th>
                                                )}
                                                <th className="px-2 py-1.5 font-semibold">Selection</th>
                                                <th className="px-2 py-1.5 font-semibold">Date</th>
                                                <th className="px-2 py-1.5 text-right">
                                                  {market.booktype === "Fancy" && Array.isArray(book) && book.length > 0 && (
                                                    <button
                                                      type="button"
                                                      onClick={() => setBookOpen(true)}
                                                      className="inline-flex !h-7 !min-h-0 items-center rounded-md bg-[#424687] px-2 text-[11px] font-semibold text-white hover:bg-[#353a6e]"
                                                    >
                                                      Book
                                                    </button>
                                                  )}
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {entries.map((entry) => (
                                                <tr
                                                  key={entry._id}
                                                  className={`border-t border-white/80 ${entryRowClass(entry.selection)}`}
                                                >
                                                  <td className="px-2 py-1.5 font-medium text-slate-900">
                                                    {entry.teamname}
                                                  </td>
                                                  <td className="px-2 py-1.5 tabular-nums text-slate-800">
                                                    {entry.stack}
                                                  </td>
                                                  <td className="px-2 py-1.5 tabular-nums text-slate-800">
                                                    {entry.rate ?? "—"}
                                                  </td>
                                                  {market.booktype === "Fancy" && (
                                                    <td className="px-2 py-1.5 tabular-nums text-slate-800">
                                                      {entry.run ?? "—"}
                                                    </td>
                                                  )}
                                                  <td className="px-2 py-1.5 text-slate-800">{entry.selection}</td>
                                                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-700">
                                                    <div>{entry.createdDate || "—"}</div>
                                                    {entry.createdTime && (
                                                      <div className="text-[11px] text-slate-500">{entry.createdTime}</div>
                                                    )}
                                                  </td>
                                                  <td className="px-2 py-1.5 text-right">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleEntryEdit(entry)}
                                                      className="inline-flex !h-7 !w-7 !min-h-0 items-center justify-center rounded-md p-0 text-[#424687] hover:bg-white/70"
                                                      title="Update"
                                                      aria-label="Update"
                                                    >
                                                      <FaEdit size={14} />
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                      {bookOpen && market.booktype === "Fancy" && Array.isArray(book) && book.length > 0 && (
                                        <div
                                          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4"
                                          onClick={() => setBookOpen(false)}
                                        >
                                          <div
                                            className="max-h-[70vh] w-full max-w-xs overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                                            onClick={(event) => event.stopPropagation()}
                                          >
                                            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2">
                                              <p className="text-xs font-semibold text-[#424687]">
                                                Book · {market.marketname}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => setBookOpen(false)}
                                                className="inline-flex !h-7 !min-h-0 items-center rounded-md px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                                              >
                                                Close
                                              </button>
                                            </div>
                                            {book.map((side, sideIndex) => (
                                              <div key={side.team || sideIndex} className={sideIndex > 0 ? "border-t border-slate-200" : ""}>
                                                <p className="truncate bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                  {side.teamname}
                                                </p>
                                                {(side.lines || []).map((line, index) => {
                                                  const amount = Number(line.amount);
                                                  const tone =
                                                    amount < 0
                                                      ? "text-rose-600"
                                                      : amount > 0
                                                        ? "text-emerald-700"
                                                        : "text-slate-700";
                                                  return (
                                                    <div
                                                      key={`${line.run}-${index}`}
                                                      className="flex items-center justify-between gap-4 px-3 py-1"
                                                    >
                                                      <span className="text-xs tabular-nums text-slate-600">{line.run}</span>
                                                      <span className={`text-xs font-bold tabular-nums ${tone}`}>
                                                        {formatPosition(amount)}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </li>
                                );
                              })}
                            </ul>
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
                    className="!h-8 !min-h-0 rounded-md border border-slate-300 bg-white px-2 text-xs lg:h-8"
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
                    className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium disabled:opacity-40"
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
                    className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium disabled:opacity-40"
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
