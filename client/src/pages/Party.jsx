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
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) {
      alert("Mobile number must be exactly 10 digits");
      return;
    }
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

  const fieldClass =
    "h-8 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 text-xs transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm";

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        <div className="w-full rounded-xl border  bg-white/95 px-2.5 py-2.5 shadow-sm backdrop-blur-sm sm:px-4 sm:py-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 border-t border-slate-100 pt-3"
          >
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                  Party name*
                </label>
                <input
                  type="text"
                  name="partyname"
                  value={formData.partyname}
                  onChange={handleInputChange}
                  placeholder="Party name"
                  className={fieldClass}
                  required
                />
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                  Mobile (10 digits)
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  className={fieldClass}
                  inputMode="numeric"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className={fieldClass}
                />
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                  Remark
                </label>
                <input
                  type="text"
                  name="remark"
                  value={formData.remark}
                  onChange={handleInputChange}
                  placeholder="Remark"
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#424687] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#353a6e] sm:text-sm"
              >
                {editId ? (
                  <span className="inline-flex items-center gap-1.5">
                    <FaEdit size={13} />
                    Update
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <FaPlus size={13} />
                    Submit
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="flex min-h-[min(70vh,calc(100vh-12rem))] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md">
          <div className="border-b border-slate-100 px-3 py-2 sm:px-4">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search parties…"
              className={fieldClass}
            />
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
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-[#424687] text-white">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Party name
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Mobile
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    City
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Remark
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {parties.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      No parties found.
                    </td>
                  </tr>
                ) : (
                  parties.map((party, index) => (
                    <tr
                      key={party._id}
                      className={`border-b border-slate-100/80 transition-colors hover:bg-indigo-50/40 ${index % 2 === 0 ? "bg-slate-50/50" : "bg-white"}`}
                    >
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {party.partyname}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">
                        {party.mobileNumber || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {party.city || "—"}
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-2.5 text-slate-600 sm:max-w-md sm:whitespace-normal sm:break-words">
                        {party.remark || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(party)}
                            className="rounded-md p-1.5 text-[#424687] transition hover:bg-[#424687]/10 hover:text-[#353a6e]"
                            title="Edit party"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(party._id)}
                            className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800"
                            title="Delete party"
                          >
                            <FaTrash size={16} />
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
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                Showing{" "}
                {pagination.totalRecords
                  ? (pagination.currentPage - 1) * pagination.limit + 1
                  : 0}{" "}
                to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalRecords,
                )}{" "}
                of {pagination.totalRecords} parties
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600">Show</label>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    {entriesPerPageOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p) => p + 1)}
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

export default Party;
