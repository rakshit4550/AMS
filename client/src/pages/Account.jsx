// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties } from '../redux/accountSlice';
// import { jsPDF } from 'jspdf';

// const Account = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { accounts, parties, loading, error } = useSelector((state) => state.account);
//   const [formData, setFormData] = useState({
//     partyname: '',
//     amount: '',
//     transactionType: 'credit',
//     remark: '',
//   });
//   const [editId, setEditId] = useState(null);
//   const [downloadParty, setDownloadParty] = useState('');
//   const API_URL = process.env.REACT_APP_API_URL;

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

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.partyname || !formData.amount) {
//       alert('Party name and amount are required');
//       return;
//     }
//     const accountData = {
//       partyname: formData.partyname,
//       credit: formData.transactionType === 'credit' ? parseFloat(formData.amount) : 0,
//       debit: formData.transactionType === 'debit' ? parseFloat(formData.amount) : 0,
//       remark: formData.remark,
//     };
//     if (editId) {
//       dispatch(updateAccount({ id: editId, ...accountData }))
//         .unwrap()
//         .then(() => {
//           showMessages(accountData.credit, accountData.debit, formData.partyname);
//           dispatch(fetchAccounts());
//         })
//         .catch((err) => {
//           if (err === 'No token available' || err.includes('Invalid token')) {
//             navigate('/');
//           }
//         });
//       setEditId(null);
//     } else {
//       dispatch(createAccount(accountData))
//         .unwrap()
//         .then(() => {
//           showMessages(accountData.credit, accountData.debit, formData.partyname);
//           dispatch(fetchAccounts());
//         })
//         .catch((err) => {
//           if (err === 'No token available' || err.includes('Invalid token')) {
//             navigate('/');
//           }
//         });
//     }
//     setFormData({ partyname: '', amount: '', transactionType: 'credit', remark: '' });
//   };

//   const showMessages = (credit, debit, partyId) => {
//     const selectedParty = parties.find((p) => p._id === partyId);
//     const partyName = selectedParty ? selectedParty.partyname : 'this party';
//   };

//   const handleEdit = (account) => {
//     setFormData({
//       partyname: account.partyname._id,
//       amount: account.credit > 0 ? account.credit : account.debit,
//       transactionType: account.credit > 0 ? 'credit' : 'debit',
//       remark: account.remark || '',
//     });
//     setEditId(account._id);
//   };

//   const handleDelete = (id) => {
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

//   const handleDownload = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       navigate('/');
//       return;
//     }
//     let url = `${API_URL}/accounts/statement/download`;
//     if (downloadParty) {
//       url += `?party=${downloadParty}`;
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

//   // Filter last 10 entries for selected party
//   const selectedPartyAccounts = formData.partyname
//     ? accounts
//         .filter((account) => account.partyname._id === formData.partyname)
//         .sort((a, b) => new Date(b.date) - new Date(a.date))
//         .slice(0, 10)
//     : [];

//   // Group accounts by party for separate tables
//   const groupedAccounts = parties.reduce((acc, party) => {
//     const partyAccounts = accounts.filter((account) => account.partyname?._id === party._id);
//     if (partyAccounts.length > 0) {
//       const totalDebit = partyAccounts.reduce((sum, account) => sum + account.debit, 0);
//       const totalCredit = partyAccounts.reduce((sum, account) => sum + account.credit, 0);
//       acc[party._id] = {
//         partyname: party.partyname,
//         accounts: partyAccounts,
//         totalDebit,
//         totalCredit,
//       };
//     }
//     return acc;
//   }, {});

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Account Management</h1>
//       <form onSubmit={handleSubmit} className="mb-6 space-y-4">
//         <div>
//           <label className="block mb-1">Party Name</label>
//           <select
//             name="partyname"
//             value={formData.partyname}
//             onChange={handleInputChange}
//             className="border p-2 rounded w-full"
//             required
//           >
//             <option value="">Select Party</option>
//             {parties.map((party) => (
//               <option key={party._id} value={party._id}>{party.partyname}</option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block mb-1">Transaction Type</label>
//           <select
//             name="transactionType"
//             value={formData.transactionType}
//             onChange={handleInputChange}
//             className="border p-2 rounded w-full"
//           >
//             <option value="credit">Credit</option>
//             <option value="debit">Debit</option>
//           </select>
//         </div>
//         <div>
//           <label className="block mb-1">Amount</label>
//           <input
//             type="number"
//             name="amount"
//             value={formData.amount}
//             onChange={handleInputChange}
//             placeholder="Enter amount"
//             className="border p-2 rounded w-full"
//             required
//           />
//         </div>
//         <div>
//           <label className="block mb-1">Remark (Optional)</label>
//           <input
//             type="text"
//             name="remark"
//             value={formData.remark}
//             onChange={handleInputChange}
//             placeholder="Enter remark"
//             className="border p-2 rounded w-full"
//           />
//         </div>
//         <button
//           type="submit"
//           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//         >
//           {editId ? 'Update Account' : 'Add Account'}
//         </button>
//       </form>
//       {formData.partyname && selectedPartyAccounts.length > 0 && (
//         <div className="mb-6">
//           <h2 className="text-xl font-bold mb-2">Last 10 Entries for Selected Party</h2>
//           <table className="w-full border-collapse">
//             <thead>
//               <tr className="bg-blue-900 text-white">
//                 <th className="border p-2">Date</th>
//                 <th className="border p-2">Debit (-)</th>
//                 <th className="border p-2">Credit (+)</th>
//                 <th className="border p-2">Remark</th>
//                 <th className="border p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {selectedPartyAccounts.map((account, index) => (
//                 <tr key={account._id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
//                   <td className="border p-2">{new Date(account.date).toLocaleDateString()}</td>
//                   <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
//                   <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
//                   <td className="border p-2">{account.remark || 'N/A'}</td>
//                   <td className="border p-2">
//                     <button
//                       onClick={() => handleEdit(account)}
//                       className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(account._id)}
//                       className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//       <div className="mb-4">
//         <label className="block mb-1">Download Statement for Party</label>
//         <select
//           value={downloadParty}
//           onChange={(e) => setDownloadParty(e.target.value)}
//           className="border p-2 rounded w-full"
//         >
//           <option value="">All Parties</option>
//           {parties.map((party) => (
//             <option key={party._id} value={party._id}>{party.partyname}</option>
//           ))}
//         </select>
//       </div>
//       <button
//         onClick={handleDownload}
//         className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-6"
//       >
//         Download Statement
//       </button>
//       {loading && <p>Loading...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       <div className="mb-6">
//         <h2 className="text-xl font-bold mb-2">All Accounts</h2>
//         {Object.keys(groupedAccounts).length > 0 ? (
//           Object.keys(groupedAccounts).map((partyId) => (
//             <div key={partyId} className="mb-8">
//               <h3 className="text-lg font-semibold mb-2">{groupedAccounts[partyId].partyname}</h3>
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-blue-900 text-white">
//                     <th className="border p-2">Date</th>
//                     <th className="border p-2">Debit (-)</th>
//                     <th className="border p-2">Credit (+)</th>
//                     <th className="border p-2">Remark</th>
//                     <th className="border p-2">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {groupedAccounts[partyId].accounts.map((account, index) => (
//                     <tr key={account._id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
//                       <td className="border p-2">{new Date(account.date).toLocaleDateString()}</td>
//                       <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
//                       <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
//                       <td className="border p-2">{account.remark || 'N/A'}</td>
//                       <td className="border p-2">
//                         <button
//                           onClick={() => handleEdit(account)}
//                           className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
//                         >
//                           Edit
//                         </button>
//                         <button
//                           onClick={() => handleDelete(account._id)}
//                           className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
//                         >
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                   <tr className="bg-gray-200 font-bold">
//                     <td className="border p-2">Total</td>
//                     <td className="border p-2 text-red-600">{groupedAccounts[partyId].totalDebit.toFixed(2)}</td>
//                     <td className="border p-2 text-green-600">{groupedAccounts[partyId].totalCredit.toFixed(2)}</td>
//                     <td className="border p-2"></td>
//                     <td className="border p-2"></td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           ))
//         ) : (
//           <p>No accounts available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Account;


import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties } from '../redux/accountSlice';
import { jsPDF } from 'jspdf';

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accounts, parties, loading, error } = useSelector((state) => state.account);
  const [formData, setFormData] = useState({
    partyname: '',
    amount: '',
    transactionType: 'credit',
    remark: '',
  });
  const [editId, setEditId] = useState(null);
  const [downloadParty, setDownloadParty] = useState('');
  const API_URL = process.env.REACT_APP_API_URL;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.partyname || !formData.amount) {
      alert('Party name and amount are required');
      return;
    }
    const accountData = {
      partyname: formData.partyname,
      credit: formData.transactionType === 'credit' ? parseFloat(formData.amount) : 0,
      debit: formData.transactionType === 'debit' ? parseFloat(formData.amount) : 0,
      remark: formData.remark,
    };
    if (editId) {
      dispatch(updateAccount({ id: editId, ...accountData }))
        .unwrap()
        .then(() => {
          showMessages(accountData.credit, accountData.debit, formData.partyname);
          dispatch(fetchAccounts());
        })
        .catch((err) => {
          if (err === 'No token available' || err.includes('Invalid token')) {
            navigate('/');
          }
        });
      setEditId(null);
    } else {
      dispatch(createAccount(accountData))
        .unwrap()
        .then(() => {
          showMessages(accountData.credit, accountData.debit, formData.partyname);
          dispatch(fetchAccounts());
        })
        .catch((err) => {
          if (err === 'No token available' || err.includes('Invalid token')) {
            navigate('/');
          }
        });
    }
    setFormData({ partyname: '', amount: '', transactionType: 'credit', remark: '' });
  };

  const showMessages = (credit, debit, partyId) => {
    const selectedParty = parties.find((p) => p._id === partyId);
    const partyName = selectedParty ? selectedParty.partyname : 'this party';
  };

  const handleEdit = (account) => {
    setFormData({
      partyname: account.partyname._id,
      amount: account.credit > 0 ? account.credit : account.debit,
      transactionType: account.credit > 0 ? 'credit' : 'debit',
      remark: account.remark || '',
    });
    setEditId(account._id);
  };

  const handleDelete = (id) => {
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

  const handleDownload = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    let url = `${API_URL}/accounts/statement/download`;
    if (downloadParty) {
      url += `?party=${downloadParty}`;
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

  // Filter last 10 entries for selected party
  const selectedPartyAccounts = formData.partyname
    ? accounts
        .filter((account) => account.partyname._id === formData.partyname)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
    : [];

  // Group accounts by party for separate tables
  const groupedAccounts = parties.reduce((acc, party) => {
    const partyAccounts = accounts.filter((account) => account.partyname?._id === party._id);
    if (partyAccounts.length > 0) {
      const totalDebit = partyAccounts.reduce((sum, account) => sum + account.debit, 0);
      const totalCredit = partyAccounts.reduce((sum, account) => sum + account.credit, 0);
      acc[party._id] = {
        partyname: party.partyname,
        accounts: partyAccounts,
        totalDebit,
        totalCredit,
      };
    }
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Account Management</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block mb-1">Party Name</label>
          <select
            name="partyname"
            value={formData.partyname}
            onChange={handleInputChange}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select Party</option>
            {parties.map((party) => (
              <option key={party._id} value={party._id}>{party.partyname}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Transaction Type</label>
          <select
            name="transactionType"
            value={formData.transactionType}
            onChange={handleInputChange}
            className="border p-2 rounded w-full"
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Remark (Optional)</label>
          <input
            type="text"
            name="remark"
            value={formData.remark}
            onChange={handleInputChange}
            placeholder="Enter remark"
            className="border p-2 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {editId ? 'Update Account' : 'Add Account'}
        </button>
      </form>
      {formData.partyname && selectedPartyAccounts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Last 10 Entries for Selected Party</h2>
          <table className="w-full border-collapse">
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
              {selectedPartyAccounts.map((account, index) => (
                <tr key={account._id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                  <td className="border p-2">{new Date(account.date).toLocaleDateString()}</td>
                  <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
                  <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
                  <td className="border p-2">{account.remark || 'N/A'}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(account._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mb-4">
        <label className="block mb-1">Download Statement for Party</label>
        <select
          value={downloadParty}
          onChange={(e) => setDownloadParty(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">All Parties</option>
          {parties.map((party) => (
            <option key={party._id} value={party._id}>{party.partyname}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleDownload}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-6"
      >
        Download Statement
      </button>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">All Accounts</h2>
        {formData.partyname ? (
          groupedAccounts[formData.partyname] ? (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">{groupedAccounts[formData.partyname].partyname}</h3>
              <table className="w-full border-collapse">
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
                  {groupedAccounts[formData.partyname].accounts.map((account, index) => (
                    <tr key={account._id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                      <td className="border p-2">{new Date(account.date).toLocaleDateString()}</td>
                      <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
                      <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
                      <td className="border p-2">{account.remark || 'N/A'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(account._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold">
                    <td className="border p-2">Total</td>
                    <td className="border p-2 text-red-600">{groupedAccounts[formData.partyname].totalDebit.toFixed(2)}</td>
                    <td className="border p-2 text-green-600">{groupedAccounts[formData.partyname].totalCredit.toFixed(2)}</td>
                    <td className="border p-2"></td>
                    <td className="border p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p>No accounts available for selected party.</p>
          )
        ) : Object.keys(groupedAccounts).length > 0 ? (
          Object.keys(groupedAccounts).map((partyId) => (
            <div key={partyId} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">{groupedAccounts[partyId].partyname}</h3>
              <table className="w-full border-collapse">
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
                  {groupedAccounts[partyId].accounts.map((account, index) => (
                    <tr key={account._id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                      <td className="border p-2">{new Date(account.date).toLocaleDateString()}</td>
                      <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
                      <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
                      <td className="border p-2">{account.remark || 'N/A'}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(account._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold">
                    <td className="border p-2">Total</td>
                    <td className="border p-2 text-red-600">{groupedAccounts[partyId].totalDebit.toFixed(2)}</td>
                    <td className="border p-2 text-green-600">{groupedAccounts[partyId].totalCredit.toFixed(2)}</td>
                    <td className="border p-2"></td>
                    <td className="border p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p>No accounts available.</p>
        )}
      </div>
    </div>
  );
};

export default Account;