// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties, verifyAccount } from '../redux/accountSlice';
// import { jsPDF } from 'jspdf';
// import Select from 'react-select';

// // PartyAccountTable Component
// const PartyAccountTable = ({ partyname, accounts, onEdit, onDelete, onVerify, entriesPerPage }) => {
//   const [currentPage, setCurrentPage] = useState(1);

//   // Ensure accounts are sorted by date in descending order (newest first)
//   const sortedAccounts = [...(accounts || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
//   const totalPages = Math.ceil((accounts?.length || 0) / entriesPerPage);
//   const indexOfLast = currentPage * entriesPerPage;
//   const indexOfFirst = indexOfLast - entriesPerPage;
//   const currentAccounts = sortedAccounts.slice(indexOfFirst, indexOfLast);
//   const totalDebit = (accounts || []).reduce((sum, account) => sum + (account.debit || 0), 0);
//   const totalCredit = (accounts || []).reduce((sum, account) => sum + (account.credit || 0), 0);
//   const balance = totalDebit - totalCredit;
//   const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
//   const balValue = Math.abs(balance).toFixed(2);
//   const balanceColor = balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800';

//   if (!accounts || accounts.length === 0) {
//     return <p className="text-gray-600">No accounts available for {partyname}.</p>;
//   }

//   return (
//     <div className="mb-8 overflow-x-auto">
//       <h3 className="text-lg font-semibold mb-2 text-gray-800">{partyname}</h3>
//       <table className="w-full border-collapse bg-white shadow-md rounded-lg">
//         <thead>
//           <tr className="bg-blue-900 text-white">
//             <th className="border p-2">Date</th>
//             <th className="border p-2">Debit (-)</th>
//             <th className="border p-2">Credit (+)</th>
//             <th className="border p-2">Remark</th>
//             <th className="border p-2">Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {currentAccounts.map((account, index) => (
//             <tr key={account._id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
//               <td className="border p-2">{new Date(account.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
//               <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
//               <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
//               <td className="border p-2">{account.remark || 'N/A'}</td>
//               <td className="border p-2">
//                 <button
//                   onClick={() => !account.verified && onEdit(account)}
//                   className={`bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
//                   disabled={account.verified}
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => !account.verified && onDelete(account._id)}
//                   className={`bg-red-500 text-white px-2 py-1 rounded mr-2 hover:bg-red-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
//                   disabled={account.verified}
//                 >
//                   Delete
//                 </button>
//                 <button
//                   onClick={() => onVerify(account._id)}
//                   className={`bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
//                   disabled={account.verified}
//                 >
//                   {account.verified ? 'Verified' : 'Verify'}
//                 </button>
//               </td>
//             </tr>
//           ))}
//           <tr className="bg-gray-200 font-bold">
//             <td className="border p-2">Total</td>
//             <td className="border p-2 text-red-600">{totalDebit.toFixed(2)}</td>
//             <td className="border p-2 text-green-600">{totalCredit.toFixed(2)}</td>
//             <td className="border p-2"></td>
//             <td className="border p-2"></td>
//           </tr>
//           <tr className="bg-gray-300 font-bold">
//             <td className="border p-2">Balance</td>
//             <td className={`border p-2 ${balanceColor}`} colSpan="4">₹{balValue} {balSign}</td>
//           </tr>
//         </tbody>
//       </table>
//       <div className="flex justify-between mt-4">
//         <p>Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedAccounts.length)} of {accounts.length} entries</p>
//         <div>
//           <button
//             disabled={currentPage === 1}
//             onClick={() => setCurrentPage(currentPage - 1)}
//             className="bg-gray-300 text-gray-800 px-2 py-1 rounded mr-2 hover:bg-gray-400 disabled:opacity-50"
//           >
//             Previous
//           </button>
//           <span>Page {currentPage} of {totalPages}</span>
//           <button
//             disabled={currentPage === totalPages}
//             onClick={() => setCurrentPage(currentPage + 1)}
//             className="bg-gray-300 text-gray-800 px-2 py-1 rounded ml-2 hover:bg-gray-400 disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Account Component
// const Account = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { accounts, parties, loading, error } = useSelector((state) => state.account);
//   const [formData, setFormData] = useState({
//     partyname: '',
//     amount: '',
//     transactionType: 'credit',
//     remark: '',
//     date: new Date().toISOString().split('T')[0], // Default to today's date
//   });
//   const [editId, setEditId] = useState(null);
//   const [entriesPerPage] = useState(10); // Fixed to 10 entries as per requirement
//   const API_URL = process.env.REACT_APP_API_URL;

//   // Prepare options for react-select
//   const partyOptions = [
//     { value: '', label: 'Select a Party' },
//     ...parties.map((party) => ({ value: party._id, label: party.partyname })),
//   ];

//   useEffect(() => {
//     dispatch(fetchParties()).unwrap().catch((err) => {
//       if (err === 'No token available' || err.includes('Invalid token')) {
//         navigate('/');
//       }
//     });
//     dispatch(fetchAccounts()).unwrap().catch((err) => {
//       if (err === 'No token available' || err.includes('Invalid token')) {
//         navigate('/');
//       }
//     });
//   }, [dispatch, navigate]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handlePartyInputChange = (selectedOption) => {
//     setFormData({ ...formData, partyname: selectedOption ? selectedOption.value : '' });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.partyname || !formData.amount || !formData.date) {
//       alert('Party name, amount, and date are required');
//       return;
//     }
//     const accountData = {
//       partyname: formData.partyname,
//       credit: formData.transactionType === 'credit' ? parseFloat(formData.amount) : 0,
//       debit: formData.transactionType === 'debit' ? parseFloat(formData.amount) : 0,
//       remark: formData.remark,
//       date: formData.date, // Send date as-is from the form
//     };
//     if (editId) {
//       dispatch(updateAccount({ id: editId, ...accountData }))
//         .unwrap()
//         .then(() => {
//           showMessages(accountData.credit, accountData.debit, formData.partyname);
//           dispatch(fetchAccounts());
//           setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date });
//           setEditId(null);
//         })
//         .catch((err) => {
//           if (err === 'No token available' || err.includes('Invalid token')) {
//             navigate('/');
//           }
//         });
//     } else {
//       dispatch(createAccount(accountData))
//         .unwrap()
//         .then(() => {
//           showMessages(accountData.credit, accountData.debit, formData.partyname);
//           dispatch(fetchAccounts());
//           setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date });
//         })
//         .catch((err) => {
//           if (err === 'No token available' || err.includes('Invalid token')) {
//             navigate('/');
//           }
//         });
//     }
//   };

//   const showMessages = (credit, debit, partyId) => {
//     const selectedParty = parties.find((p) => p._id === partyId);
//     const partyName = selectedParty ? selectedParty.partyname : 'this party';
//   };

//   const handleEdit = (account) => {
//     if (account.verified) {
//       alert('This account is verified and cannot be edited.');
//       return;
//     }
//     setFormData({
//       partyname: account.partyname._id,
//       amount: account.credit > 0 ? account.credit : account.debit,
//       transactionType: account.credit > 0 ? 'credit' : 'debit',
//       remark: account.remark || '',
//       date: new Date(account.date).toISOString().split('T')[0],
//     });
//     setEditId(account._id);
//   };

//   const handleDelete = (id) => {
//     const account = accounts.find((acc) => acc._id === id);
//     if (account.verified) {
//       alert('This account is verified and cannot be deleted.');
//       return;
//     }
//     dispatch(deleteAccount(id))
//       .unwrap()
//       .then(() => {
//         dispatch(fetchAccounts());
//       })
//       .catch((err) => {
//         if (err === 'No token available' || err.includes('Invalid token')) {
//           navigate('/');
//         }
//       });
//   };

//   const handleVerify = (id) => {
//     dispatch(verifyAccount(id))
//       .unwrap()
//       .then(() => {
//         dispatch(fetchAccounts());
//       })
//       .catch((err) => {
//         if (err === 'No token available' || err.includes('Invalid token')) {
//           navigate('/');
//         }
//       });
//   };

//   const handleDownload = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       navigate('/');
//       return;
//     }
//     let url = `${API_URL}/accounts/statement/download`;
//     if (formData.partyname) {
//       url += `?party=${formData.partyname}`;
//     }
//     try {
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const contentType = response.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         throw new Error('Invalid response: Expected JSON data, but received binary (e.g., PDF). Check backend.');
//       }
//       const grouped = await response.json();
//       if (!grouped || typeof grouped !== 'object' || Object.keys(grouped).length === 0) {
//         throw new Error('Invalid or empty data received from server');
//       }
//       const formatDate = (date) => {
//         const options = { day: 'numeric', month: 'short', year: 'numeric' };
//         return new Date(date).toLocaleDateString('en-GB', options);
//       };
//       Object.keys(grouped).forEach((pId) => {
//         const doc = new jsPDF();
//         let y = 20;
//         let page = 1;
//         const group = grouped[pId];
//         if (!group || !group.accounts || group.accounts.length === 0) {
//           console.warn('Skipping empty group:', pId);
//           return;
//         }
//         const party = parties.find((p) => p._id === pId);
//         if (!party) {
//           console.warn('Party not found for ID:', pId);
//           return;
//         }
//         // Header
//         doc.setFillColor(0, 51, 102);
//         doc.rect(0, 0, 210, 15, 'F');
//         doc.setTextColor(255, 255, 255);
//         doc.setFontSize(14);
//         doc.setFont('helvetica', 'bold');
//         doc.text(`${party.partyname} Statement`, 10, 10);
//         doc.setFontSize(12);
//         doc.setTextColor(0, 0, 0);
//         doc.setFont('helvetica', 'bold');
//         y += 7;
//         // Balance
//         const balance = group.totalDebit - group.totalCredit;
//         const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
//         const balValue = Math.abs(balance).toFixed(2);
//         doc.setFontSize(10);
//         doc.setTextColor(100, 100, 100);
//         doc.text(`Balance: ₹${balValue} ${balSign}`, 10, y);
//         if (balance !== 0) {
//           doc.text(`(${party.partyname} will ${balance > 0 ? 'give' : 'receive'})`, 140, y);
//         }
//         y += 10;
//         // Table Header
//         const tableX = 10;
//         const tableWidth = 190;
//         const colWidths = [40, 40, 40, 40, 30];
//         const rowHeight = 8;
//         const tableStartY = y;
//         doc.setFillColor(0, 51, 102);
//         doc.rect(tableX, y, tableWidth, rowHeight, 'F');
//         doc.setTextColor(255, 255, 255);
//         doc.setFontSize(10);
//         doc.setFont('helvetica', 'bold');
//         doc.text('Date', tableX + 2, y + 6);
//         doc.text('Debit (-)', tableX + 42, y + 6);
//         doc.text('Credit (+)', tableX + 82, y + 6);
//         doc.text('Balance', tableX + 122, y + 6);
//         doc.text('Remark', tableX + 162, y + 6);
//         y += rowHeight;
//         // Table Rows
//         doc.setFont('helvetica', 'normal');
//         doc.setTextColor(0, 0, 0);
//         let currentBalance = 0;
//         group.accounts.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((acc, rowIndex) => {
//           currentBalance += acc.debit - acc.credit;
//           const curBalSign = currentBalance > 0 ? 'Dr' : currentBalance < 0 ? 'Cr' : '';
//           const curBalValue = Math.abs(currentBalance).toFixed(2);
//           if (rowIndex % 2 === 0) {
//             doc.setFillColor(240, 240, 240);
//             doc.rect(tableX, y, tableWidth, rowHeight, 'F');
//           }
//           doc.setDrawColor(150, 150, 150);
//           doc.rect(tableX, y, tableWidth, rowHeight);
//           let x = tableX;
//           colWidths.forEach((width, i) => {
//             doc.rect(x, y, width, rowHeight);
//             x += width;
//           });
//           doc.setFontSize(9);
//           doc.text(formatDate(acc.date), tableX + 2, y + 6);
//           if (acc.debit > 0) {
//             doc.setTextColor(255, 0, 0);
//             doc.text(acc.debit.toFixed(2), tableX + 42, y + 6);
//           }
//           if (acc.credit > 0) {
//             doc.setTextColor(0, 128, 0);
//             doc.text(acc.credit.toFixed(2), tableX + 82, y + 6);
//           }
//           doc.setTextColor(0, 0, 0);
//           doc.text(`${curBalValue} ${curBalSign}`, tableX + 122, y + 6);
//           const remarkText = (acc.remark || '').length > 20 ? `${acc.remark.substring(0, 20)}...` : acc.remark || '';
//           doc.text(remarkText, tableX + 162, y + 6);
//           y += rowHeight;
//           if (y > 260) {
//             doc.addPage();
//             y = 20;
//             page++;
//             doc.setFillColor(0, 51, 102);
//             doc.rect(0, 0, 210, 15, 'F');
//             doc.setTextColor(255, 255, 255);
//             doc.setFontSize(14);
//             doc.setFont('helvetica', 'bold');
//             doc.text(`${party.partyname} Statement`, 10, 10);
//             y = tableStartY;
//             doc.setFillColor(0, 51, 102);
//             doc.rect(tableX, y, tableWidth, rowHeight, 'F');
//             doc.setTextColor(255, 255, 255);
//             doc.setFontSize(10);
//             doc.setFont('helvetica', 'bold');
//             doc.text('Date', tableX + 2, y + 6);
//             doc.text('Debit (-)', tableX + 42, y + 6);
//             doc.text('Credit (+)', tableX + 82, y + 6);
//             doc.text('Balance', tableX + 122, y + 6);
//             doc.text('Remark', tableX + 162, y + 6);
//             y += rowHeight;
//           }
//         });
//         // Grand Total
//         doc.setFillColor(200, 200, 200);
//         doc.rect(tableX, y, tableWidth, rowHeight, 'F');
//         doc.setFont('helvetica', 'bold');
//         doc.text('Grand Total', tableX + 2, y + 6);
//         doc.setTextColor(255, 0, 0);
//         doc.text(group.totalDebit.toFixed(2), tableX + 42, y + 6);
//         doc.setTextColor(0, 128, 0);
//         doc.text(group.totalCredit.toFixed(2), tableX + 82, y + 6);
//         doc.setTextColor(0, 0, 0);
//         doc.text(`${balValue} ${balSign}`, tableX + 122, y + 6);
//         y += rowHeight + 10;
//         // Report Generation Time
//         const now = new Date();
//         const hours = now.getHours() % 12 || 12;
//         const minutes = String(now.getMinutes()).padStart(2, '0');
//         const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
//         const genDate = formatDate(now).replace(/\d{4}$/, `'${now.getFullYear().toString().slice(2)}`);
//         const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
//         doc.setFontSize(9);
//         doc.setTextColor(100, 100, 100);
//         doc.text(`Report Generated: ${genTime}`, tableX, y);
//         y += 15;
//         // Save PDF with party name
//         doc.save(`${party.partyname}_account_statement.pdf`);
//       });
//     } catch (error) {
//       console.error('Detailed error in handleDownload:', error);
//       alert('Error generating statement: ' + error.message);
//     }
//   };

//   // Group accounts by party for selected party
//   const groupedAccounts = formData.partyname
//     ? parties.reduce((acc, party) => {
//         if (party._id === formData.partyname) {
//           const partyAccounts = accounts.filter((account) => account.partyname?._id === party._id);
//           if (partyAccounts.length > 0) {
//             acc[party._id] = {
//               partyname: party.partyname,
//               accounts: partyAccounts,
//             };
//           }
//         }
//         return acc;
//       }, {})
//     : {};

//   return (
//     <div className="container mx-auto p-4 bg-white shadow-lg rounded-lg">
//       {/* Form */}
//       <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
//         <div>
//           <label className="block mb-1 font-medium text-gray-700">Party Name</label>
//           <Select
//             options={partyOptions.filter(option => option.value !== '')}
//             value={partyOptions.find(option => option.value === formData.partyname) || null}
//             onChange={handlePartyInputChange}
//             placeholder="Select or type to search party"
//             className="w-full"
//             classNamePrefix="select"
//             isClearable
//             isSearchable
//             styles={{
//               control: (base) => ({
//                 ...base,
//                 borderColor: '#d1d5db',
//                 padding: '2px',
//                 borderRadius: '0.375rem',
//                 boxShadow: 'none',
//                 '&:hover': {
//                   borderColor: '#3b82f6',
//                 },
//                 '&:focus': {
//                   borderColor: '#3b82f6',
//                   boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
//                 },
//               }),
//             }}
//           />
//         </div>
//         <div>
//           <label className="block mb-1 font-medium text-gray-700">Transaction Type</label>
//           <select
//             name="transactionType"
//             value={formData.transactionType}
//             onChange={handleInputChange}
//             className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="credit">Credit(Dena)</option>
//             <option value="debit">Debit(Lena)</option>
//           </select>
//         </div>
//         <div>
//           <label className="block mb-1 font-medium text-gray-700">Amount</label>
//           <input
//             type="number"
//             name="amount"
//             value={formData.amount}
//             onChange={handleInputChange}
//             placeholder="Enter amount"
//             className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>
//         <div>
//           <label className="block mb-1 font-medium text-gray-700">Date</label>
//           <input
//             type="date"
//             name="date"
//             value={formData.date}
//             onChange={handleInputChange}
//             className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>
//         <div>
//           <label className="block mb-1 font-medium text-gray-700">Remark (Optional)</label>
//           <input
//             type="text"
//             name="remark"
//             value={formData.remark}
//             onChange={handleInputChange}
//             placeholder="Enter remark"
//             className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//         <div className="flex gap-2">
//           <button
//             type="submit"
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200 col-span-1 md:col-auto"
//           >
//             {editId ? 'Update' : 'Submit'}
//           </button>
//           <button
//             type="button"
//             onClick={handleDownload}
//             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200 col-span-1 md:col-auto"
//           >
//             Download Statement
//           </button>
//         </div>
//       </form>

//       {loading && <p className="text-blue-600">Loading...</p>}
//       {error && <p className="text-red-600">{error}</p>}
//       <div className="mb-6">
//         {formData.partyname && groupedAccounts[formData.partyname] ? (
//           <PartyAccountTable
//             partyname={groupedAccounts[formData.partyname].partyname}
//             accounts={groupedAccounts[formData.partyname].accounts}
//             onEdit={handleEdit}
//             onDelete={handleDelete}
//             onVerify={handleVerify}
//             entriesPerPage={entriesPerPage}
//           />
//         ) : formData.partyname ? (
//           <p className="text-gray-600">No accounts available for selected party.</p>
//         ) : (
//           null
//         )}
//       </div>
//     </div>
//   );
// };

// export default Account;


import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties, verifyAccount } from '../redux/accountSlice';
import { jsPDF } from 'jspdf';
import Select from 'react-select';

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accounts, parties, loading, error } = useSelector((state) => state.account);
  const [formData, setFormData] = useState({
    partyname: '',
    amount: '',
    transactionType: 'credit',
    remark: '',
    date: new Date().toISOString().split('T')[0], // Default to today's date
  });
  const [editId, setEditId] = useState(null);
  const [entriesPerPage] = useState(10); // Fixed to 10 entries as per requirement
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const API_URL = process.env.REACT_APP_API_URL;

  // Prepare options for react-select
  const partyOptions = [
    { value: '', label: 'Select a Party' },
    ...parties.map((party) => ({ value: party._id, label: party.partyname })),
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
    setCurrentPage(1); // Reset to first page when party changes
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

  // Add confirmation alert before deletion
  if (!window.confirm('Are you sure you want to delete this account?')) {
    return; // Exit if user cancels
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
        // Header
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${party.partyname} Statement`, 10, 10);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        y += 7;
        // Balance
        const balance = group.totalDebit - group.totalCredit;
        const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
        const balValue = Math.abs(balance).toFixed(2);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Balance: ₹${balValue} ${balSign}`, 10, y);
        if (balance !== 0) {
          doc.text(`(${party.partyname} will ${balance > 0 ? 'give' : 'receive'})`, 140, y);
        }
        y += 10;
        // Table Header
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
        // Table Rows
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
        // Grand Total
        doc.setFillColor(200, 200, 200);
        doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Grand Total', tableX + 2, y + 6);
        doc.setTextColor(255, 0, 0);
        doc.text(group.totalDebit.toFixed(2), tableX + 42, y + 6);
        doc.setTextColor(0, 128, 0);
        doc.text(group.totalCredit.toFixed(2), tableX + 82, y + 6);
        doc.setTextColor(0, 0, 0);
        doc.text(`${balValue} ${balSign}`, tableX + 122, y + 6);
        y += rowHeight + 10;
        // Report Generation Time
        const now = new Date();
        const hours = now.getHours() % 12 || 12;
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        const genDate = formatDate(now).replace(/\d{4}$/, `'${now.getFullYear().toString().slice(2)}`);
        const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Report Generated: ${genTime}`, tableX, y);
        y += 15;
        // Save PDF with party name
        doc.save(`${party.partyname}_account_statement.pdf`);
      });
    } catch (error) {
      console.error('Detailed error in handleDownload:', error);
      alert('Error generating statement: ' + error.message);
    }
  };

  // Group accounts by party for selected party
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

  // Table logic for selected party
  const selectedPartyAccounts = formData.partyname && groupedAccounts[formData.partyname] ? groupedAccounts[formData.partyname].accounts : [];
  const sortedAccounts = [...(selectedPartyAccounts || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
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
    <div className="container mx-auto p-4 bg-white shadow-lg rounded-lg">
      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
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
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200 col-span-1 md:col-auto"
          >
            {editId ? 'Update' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200 col-span-1 md:col-auto"
          >
            Download Statement
          </button>
        </div>
      </form>

      {loading && <p className="text-blue-600">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="mb-6">
        {formData.partyname && groupedAccounts[formData.partyname] ? (
          <div className="mb-8 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">{groupedAccounts[formData.partyname].partyname}</h3>
            {selectedPartyAccounts.length === 0 ? (
              <p className="text-gray-600">No accounts available for {groupedAccounts[formData.partyname].partyname}.</p>
            ) : (
              <>
                <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="border p-2">Date</th>
                      <th className="border p-2">Debit (-)</th>
                      <th className="border p-2">Credit (+)</th>
                      <th className="border p-2">Remark</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAccounts.map((account, index) => (
                      <tr key={account._id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                        <td className="border p-2">{new Date(account.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
                        <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
                        <td className="border p-2">{account.remark || 'N/A'}</td>
                        <td className="border p-2">
                          <button
                            onClick={() => !account.verified && handleEdit(account)}
                            className={`bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={account.verified}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => !account.verified && handleDelete(account._id)}
                            className={`bg-red-500 text-white px-2 py-1 rounded mr-2 hover:bg-red-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={account.verified}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleVerify(account._id)}
                            className={`bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={account.verified}
                          >
                            {account.verified ? 'Verified' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-bold">
                      <td className="border p-2">Total</td>
                      <td className="border p-2 text-red-600">{totalDebit.toFixed(2)}</td>
                      <td className="border p-2 text-green-600">{totalCredit.toFixed(2)}</td>
                      <td className="border p-2"></td>
                      <td className="border p-2"></td>
                    </tr>
                    <tr className="bg-gray-300 font-bold">
                      <td className="border p-2">Balance</td>
                      <td className={`border p-2 ${balanceColor}`} colSpan="4">₹{balValue} {balSign}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-between mt-4">
                  <p>Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedAccounts.length)} of {selectedPartyAccounts.length} entries</p>
                  <div>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="bg-gray-300 text-gray-800 px-2 py-1 rounded mr-2 hover:bg-gray-400 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="bg-gray-300 text-gray-800 px-2 py-1 rounded ml-2 hover:bg-gray-400 disabled:opacity-50"
                    >
                      Next
                    </button>
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
  );
};

export default Account;