import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchParties,
  createParty,
  updateParty,
  deleteParty,
} from "../redux/partySlice";
import "tailwindcss/tailwind.css";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

const Party = () => {
  const dispatch = useDispatch();
  const { parties, loading, error, pagination } = useSelector(
    (state) => state.party,
  );
  const [formData, setFormData] = useState({
    partyname: "",
    mobileNumber: "",
    city: "",
    remark: "",
  });
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const entriesPerPageOptions = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
  ];

  useEffect(() => {
    dispatch(fetchParties({ page: currentPage, limit: entriesPerPage, search }));
  }, [dispatch, currentPage, entriesPerPage, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.partyname.trim()) return;
    if (editId) {
      dispatch(updateParty({ id: editId, ...formData }));
      setEditId(null);
    } else {
      dispatch(createParty(formData)).then(() => {
        dispatch(fetchParties({ page: 1, limit: entriesPerPage, search }));
        setCurrentPage(1);
      });
    }
    setFormData({ partyname: "", mobileNumber: "", city: "", remark: "" });
  };

  const handleEdit = (party) => {
    setFormData({
      partyname: party.partyname,
      mobileNumber: party.mobileNumber || "",
      city: party.city || "",
      remark: party.remark || "",
    });
    setEditId(party._id);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this party?")) {
      return;
    }
    dispatch(deleteParty(id)).then(() => {
      dispatch(fetchParties({ page: currentPage, limit: entriesPerPage, search }));
    });
  };

  const clearForm = () => {
    setFormData({ partyname: "", mobileNumber: "", city: "", remark: "" });
    setEditId(null);
  };

  const fieldClass =
    "!h-8 !min-h-0 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#424687]/40 focus:outline-none focus:ring-2 focus:ring-[#424687]/20";

  return (
    <div className="parties-page -mx-3 flex min-h-[calc(100dvh-var(--app-mobile-header-height)-var(--app-bottom-nav-height)-1.25rem)] flex-col bg-white sm:-mx-4 sm:min-h-[calc(100dvh-var(--app-desktop-header-height))] lg:-mb-8">
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-2 sm:flex-row sm:items-end">
          <form
            onSubmit={handleSubmit}
            className="grid flex-1 grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap"
          >
            <label className="col-span-2 min-w-0 sm:w-48">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Party name</span>
              <input
                type="text"
                name="partyname"
                value={formData.partyname}
                onChange={handleInputChange}
                placeholder="Party name"
                className={fieldClass}
                required
              />
            </label>
            <label className="min-w-0 sm:w-36">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Mobile</span>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="Optional"
                className={fieldClass}
                inputMode="numeric"
              />
            </label>
            <label className="min-w-0 sm:w-32">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">City</span>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                className={fieldClass}
              />
            </label>
            <label className="col-span-2 min-w-0 sm:w-52">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Remark</span>
              <input
                type="text"
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Remark"
                className={fieldClass}
              />
            </label>
            <div className="col-span-2 flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex !h-8 !min-h-0 items-center justify-center gap-1.5 rounded-md bg-[#424687] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#353a6e]"
              >
                {editId ? <FaEdit size={12} /> : <FaPlus size={12} />}
                {editId ? "Update" : "Add"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="inline-flex !h-8 !min-h-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          <div className="relative w-full sm:w-52">
            <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search"
              aria-label="Search parties"
              className="!h-8 !min-h-0 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#424687]/40 focus:outline-none focus:ring-2 focus:ring-[#424687]/20"
            />
          </div>
      </div>
          {loading && (
            <p className="border-b border-slate-100 bg-slate-50 py-2 text-center text-sm text-[#424687]">
              Loading…
            </p>
          )}
          {error && (
            <p className="border-b border-red-100 bg-red-50 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-[#353a6e] to-[#424687] text-white">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Party name</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Mobile</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">City</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Remark</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      No parties found.
                    </td>
                  </tr>
                ) : (
                  parties.map((party, index) => (
                    <tr
                      key={party._id}
                      className={`border-b border-slate-100 transition-colors hover:bg-indigo-50/60 ${
                        editId === party._id
                          ? "bg-[#424687]/10"
                          : index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/80"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#424687]/10 text-[11px] font-bold uppercase text-[#424687]">
                            {(party.partyname || "?").trim().slice(0, 1)}
                          </span>
                          <span className="font-medium text-slate-900">{party.partyname}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-700">
                        {party.mobileNumber || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{party.city || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{party.remark || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(party)}
                            className="inline-flex !h-7 !w-7 !min-h-0 items-center justify-center rounded-md bg-[#424687]/10 p-0 text-[#424687] hover:bg-[#424687]/20"
                            title="Edit party"
                            aria-label="Edit party"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(party._id)}
                            className="inline-flex !h-7 !w-7 !min-h-0 items-center justify-center rounded-md bg-red-50 p-0 text-red-600 hover:bg-red-100"
                            title="Delete party"
                            aria-label="Delete party"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalRecords > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                {pagination.totalRecords
                  ? (pagination.currentPage - 1) * pagination.limit + 1
                  : 0}{" "}
                to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalRecords,
                )}{" "}
                of {pagination.totalRecords}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  Show
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="!h-8 !min-h-0 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                  >
                    {entriesPerPageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="inline-flex !h-8 !min-h-0 items-center rounded-md bg-[#424687] px-2.5 text-xs font-semibold text-white">
                  {pagination.currentPage} / {pagination.totalPages || 1}
                </span>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="inline-flex !h-8 !min-h-0 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
    </div>
  );
};

export default Party;
