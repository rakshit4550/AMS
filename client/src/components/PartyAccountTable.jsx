const handleDownload = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/');
    return;
  }
  let url = `${API_URL}/accounts/statement/download`;
  if (formData.partyname) {
    url += `?party=${formData.partyname}`;
  }
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response: Expected JSON data, but received binary (e.g., PDF). Check backend.');
    }
    const grouped = await response.json();
    if (!grouped || typeof grouped !== 'object' || Object.keys(grouped).length === 0) {
      throw new Error('Invalid or empty data received from server');
    }
    const formatDate = (date) => {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return new Date(date).toLocaleDateString('en-GB', options);
    };
    Object.keys(grouped).forEach((pId) => {
      const doc = new jsPDF();
      let y = 20;
      let page = 1;
      const group = grouped[pId];
      if (!group || !group.accounts || group.accounts.length === 0) {
        console.warn('Skipping empty group:', pId);
        return;
      }
      const party = parties.find((p) => p._id === pId);
      if (!party) {
        console.warn('Party not found for ID:', pId);
        return;
      }
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${party.partyname} Statement`, 10, 10);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      y += 10;
      const balance = group.totalDebit - group.totalCredit;
      const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
      const balValue = Math.abs(balance).toFixed(2);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      y += 10;
      const tableX = 10;
      const tableWidth = 190;
      const colWidths = [40, 40, 40, 40, 30];
      const rowHeight = 8;
      const tableStartY = y;
      doc.setFillColor(0, 51, 102);
      doc.rect(tableX, y, tableWidth, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', tableX + 2, y + 6);
      doc.text('Debit (-)', tableX + 42, y + 6);
      doc.text('Credit (+)', tableX + 82, y + 6);
      doc.text('Balance', tableX + 122, y + 6);
      doc.text('Remark', tableX + 162, y + 6);
      y += rowHeight;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      let currentBalance = 0;
      group.accounts.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((acc, rowIndex) => {
        currentBalance += acc.debit - acc.credit;
        const curBalSign = currentBalance > 0 ? 'Dr' : currentBalance < 0 ? 'Cr' : '';
        const curBalValue = Math.abs(currentBalance).toFixed(2);
        if (rowIndex % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        }
        doc.setDrawColor(150, 150, 150);
        doc.rect(tableX, y, tableWidth, rowHeight);
        let x = tableX;
        colWidths.forEach((width, i) => {
          doc.rect(x, y, width, rowHeight);
          x += width;
        });
        doc.setFontSize(9);
        doc.text(formatDate(acc.date), tableX + 2, y + 6);
        if (acc.debit > 0) {
          doc.setTextColor(255, 0, 0);
          doc.text(acc.debit.toFixed(2), tableX + 42, y + 6);
        }
        if (acc.credit > 0) {
          doc.setTextColor(0, 128, 0);
          doc.text(acc.credit.toFixed(2), tableX + 82, y + 6);
        }
        doc.setTextColor(0, 0, 0);
        doc.text(`${curBalValue} ${curBalSign}`, tableX + 122, y + 6);
        const remarkText = (acc.remark || '').length > 20 ? `${acc.remark.substring(0, 20)}...` : acc.remark || '';
        doc.text(remarkText, tableX + 162, y + 6);
        y += rowHeight;
        if (y > 260) {
          doc.addPage();
          y = 20;
          page++;
          doc.setFillColor(0, 51, 102);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${party.partyname} Statement`, 10, 10);
          y = tableStartY;
          doc.setFillColor(0, 51, 102);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Date', tableX + 2, y + 6);
          doc.text('Debit (-)', tableX + 42, y + 6);
          doc.text('Credit (+)', tableX + 82, y + 6);
          doc.text('Balance', tableX + 122, y + 6);
          doc.text('Remark', tableX + 162, y + 6);
          y += rowHeight;
        }
      });
      // Add closing balance after table on left side
      y += 10;
      const balanceText = `Closing Balance: ₹${balValue} ${balSign}`;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      if (balance > 0) { // Dr red
        doc.setTextColor(255, 0, 0);
      } else if (balance < 0) { // Cr green
        doc.setTextColor(0, 128, 0);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(balanceText, tableX, y);
      y += 15;
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const genDate = formatDate(now).replace(/\d{4}$/, `'${now.getFullYear().toString().slice(2)}`);
      const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Generated: ${genTime}`, tableX, y);
      doc.save(`${party.partyname}_account_statement.pdf`);
    });
  } catch (error) {
    console.error('Detailed error in handleDownload:', error);
    alert('Error generating statement: ' + error.message);
  }
};


import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties, verifyAccount } from '../redux/accountSlice';
import { jsPDF } from 'jspdf';
import Select from 'react-select';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaFileDownload, FaArrowRight } from 'react-icons/fa';

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accounts, parties, loading, error } = useSelector((state) => state.account);
  const [formData, setFormData] = useState({
    partyname: '',
    amount: '',
    transactionType: 'credit',
    remark: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [editId, setEditId] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const API_URL = process.env.REACT_APP_API_URL;

  const partyOptions = [
    { value: '', label: 'Select a Party' },
    ...parties.map((party) => ({ value: party._id, label: party.partyname })),
  ];

  const entriesPerPageOptions = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ];

  useEffect(() => {
    dispatch(fetchParties()).unwrap().catch((err) => {
      if (err === 'No token available' || err.includes('Invalid token')) {
        navigate('/');
      }
    });
    dispatch(fetchAccounts()).unwrap().catch((err) => {
      if (err === 'No token available' || err.includes('Invalid token')) {
        navigate('/');
      }
    });
  }, [dispatch, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePartyInputChange = (selectedOption) => {
    setFormData({ ...formData, partyname: selectedOption ? selectedOption.value : '' });
    setCurrentPage(1);
  };

  const handleEntriesPerPageChange = (selectedOption) => {
    setEntriesPerPage(selectedOption.value);
    setCurrentPage(1);
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages && !isNaN(pageNumber)) {
      setCurrentPage(pageNumber);
      setPageInput('');
    } else {
      alert('Please enter a valid page number');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.partyname || !formData.amount || !formData.date) {
      alert('Party name, amount, and date are required');
      return;
    }
    const accountData = {
      partyname: formData.partyname,
      credit: formData.transactionType === 'credit' ? parseFloat(formData.amount) : 0,
      debit: formData.transactionType === 'debit' ? parseFloat(formData.amount) : 0,
      remark: formData.remark,
      date: formData.date,
    };
    if (editId) {
      dispatch(updateAccount({ id: editId, ...accountData }))
        .unwrap()
        .then(() => {
          showMessages(accountData.credit, accountData.debit, formData.partyname);
          dispatch(fetchAccounts());
          setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date });
          setEditId(null);
        })
        .catch((err) => {
          if (err === 'No token available' || err.includes('Invalid token')) {
            navigate('/');
          }
        });
    } else {
      dispatch(createAccount(accountData))
        .unwrap()
        .then(() => {
          showMessages(accountData.credit, accountData.debit, formData.partyname);
          dispatch(fetchAccounts());
          setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date });
        })
        .catch((err) => {
          if (err === 'No token available' || err.includes('Invalid token')) {
            navigate('/');
          }
        });
    }
  };

  const showMessages = (credit, debit, partyId) => {
    const selectedParty = parties.find((p) => p._id === partyId);
    const partyName = selectedParty ? selectedParty.partyname : 'this party';
  };

  const handleEdit = (account) => {
    if (account.verified) {
      alert('This account is verified and cannot be edited.');
      return;
    }
    setFormData({
      partyname: account.partyname._id,
      amount: account.credit > 0 ? account.credit : account.debit,
      transactionType: account.credit > 0 ? 'credit' : 'debit',
      remark: account.remark || '',
      date: new Date(account.date).toISOString().split('T')[0],
    });
    setEditId(account._id);
  };

  const handleDelete = (id) => {
    const account = accounts.find((acc) => acc._id === id);
    if (account.verified) {
      alert('This account is verified and cannot be deleted.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }
    dispatch(deleteAccount(id))
      .unwrap()
      .then(() => {
        dispatch(fetchAccounts());
      })
      .catch((err) => {
        if (err === 'No token available' || err.includes('Invalid token')) {
          navigate('/');
        }
      });
  };

  const handleVerify = (id) => {
    dispatch(verifyAccount(id))
      .unwrap()
      .then(() => {
        dispatch(fetchAccounts());
      })
      .catch((err) => {
        if (err === 'No token available' || err.includes('Invalid token')) {
          navigate('/');
        }
      });
  };


const handleDownload = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/');
    return;
  }
  let url = `${API_URL}/accounts/statement/download`;
  if (formData.partyname) {
    url += `?party=${formData.partyname}`;
  }
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response: Expected JSON data, but received binary (e.g., PDF). Check backend.');
    }
    const grouped = await response.json();
    if (!grouped || typeof grouped !== 'object' || Object.keys(grouped).length === 0) {
      throw new Error('Invalid or empty data received from server');
    }
    const formatDate = (date) => {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return new Date(date).toLocaleDateString('en-GB', options);
    };
    Object.keys(grouped).forEach((pId) => {
      const doc = new jsPDF();
      let y = 20;
      let page = 1;
      const group = grouped[pId];
      if (!group || !group.accounts || group.accounts.length === 0) {
        console.warn('Skipping empty group:', pId);
        return;
      }
      const party = parties.find((p) => p._id === pId);
      if (!party) {
        console.warn('Party not found for ID:', pId);
        return;
      }
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${party.partyname} Statement`, 10, 10);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      y += 10;
      const balance = group.totalDebit - group.totalCredit;
      const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
      const balValue = Math.abs(balance).toFixed(2);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      y += 10;
      const tableX = 10;
      const tableWidth = 190;
      const colWidths = [40, 40, 40, 40, 30];
      const rowHeight = 8;
      const tableStartY = y;
      doc.setFillColor(0, 51, 102);
      doc.rect(tableX, y, tableWidth, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', tableX + 2, y + 6);
      doc.text('Debit (-)', tableX + 42, y + 6);
      doc.text('Credit (+)', tableX + 82, y + 6);
      doc.text('Balance', tableX + 122, y + 6);
      doc.text('Remark', tableX + 162, y + 6);
      y += rowHeight;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      let currentBalance = 0;

      // Filter out invalid accounts and sort by date
      const validAccounts = group.accounts.filter((acc) => acc && acc._id && typeof acc._id === 'string' && acc._id.length >= 8);
      validAccounts.sort((a, b) => {
        // Use date field directly if available, fallback to _id-based timestamp
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date); // Sort by date field in descending order
        }
        // Fallback to _id-based sorting
        const tsA = parseInt(a._id.substring(0, 8), 16) * 1000;
        const tsB = parseInt(b._id.substring(0, 8), 16) * 1000;
        return tsB - tsA;
      }).forEach((acc, rowIndex) => {
        currentBalance += acc.debit - acc.credit;
        const curBalSign = currentBalance > 0 ? 'Dr' : currentBalance < 0 ? 'Cr' : '';
        const curBalValue = Math.abs(currentBalance).toFixed(2);
        if (rowIndex % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        }
        doc.setDrawColor(150, 150, 150);
        doc.rect(tableX, y, tableWidth, rowHeight);
        let x = tableX;
        colWidths.forEach((width, i) => {
          doc.rect(x, y, width, rowHeight);
          x += width;
        });
        doc.setFontSize(9);
        doc.text(formatDate(acc.date), tableX + 2, y + 6);
        if (acc.debit > 0) {
          doc.setTextColor(255, 0, 0);
          doc.text(acc.debit.toFixed(2), tableX + 42, y + 6);
        }
        if (acc.credit > 0) {
          doc.setTextColor(0, 128, 0);
          doc.text(acc.credit.toFixed(2), tableX + 82, y + 6);
        }
        doc.setTextColor(0, 0, 0);
        doc.text(`${curBalValue} ${curBalSign}`, tableX + 122, y + 6);
        const remarkText = (acc.remark || '').length > 20 ? `${acc.remark.substring(0, 20)}...` : acc.remark || '';
        doc.text(remarkText, tableX + 162, y + 6);
        y += rowHeight;
        if (y > 260) {
          doc.addPage();
          y = 20;
          page++;
          doc.setFillColor(0, 51, 102);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${party.partyname} Statement`, 10, 10);
          y = tableStartY;
          doc.setFillColor(0, 51, 102);
          doc.rect(tableX, y, tableWidth, rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Date', tableX + 2, y + 6);
          doc.text('Debit (-)', tableX + 42, y + 6);
          doc.text('Credit (+)', tableX + 82, y + 6);
          doc.text('Balance', tableX + 122, y + 6);
          doc.text('Remark', tableX + 162, y + 6);
          y += rowHeight;
        }
      });
      // Add closing balance after table on left side
      y += 10;
      const balanceText = `Closing Balance: ₹${balValue} ${balSign}`;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      if (balance > 0) {
        doc.setTextColor(255, 0, 0);
      } else if (balance < 0) {
        doc.setTextColor(0, 128, 0);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(balanceText, tableX, y);
      y += 15;
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const genDate = formatDate(now).replace(/\d{4}$/, `'${now.getFullYear().toString().slice(2)}`);
      const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Generated: ${genTime}`, tableX, y);
      doc.save(`${party.partyname}_account_statement.pdf`);
    });
  } catch (error) {
    console.error('Detailed error in handleDownload:', error);
    alert('Error generating statement: ' + error.message);
  }
};
  const groupedAccounts = formData.partyname
    ? parties.reduce((acc, party) => {
      if (party._id === formData.partyname) {
        const partyAccounts = accounts.filter((account) => account.partyname?._id === party._id);
        if (partyAccounts.length > 0) {
          acc[party._id] = {
            partyname: party.partyname,
            accounts: partyAccounts,
          };
        }
      }
      return acc;
    }, {})
    : {};

  const selectedPartyAccounts = formData.partyname && groupedAccounts[formData.partyname] ? groupedAccounts[formData.partyname].accounts : [];
  const sortedAccounts = [...(selectedPartyAccounts || [])].sort((a, b) => {
    const tsA = parseInt(a._id.substring(0, 8), 16) * 1000;
    const tsB = parseInt(b._id.substring(0, 8), 16) * 1000;
    return tsB - tsA;
  });
  const totalPages = Math.ceil((selectedPartyAccounts?.length || 0) / entriesPerPage);
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentAccounts = sortedAccounts.slice(indexOfFirst, indexOfLast);
  const totalDebit = (selectedPartyAccounts || []).reduce((sum, account) => sum + (account.debit || 0), 0);
  const totalCredit = (selectedPartyAccounts || []).reduce((sum, account) => sum + (account.credit || 0), 0);
  const balance = totalDebit - totalCredit;
  const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
  const balValue = Math.abs(balance).toFixed(2);
  const balanceColor = balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800';

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-6">
        <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Party Name</label>
            <Select
              options={partyOptions.filter(option => option.value !== '')}
              value={partyOptions.find(option => option.value === formData.partyname) || null}
              onChange={handlePartyInputChange}
              placeholder="Select or type to search party"
              className="w-full"
              classNamePrefix="select"
              isClearable
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#d1d5db',
                  padding: '2px',
                  borderRadius: '0.375rem',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#3b82f6',
                  },
                  '&:focus': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
                  },
                }),
              }}
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
              <option value="credit">Deposit(Dena)</option>
              <option value="debit">Withdraw(Lena)</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Amount*</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Date</label>
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
              className="bg-blue-600 text-white p-2 flex items-center gap-2 rounded-[5px] hover:bg-blue-700 transition duration-200 col-span-1 md:col-auto"
              title={editId ? 'Update Account' : 'Submit Account'}
            >
              <FaPlus size={18} />
              {editId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200 col-span-1 md:col-auto"
              title="Download Statement"
            >
              <FaFileDownload size={18} />
            </button>
          </div>
        </form>

        {loading && <p className="text-blue-600 text-center">Loading...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        <div className="mb-8">
          {formData.partyname && groupedAccounts[formData.partyname] ? (
            <div className="mb-8 overflow-x-auto">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">{groupedAccounts[formData.partyname].partyname}</h3>
              {selectedPartyAccounts.length === 0 ? (
                <p className="text-gray-600">No accounts available for {groupedAccounts[formData.partyname].partyname}.</p>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedAccounts.length)} of {selectedPartyAccounts.length} entries</p>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-gray-700">Show</label>
                        <Select
                          options={entriesPerPageOptions}
                          value={entriesPerPageOptions.find(option => option.value === entriesPerPage)}
                          onChange={handleEntriesPerPageChange}
                          className="w-24"
                          classNamePrefix="select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#d1d5db',
                              padding: '2px',
                              borderRadius: '0.375rem',
                              boxShadow: 'none',
                              '&:hover': {
                                borderColor: '#3b82f6',
                              },
                              '&:focus': {
                                borderColor: '#3b82f6',
                                boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
                              },
                            }),
                          }}
                        />
                        <label className="text-gray-700">entries</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pageInput}
                          onChange={handlePageInputChange}
                          placeholder="Page"
                          className="border border-gray-300 p-2 rounded w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <button
                          onClick={handleGoToPage}
                          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200"
                          title="Go to Page"
                        >
                          <FaArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                    <thead>
                      <tr className="bg-blue-900 text-white">
                        <th className="border border-gray-300 p-3 font-semibold">Date</th>
                        <th className="border border-gray-300 p-3 font-semibold">Debit (-)</th>
                        <th className="border border-gray-300 p-3 font-semibold">Credit (+)</th>
                        <th className="border border-gray-300 p-3 font-semibold">Remark</th>
                        <th className="border border-gray-300 p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAccounts.map((account, index) => (
                        <tr key={account._id} className={`hover:bg-gray-50 transition-all ${index % 2 === 0 ? 'bg-gray-100' : ''}`}>
                          <td className="border border-gray-300 p-3">{new Date(account.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className="border border-gray-300 p-3 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
                          <td className="border border-gray-300 p-3 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
                          <td className="border border-gray-300 p-3">{account.remark || ''}</td>
                          <td className="border border-gray-300 p-3 flex gap-2 justify-center">
                            <button
                              onClick={() => !account.verified && handleEdit(account)}
                              className={`bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={account.verified}
                              title="Edit Account"
                            >
                              <FaEdit size={18} />
                            </button>
                            <button
                              onClick={() => !account.verified && handleDelete(account._id)}
                              className={`bg-red-500 text-white p-2 rounded hover:bg-red-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={account.verified}
                              title="Delete Account"
                            >
                              <FaTrash size={18} />
                            </button>
                            <button
                              onClick={() => handleVerify(account._id)}
                              className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={account.verified}
                              title={account.verified ? 'Verified' : 'Verify Account'}
                            >
                              <FaCheck size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-8 flex justify-between">
                    <div className="flex justify-between mt-6">
                      <div>
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="bg-gray-300 text-gray-800 px-3 py-1 rounded mr-2 hover:bg-gray-400 disabled:opacity-50 transition-all"
                        >
                          Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="bg-gray-300 text-gray-800 px-3 py-1 rounded ml-2 hover:bg-gray-400 disabled:opacity-50 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                    <div className={`bg-white flex gap-4 border-2 border-gray-300 p-4 rounded-lg shadow-xl  md:w-1/3 bg-gradient-to-br ${balance > 0 ? 'from-red-50 to-red-100' : balance < 0 ? 'from-green-50 to-green-100' : 'from-gray-50 to-gray-100'}`}>
                      <div className="border-b- border-gray-400 pb-2 mb-">
                        <span className={`text-2xl font-bold font-sans ${balanceColor}`}>Closing Balance</span>
                      </div>
                      <div className={`text-2xl font-extrabold font-sans ${balanceColor} `}>₹{balValue} {balSign}</div>
                    </div>
                  </div>

                </>
              )}
            </div>
          ) : formData.partyname ? (
            <p className="text-gray-600">No accounts available for selected party.</p>
          ) : (
            null
          )}
        </div>
      </div>
    </div>
  );
};

export default Accoun