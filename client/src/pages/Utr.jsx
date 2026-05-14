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

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-6">
        <div className="mb-8 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSubmit}
            className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end"
          >
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                UTR No*
              </label>
              <input
                type="text"
                name="utrNo"
                value={formData.utrNo}
                onChange={handleInputChange}
                placeholder="Enter UTR No"
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Amount*
              </label>
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Transaction Type*
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleInputChange}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Sub Type
              </label>
              <select
                name="subtype"
                value={formData.subtype}
                onChange={handleInputChange}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select Sub Type</option>
                {subtypes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Date*
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                tabIndex={-1}
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Remark
              </label>
              <input
                type="text"
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Enter remark"
                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 pt-1 w-full">
              <button
                type="submit"
                className="h-[42px] flex-1 sm:flex-none min-w-[100px] bg-blue-600 text-white text-sm font-semibold px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm flex items-center justify-center"
              >
                Submit
              </button>

              <button
                type="button"
                onClick={() => setSubtypeModalOpen(true)}
                className="h-[42px] flex-1 sm:flex-none min-w-[140px] bg-purple-600 text-white text-sm font-semibold px-4 rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
              >
                <FaPlus size={13} />
                {subtypes.length === 0 ? "Add Subtype" : "Subtype"}
              </button>

              <button
                type="button"
                onClick={() => setExcelModalOpen(true)}
                className="h-[42px] flex-1 sm:flex-none min-w-[100px] bg-green-600 text-white text-sm font-semibold px-4 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                title="Download Excel"
              >
                <FaFileExcel size={16} />
                Excel
              </button>
            </div>
          </form>

          {/* BOXES RIGHT SIDE */}
          <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-sm text-green-700 font-semibold">
                Total Deposit
              </p>
              <p className="text-[15px] font-bold text-green-700">
                ₹ {formatNumber(totalDeposit)}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="text-sm text-red-700 font-semibold">
                Total Withdraw
              </p>
              <p className="text-[15px] font-bold text-red-700">
                ₹ {formatNumber(totalWithdraw)}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-sm text-blue-700 font-semibold">Balance</p>
              <p
                className={`text-[15px] font-bold ${
                  balance >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                ₹ {formatNumber(Math.abs(balance))}
              </p>
            </div>
          </div>
        </div>

        {loading && <p className="text-blue-600 text-center">Loading...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        <div className="overflow-x-auto">
          {utrs.length === 0 ? (
            <p className="text-gray-600">No UTR entries available.</p>
          ) : (
            <table className="w-full border-collapse bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">UTR No</th>
                  <th className="p-3 text-left">Transaction Type</th>
                  <th className="p-3 text-left">Sub Type</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Time (IST)</th>
                  <th className="p-3 text-left">Remark</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {utrs.map((utr, index) => (
                  <tr
                    key={utr._id}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition-colors`}
                  >
                    <td className="p-3">{formatDate(utr.date)}</td>
                    <td className="p-3 break-all">{utr.utrNo}</td>
                    <td
                      className={`p-3 font-semibold ${utr.transactionType === "deposit" ? "text-green-600" : "text-red-600"}`}
                    >
                      {utr.transactionType === "deposit"
                        ? "Deposit"
                        : "Withdraw"}
                    </td>
                    <td className="p-3">{getSubtypeText(utr)}</td>
                    <td className="p-3">₹ {formatNumber(utr.amount)}</td>
                    <td className="p-3">{utr.time || "-"}</td>
                    <td className="p-3">{utr.remark || ""}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleDelete(utr._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete UTR"
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {subtypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                Manage Subtype
              </h2>
              <button
                type="button"
                onClick={() => setSubtypeModalOpen(false)}
                className="text-gray-500 hover:text-red-600"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-5">
              <form onSubmit={handleAddSubtype} className="flex gap-2 mb-5">
                <input
                  type="text"
                  value={newSubtypeName}
                  onChange={(e) => setNewSubtypeName(e.target.value)}
                  placeholder="Enter subtype"
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={subtypeLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-60"
                >
                  Add
                </button>
              </form>

              <div className="max-h-72 overflow-y-auto">
                {subtypes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No subtype added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {subtypes.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              subtype: item._id,
                            }))
                          }
                          className={`text-left font-medium ${
                            formData.subtype === item._id
                              ? "text-purple-700"
                              : "text-gray-800"
                          }`}
                        >
                          {item.name}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubtype(item._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete subtype"
                        >
                          <FaTrash size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSubtypeModalOpen(false)}
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {excelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold text-gray-800">
                Download Excel Report
              </h2>
              <button
                type="button"
                onClick={() => setExcelModalOpen(false)}
                className="text-gray-500 hover:text-red-600"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filterData.startDate}
                  onChange={handleFilterChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filterData.endDate}
                  onChange={handleFilterChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFilterData({ startDate: "", endDate: "" })}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownloadExcel();
                    setExcelModalOpen(false);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
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
