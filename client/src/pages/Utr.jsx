import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchUtrs,
  createUtr,
  deleteUtr,
  clearUtrError,
} from "../redux/utrSlice";
import { FaFileExcel, FaPlus, FaTimes, FaTrash } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL;

const getTodayDate = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

const formatNumber = (number) => {
  if (number === undefined || number === null || isNaN(number)) return "0";
  return Number(number).toLocaleString("en-IN");
};

const parseNumber = (value) => {
  return String(value || "").replace(/,/g, "");
};

const formatDate = (date) => {
  if (!date || isNaN(new Date(date))) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const getDateOnly = (date) => {
  if (!date || isNaN(new Date(date))) return "";
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

const Utr = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { utrs, loading, error } = useSelector((state) => state.utr);
  const { role, token: reduxToken } = useSelector((state) => state.user);
  const token = reduxToken || localStorage.getItem("token");
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

  const [formData, setFormData] = useState({
    utrNo: "",
    amount: "",
    transactionType: "deposit",
    subtype: "",
    date: getTodayDate(),
    remark: "",
  });

  const [filterData, setFilterData] = useState({
    startDate: "",
    endDate: "",
  });

  const [subtypes, setSubtypes] = useState([]);
  const [subtypeModalOpen, setSubtypeModalOpen] = useState(false);
  const [newSubtypeName, setNewSubtypeName] = useState("");
  const [subtypeLoading, setSubtypeLoading] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const authConfig = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : null;

  const loadSubtypes = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/utr-subtypes`, authConfig);
      setSubtypes(response.data || []);
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      if (
        message === "No token available" ||
        String(message).includes("Invalid token")
      ) {
        navigate("/");
      } else {
        console.error("Error loading subtypes:", message);
      }
    }
  };

  useEffect(() => {
    if (userRole && userRole !== "trader" && userRole !== "admin") {
      navigate("/parties");
      return;
    }

    dispatch(fetchUtrs())
      .unwrap()
      .catch((err) => {
        if (
          err === "No token available" ||
          String(err).includes("Invalid token")
        ) {
          navigate("/");
        }
      });
  }, [dispatch, navigate, userRole]);

  useEffect(() => {
    loadSubtypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      const numericValue = value.replace(/[^0-9.]/g, "");
      const parts = numericValue.split(".");
      const integerPart =
        parts[0] === "" ? "" : Number(parts[0]).toLocaleString("en-IN");

      let formattedValue = integerPart;

      if (parts.length > 1) {
        formattedValue += "." + parts[1].slice(0, 2);
      }

      setFormData({ ...formData, [name]: formattedValue });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      utrNo: "",
      amount: "",
      transactionType: "deposit",
      subtype: "",
      date: getTodayDate(),
      remark: "",
    });
    dispatch(clearUtrError());
  };

  const handleAddSubtype = async (e) => {
    e.preventDefault();

    if (!newSubtypeName.trim()) {
      alert("Subtype name is required");
      return;
    }

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setSubtypeLoading(true);

      const response = await axios.post(
        `${API_URL}/utr-subtypes`,
        { name: newSubtypeName.trim() },
        authConfig,
      );

      const createdSubtype = response.data.subtype;

      setSubtypes((prev) => [createdSubtype, ...prev]);
      setFormData((prev) => ({
        ...prev,
        subtype: createdSubtype?._id || "",
      }));
      setNewSubtypeName("");
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      if (
        message === "No token available" ||
        String(message).includes("Invalid token")
      ) {
        navigate("/");
      } else {
        alert("Error adding subtype: " + message);
      }
    } finally {
      setSubtypeLoading(false);
    }
  };

  const handleDeleteSubtype = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subtype?")) {
      return;
    }

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setSubtypeLoading(true);
      await axios.delete(`${API_URL}/utr-subtypes/${id}`, authConfig);

      setSubtypes((prev) => prev.filter((item) => item._id !== id));

      setFormData((prev) => ({
        ...prev,
        subtype: prev.subtype === id ? "" : prev.subtype,
      }));

      await dispatch(fetchUtrs()).unwrap();
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      if (
        message === "No token available" ||
        String(message).includes("Invalid token")
      ) {
        navigate("/");
      } else {
        alert("Error deleting subtype: " + message);
      }
    } finally {
      setSubtypeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.utrNo.trim() || !formData.amount || !formData.date) {
      alert("UTR No, amount, and date are required");
      return;
    }

    const utrData = {
      utrNo: formData.utrNo.trim(),
      amount: parseFloat(parseNumber(formData.amount)),
      transactionType: formData.transactionType || "deposit",
      subtype: formData.subtype || "",
      date: formData.date,
      remark: formData.remark,
    };

    try {
      await dispatch(createUtr(utrData)).unwrap();

      await dispatch(fetchUtrs()).unwrap();
      resetForm();
    } catch (err) {
      if (
        err === "No token available" ||
        String(err).includes("Invalid token")
      ) {
        navigate("/");
      } else {
        alert("Error saving UTR: " + err);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this UTR entry?")) {
      return;
    }

    try {
      await dispatch(deleteUtr(id)).unwrap();
      await dispatch(fetchUtrs()).unwrap();
    } catch (err) {
      if (
        err === "No token available" ||
        String(err).includes("Invalid token")
      ) {
        navigate("/");
      } else {
        alert("Error deleting UTR: " + err);
      }
    }
  };

  const getSubtypeText = (utr) => {
    if (utr?.subtype?.name) return utr.subtype.name;
    if (utr?.subtypeName) return utr.subtypeName;
    return "-";
  };

  const getFilteredUtrsForExcel = () => {
    const { startDate, endDate } = filterData;

    return utrs.filter((utr) => {
      const utrDate = getDateOnly(utr.date);

      if (!utrDate) return false;
      if (startDate && utrDate < startDate) return false;
      if (endDate && utrDate > endDate) return false;

      return true;
    });
  };

  const handleDownloadExcel = () => {
    const dataToDownload = getFilteredUtrsForExcel();

    if (dataToDownload.length === 0) {
      alert("No UTR data found for selected date filter");
      return;
    }

    const excelRows = dataToDownload.map((utr, index) => ({
      "Sr No": index + 1,
      Date: formatDate(utr.date),
      "UTR No": utr.utrNo || "",
      "Transaction Type":
        utr.transactionType === "deposit" ? "Deposit" : "Withdraw",
      "Sub Type": getSubtypeText(utr),
      Amount: Number(utr.amount || 0),
      "Time (IST)": utr.time || "",
      Remark: utr.remark || "",
      "Created By": utr?.createdBy?.username || utr?.createdBy?.email || "",
    }));

    const totalDepositForExcel = dataToDownload.reduce((sum, item) => {
      return (
        sum +
        (item.transactionType === "deposit" ? Number(item.amount || 0) : 0)
      );
    }, 0);

    const totalWithdrawForExcel = dataToDownload.reduce((sum, item) => {
      return (
        sum +
        (item.transactionType === "withdraw" ? Number(item.amount || 0) : 0)
      );
    }, 0);

    const balanceForExcel = totalDepositForExcel - totalWithdrawForExcel;

    excelRows.push({});
    excelRows.push({
      "Sr No": "",
      Date: "",
      "UTR No": "",
      "Transaction Type": "Total Deposit",
      "Sub Type": "",
      Amount: totalDepositForExcel,
      "Time (IST)": "",
      Remark: "",
      "Created By": "",
    });
    excelRows.push({
      "Sr No": "",
      Date: "",
      "UTR No": "",
      "Transaction Type": "Total Withdraw",
      "Sub Type": "",
      Amount: totalWithdrawForExcel,
      "Time (IST)": "",
      Remark: "",
      "Created By": "",
    });
    excelRows.push({
      "Sr No": "",
      Date: "",
      "UTR No": "",
      "Transaction Type": "Balance",
      "Sub Type": "",
      Amount: balanceForExcel,
      "Time (IST)": "",
      Remark: "",
      "Created By": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UTR Report");

    const fileName =
      filterData.startDate || filterData.endDate
        ? `UTR_Report_${filterData.startDate || "Start"}_to_${
            filterData.endDate || "End"
          }.xlsx`
        : "UTR_Report_All.xlsx";

    XLSX.writeFile(workbook, fileName);
  };

  const totalDeposit = utrs.reduce((sum, item) => {
    return (
      sum + (item.transactionType === "deposit" ? Number(item.amount || 0) : 0)
    );
  }, 0);

  const totalWithdraw = utrs.reduce((sum, item) => {
    return (
      sum + (item.transactionType === "withdraw" ? Number(item.amount || 0) : 0)
    );
  }, 0);

  const balance = totalDeposit - totalWithdraw;

  const fieldClass =
    "h-8 w-full min-w-0 rounded-md border border-slate-300 px-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm";

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 px-2 py-2 sm:px-4 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        {/* Entry form — compact height */}
        <div className="w-full rounded-xl border border-slate-200/90 bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur-sm sm:px-4 sm:py-2.5">
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 lg:gap-3">
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  UTR No*
                </label>
                <input
                  type="text"
                  name="utrNo"
                  value={formData.utrNo}
                  onChange={handleInputChange}
                  placeholder="Enter UTR number"
                  className={fieldClass}
                  required
                />
              </div>
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Amount*
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className={fieldClass}
                  required
                />
              </div>
              <div className="min-w-0 w-full sm:col-span-2 lg:col-span-1">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Transaction type*
                </label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  className={fieldClass}
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                </select>
              </div>
            </div>

            <div
              className={`grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:gap-3 ${subtypes.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
            >
              {subtypes.length > 0 && (
                <div className="min-w-0 w-full">
                  <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                    Sub type
                  </label>
                  <select
                    name="subtype"
                    value={formData.subtype}
                    onChange={handleInputChange}
                    className={fieldClass}
                  >
                    <option value="">Select sub type</option>
                    {subtypes.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="min-w-0 w-full">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Date*
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  tabIndex={-1}
                  className={fieldClass}
                  required
                />
              </div>
              <div className="min-w-0 w-full sm:col-span-2 lg:col-span-1">
                <label className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
                  Remark
                </label>
                <input
                  type="text"
                  name="remark"
                  value={formData.remark}
                  onChange={handleInputChange}
                  placeholder="Remark (optional)"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 sm:gap-2">
              <button
                type="submit"
                className="inline-flex h-8 min-w-[6.5rem] flex-1 items-center justify-center rounded-md bg-[#424687] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#353a6e] sm:flex-none sm:text-sm"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setSubtypeModalOpen(true)}
                className="inline-flex h-8 min-w-[7.5rem] flex-1 items-center justify-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:flex-none sm:text-sm"
              >
                <FaPlus size={12} />
                {subtypes.length === 0 ? "Add subtype" : "Subtype"}
              </button>
              <button
                type="button"
                onClick={() => setExcelModalOpen(true)}
                className="inline-flex h-8 min-w-[6.5rem] flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:flex-none sm:text-sm"
                title="Download Excel"
              >
                <FaFileExcel size={14} />
                Excel
              </button>
            </div>
          </form>
        </div>

        {/* Summary — compact strip */}
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
          <div className="rounded-lg border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80 sm:text-xs">
              Total deposit
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-emerald-700 sm:text-lg">
              ₹ {formatNumber(totalDeposit)}
            </p>
          </div>
          <div className="rounded-lg border border-red-200/80 bg-gradient-to-br from-red-50 to-white px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-800/80 sm:text-xs">
              Total withdraw
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-red-700 sm:text-lg">
              ₹ {formatNumber(totalWithdraw)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white px-3 py-2 shadow-sm sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 sm:text-xs">
              Balance
            </p>
            <p
              className={`mt-0.5 text-base font-bold tabular-nums sm:text-lg ${balance >= 0 ? "text-emerald-700" : "text-red-700"}`}
            >
              ₹ {formatNumber(Math.abs(balance))}
            </p>
          </div>
        </div>

        {/* Table card — taller viewport for data */}
        <div className="flex min-h-[min(76vh,calc(100vh-10rem))] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md">
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
          <div className="min-h-[min(68vh,calc(100vh-12rem))] flex-1 overflow-auto">
            {utrs.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-slate-600">
                No UTR entries available.
              </p>
            ) : (
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr className="bg-[#424687] text-white">
                    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                      Date
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                      UTR No
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                      Type
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                      Sub type
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                      Time (IST)
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
                  {utrs.map((utr, index) => (
                    <tr
                      key={utr._id}
                      className={`border-b border-slate-100/80 ${index % 2 === 0 ? "bg-slate-50/60" : "bg-white"} transition-colors hover:bg-indigo-50/40`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 text-slate-800">
                        {formatDate(utr.date)}
                      </td>
                      <td className="max-w-[12rem] break-all px-3 py-3 font-mono text-xs text-slate-800 sm:text-sm">
                        {utr.utrNo}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 font-semibold ${utr.transactionType === "deposit" ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {utr.transactionType === "deposit"
                          ? "Deposit"
                          : "Withdraw"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {getSubtypeText(utr)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium tabular-nums text-slate-800">
                        ₹ {formatNumber(utr.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                        {utr.time || "—"}
                      </td>
                      <td className="max-w-xs truncate px-3 py-3 text-slate-700 sm:max-w-md sm:whitespace-normal sm:break-words">
                        {utr.remark || ""}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(utr._id)}
                          className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800"
                          title="Delete UTR"
                        >
                          <FaTrash size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {subtypeModalOpen && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-800">
                Manage subtype
              </h2>
              <button
                type="button"
                onClick={() => setSubtypeModalOpen(false)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-5">
              <form
                onSubmit={handleAddSubtype}
                className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2"
              >
                <input
                  type="text"
                  value={newSubtypeName}
                  onChange={(e) => setNewSubtypeName(e.target.value)}
                  placeholder="New subtype name"
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
                <button
                  type="submit"
                  disabled={subtypeLoading}
                  className="h-10 shrink-0 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  Add
                </button>
              </form>

              <div className="max-h-72 overflow-y-auto rounded-md border border-slate-100">
                {subtypes.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">
                    No subtype added yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {subtypes.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-center justify-between gap-2 bg-slate-50/50 px-3 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              subtype: item._id,
                            }))
                          }
                          className={`min-w-0 flex-1 truncate text-left text-sm font-medium ${formData.subtype === item._id ? "text-violet-700" : "text-slate-800"}`}
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtype(item._id)}
                          className="shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800"
                          title="Delete subtype"
                        >
                          <FaTrash size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSubtypeModalOpen(false)}
                  className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {excelModalOpen && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-800">
                Download Excel report
              </h2>
              <button
                type="button"
                onClick={() => setExcelModalOpen(false)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Start date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filterData.startDate}
                  onChange={handleFilterChange}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  End date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filterData.endDate}
                  onChange={handleFilterChange}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setFilterData({ startDate: "", endDate: "" })}
                  className="rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadExcel();
                    setExcelModalOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <FaFileExcel size={16} />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utr;
