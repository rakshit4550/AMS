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
//     credit: '',
//     debit: '',
//     remark: '',
//   });
//   const [editId, setEditId] = useState(null);
//   const [downloadParty, setDownloadParty] = useState('');

// const API_URL = process.env.REACT_APP_API_URL


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
//     if (!formData.partyname || (!formData.credit && !formData.debit)) {
//       alert('Party name and at least one of credit or debit are required');
//       return;
//     }
//     const accountData = {
//       partyname: formData.partyname,
//       credit: parseFloat(formData.credit) || 0,
//       debit: parseFloat(formData.debit) || 0,
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
//     setFormData({ partyname: '', credit: '', debit: '', remark: '' });
//   };

//   const showMessages = (credit, debit, partyId) => {
//     const selectedParty = parties.find((p) => p._id === partyId);
//     const partyName = selectedParty ? selectedParty.partyname : 'this party';
//   };

//   const handleEdit = (account) => {
//     setFormData({
//       partyname: account.partyname._id,
//       credit: account.credit || '',
//       debit: account.debit || '',
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
//         throw new Error('Failed to fetch statement data');
//       }
//       const grouped = await response.json();

//       const doc = new jsPDF();
//       let y = 20;
//       let page = 1;

//       const formatDate = (date) => {
//         const options = { day: 'numeric', month: 'short', year: 'numeric' };
//         return new Date(date).toLocaleDateString('en-GB', options);
//       };

//       Object.keys(grouped).forEach((pId, index) => {
//         if (index > 0) {
//           doc.addPage();
//           y = 20;
//           page++;
//         }

//         const group = grouped[pId];
//         const party = parties.find((p) => p._id === pId);

//         doc.setFillColor(0, 51, 102);
//         doc.rect(0, 0, 210, 15, 'F');
//         doc.setTextColor(255, 255, 255);
//         doc.setFontSize(14);
//         doc.setFont('helvetica', 'bold');
//         doc.text(`${group.name} Statement`, 10, 10);

//         if (!group.accounts || group.accounts.length === 0) return;

//         doc.setFontSize(12);
//         doc.setTextColor(0, 0, 0);
//         doc.setFont('helvetica', 'bold');
//         y += 7;

//         const balance = group.totalDebit - group.totalCredit;
//         const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
//         const balValue = Math.abs(balance).toFixed(2);
//         doc.setFontSize(10);
//         doc.setTextColor(100, 100, 100);
//         doc.text(`Balance: ₹${balValue} ${balSign}`, 10, y);
//         if (balance !== 0) {
//           doc.text(`(${group.name} will ${balance > 0 ? 'give' : 'receive'})`, 140, y);
//         }
//         y += 10;

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
//           doc.text(acc.remark || '', tableX + 162, y + 6, { maxWidth: 28 });

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
//             doc.text(`${group.name} Statement`, 10, 10);

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

//         doc.setFillColor(0, 51, 102);
//         doc.rect(0, 280, 210, 17, 'F');
//         doc.setTextColor(255, 255, 255);
//         doc.setFontSize(9);
//         doc.setTextColor(100, 100, 100);
//         doc.text(`Page ${index + 1} of ${Object.keys(grouped).length}`, 180, 290);
//       });

//       doc.save('account_statement.pdf');
//     } catch (error) {
//       alert('Error generating statement');
//     }
//   };

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
//           <label className="block mb-1">Credit</label>
//           <input
//             type="number"
//             name="credit"
//             value={formData.credit}
//             onChange={handleInputChange}
//             placeholder="Enter credit amount"
//             className="border p-2 rounded w-full"
//           />
//         </div>
//         <div>
//           <label className="block mb-1">Debit</label>
//           <input
//             type="number"
//             name="debit"
//             value={formData.debit}
//             onChange={handleInputChange}
//             placeholder="Enter debit amount"
//             className="border p-2 rounded w-full"
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

//       <ul className="space-y-2">
//         {accounts.map((account) => (
//           <li key={account._id} className="flex justify-between items-center border p-2 rounded">
//             <div>
//               <p>Party: {account.partyname?.partyname || 'Unknown'}</p>
//               <p className="text-green-600">Credit: {account.credit}</p>
//               <p className="text-red-600">Debit: {account.debit}</p>
//               <p>Remark: {account.remark || 'N/A'}</p>
//               <p>Date: {new Date(account.date).toLocaleDateString()}</p>
//             </div>
//             <div>
//               <button
//                 onClick={() => handleEdit(account)}
//                 className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
//               >
//                 Edit
//               </button>
//               <button
//                 onClick={() => handleDelete(account._id)}
//                 className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
//               >
//                 Delete
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>
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
    credit: '',
    debit: '',
    remark: '',
  });
  const [editId, setEditId] = useState(null);
  const [downloadParty, setDownloadParty] = useState('');

  const API_URL = process.env.REACT_APP_API_URL

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
    if (!formData.partyname || (!formData.credit && !formData.debit)) {
      alert('Party name and at least one of credit or debit are required');
      return;
    }
    const accountData = {
      partyname: formData.partyname,
      credit: parseFloat(formData.credit) || 0,
      debit: parseFloat(formData.debit) || 0,
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
    setFormData({ partyname: '', credit: '', debit: '', remark: '' });
  };

  const showMessages = (credit, debit, partyId) => {
    const selectedParty = parties.find((p) => p._id === partyId);
    const partyName = selectedParty ? selectedParty.partyname : 'this party';
  };

  const handleEdit = (account) => {
    setFormData({
      partyname: account.partyname._id,
      credit: account.credit || '',
      debit: account.debit || '',
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
      const grouped = await response.json();

      // Validate data structure
      if (!grouped || typeof grouped !== 'object' || Object.keys(grouped).length === 0) {
        throw new Error('Invalid or empty data received from server');
      }

      console.log('Grouped data:', grouped);  // Debug: Check structure in console

      const doc = new jsPDF();
      let y = 20;
      let page = 1;

      const formatDate = (date) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(date).toLocaleDateString('en-GB', options);
      };

      Object.keys(grouped).forEach((pId, index) => {
        if (index > 0) {
          doc.addPage();
          y = 20;
          page++;
        }

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
        doc.text(`${group.name} Statement`, 10, 10);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        y += 7;

        const balance = group.totalDebit - group.totalCredit;
        const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
        const balValue = Math.abs(balance).toFixed(2);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Balance: ₹${balValue} ${balSign}`, 10, y);
        if (balance !== 0) {
          doc.text(`(${group.name} will ${balance > 0 ? 'give' : 'receive'})`, 140, y);
        }
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
          // Truncate long remarks and remove maxWidth to avoid jsPDF rendering errors
          const remarkText = (acc.remark || '').length > 20 ? `${acc.remark.substring(0, 20)}...` : acc.remark || '';
          doc.text(remarkText, tableX + 162, y + 6);  // No maxWidth

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
            doc.text(`${group.name} Statement`, 10, 10);

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

        doc.setFillColor(0, 51, 102);
        doc.rect(0, 280, 210, 17, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${index + 1} of ${Object.keys(grouped).length}`, 180, 290);
      });

      doc.save('account_statement.pdf');
    } catch (error) {
      console.error('Detailed error in handleDownload:', error);  // Debug: Check console for exact error
      alert('Error generating statement: ' + error.message);
    }
  };

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
          <label className="block mb-1">Credit</label>
          <input
            type="number"
            name="credit"
            value={formData.credit}
            onChange={handleInputChange}
            placeholder="Enter credit amount"
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Debit</label>
          <input
            type="number"
            name="debit"
            value={formData.debit}
            onChange={handleInputChange}
            placeholder="Enter debit amount"
            className="border p-2 rounded w-full"
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

      <ul className="space-y-2">
        {accounts.map((account) => (
          <li key={account._id} className="flex justify-between items-center border p-2 rounded">
            <div>
              <p>Party: {account.partyname?.partyname || 'Unknown'}</p>
              <p className="text-green-600">Credit: {account.credit}</p>
              <p className="text-red-600">Debit: {account.debit}</p>
              <p>Remark: {account.remark || 'N/A'}</p>
              <p>Date: {new Date(account.date).toLocaleDateString()}</p>
            </div>
            <div>
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Account;