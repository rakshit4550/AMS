import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUtrs, createUtr, updateUtr, deleteUtr, clearUtrError } from '../redux/utrSlice';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const getTodayDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

const formatNumber = (number) => {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return Number(number).toLocaleString('en-IN');
};

const parseNumber = (value) => {
  return String(value || '').replace(/,/g, '');
};

const formatDate = (date) => {
  if (!date || isNaN(new Date(date))) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

const Utr = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { utrs, loading, error } = useSelector((state) => state.utr);
  const { role } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    utrNo: '',
    amount: '',
    transactionType: 'deposit',
    date: getTodayDate(),
    remark: '',
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (role && role !== 'trader' && role !== 'admin') {
      navigate('/parties');
      return;
    }

    dispatch(fetchUtrs()).unwrap().catch((err) => {
      if (err === 'No token available' || String(err).includes('Invalid token')) {
        navigate('/');
      }
    });
  }, [dispatch, navigate, role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      const integerPart = parts[0] === '' ? '' : Number(parts[0]).toLocaleString('en-IN');

      let formattedValue = integerPart;

      if (parts.length > 1) {
        formattedValue += '.' + parts[1].slice(0, 2);
      }

      setFormData({ ...formData, [name]: formattedValue });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      utrNo: '',
      amount: '',
      transactionType: 'deposit',
      date: getTodayDate(),
      remark: '',
    });
    setEditId(null);
    dispatch(clearUtrError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.utrNo.trim() || !formData.amount || !formData.date) {
      alert('UTR No, amount, and date are required');
      return;
    }

    const utrData = {
      utrNo: formData.utrNo.trim(),
      amount: parseFloat(parseNumber(formData.amount)),
      transactionType: formData.transactionType || 'deposit',
      date: formData.date,
      remark: formData.remark,
    };

    try {
      if (editId) {
        await dispatch(updateUtr({ id: editId, ...utrData })).unwrap();
      } else {
        await dispatch(createUtr(utrData)).unwrap();
      }

      await dispatch(fetchUtrs()).unwrap();
      resetForm();
    } catch (err) {
      if (err === 'No token available' || String(err).includes('Invalid token')) {
        navigate('/');
      } else {
        alert('Error saving UTR: ' + err);
      }
    }
  };

  const handleEdit = (utr) => {
    setFormData({
      utrNo: utr.utrNo || '',
      amount: formatNumber(utr.amount || 0),
      transactionType: utr.transactionType || 'deposit',
      date: utr.date ? new Date(utr.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : getTodayDate(),
      remark: utr.remark || '',
    });
    setEditId(utr._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this UTR entry?')) {
      return;
    }

    try {
      await dispatch(deleteUtr(id)).unwrap();
      await dispatch(fetchUtrs()).unwrap();
    } catch (err) {
      if (err === 'No token available' || String(err).includes('Invalid token')) {
        navigate('/');
      } else {
        alert('Error deleting UTR: ' + err);
      }
    }
  };

  const totalDeposit = utrs.reduce((sum, item) => {
    return sum + (item.transactionType === 'deposit' ? Number(item.amount || 0) : 0);
  }, 0);

  const totalWithdraw = utrs.reduce((sum, item) => {
    return sum + (item.transactionType === 'withdraw' ? Number(item.amount || 0) : 0);
  }, 0);

  const balance = totalDeposit - totalWithdraw;

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">UTR</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-semibold">Total Deposit</p>
              <p className="text-lg font-bold text-green-700">₹ {formatNumber(totalDeposit)}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700 font-semibold">Total Withdraw</p>
              <p className="text-lg font-bold text-red-700">₹ {formatNumber(totalWithdraw)}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-semibold">Balance</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹ {formatNumber(Math.abs(balance))}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block mb-1 font-medium text-gray-700">UTR No*</label>
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
            <label className="block mb-1 font-medium text-gray-700">Amount*</label>
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
            <label className="block mb-1 font-medium text-gray-700">Transaction Type*</label>
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
            <label className="block mb-1 font-medium text-gray-700">Date*</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Remark</label>
            <input
              type="text"
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              placeholder="Enter remark"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white p-2 flex items-center gap-2 rounded-[5px] hover:bg-blue-700 transition duration-200"
            >
              <FaPlus size={18} />
              {editId ? 'Update' : 'Add'}
            </button>

            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white p-2 flex items-center gap-2 rounded-[5px] hover:bg-gray-700 transition duration-200"
              >
                <FaTimes size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>

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
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                  >
                    <td className="p-3">{formatDate(utr.date)}</td>
                    <td className="p-3 break-all">{utr.utrNo}</td>
                    <td className={`p-3 font-semibold ${utr.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {utr.transactionType === 'deposit' ? 'Deposit' : 'Withdraw'}
                    </td>
                    <td className="p-3">₹ {formatNumber(utr.amount)}</td>
                    <td className="p-3">{utr.time || '-'}</td>
                    <td className="p-3">{utr.remark || ''}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(utr)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit UTR"
                      >
                        <FaEdit size={18} />
                      </button>

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
    </div>
  );
};

export default Utr;
