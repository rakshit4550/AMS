// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties, verifyAccount, sendStatementEmail, importAccounts } from '../redux/accountSlice';
// import { jsPDF } from 'jspdf';
// import Select from 'react-select';
// import { FaPlus, FaEdit, FaTrash, FaCheck, FaFileDownload, FaArrowRight, FaEnvelope, FaUpload } from 'react-icons/fa';

// // Utility function to format numbers with commas
// const formatNumber = (number) => {
//   if (number === undefined || number === null || isNaN(number)) return '0';
//   return Number(number).toLocaleString('en-IN');
// };

// // Utility function to format dates
// const formatDate = (date) => {
//   if (!date || isNaN(new Date(date))) return 'N/A';
//   const options = { day: 'numeric', month: 'short', year: 'numeric' };
//   return new Date(date).toLocaleDateString('en-GB', options);
// };

// const Account = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { accounts, parties, loading, error } = useSelector((state) => state.account);
//   const [formData, setFormData] = useState({
//     partyname: '',
//     amount: '',
//     transactionType: 'credit',
//     remark: '',
//     date: new Date().toISOString().split('T')[0],
//     toParty: '',
//   });
//   const [editId, setEditId] = useState(null);
//   const [entriesPerPage, setEntriesPerPage] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageInput, setPageInput] = useState('');
//   const API_URL = process.env.REACT_APP_API_URL;

//   const partyOptions = [
//     { value: '', label: 'Select a Party' },
//     ...parties.map((party) => ({ value: party._id, label: party.partyname })),
//   ];

//   const entriesPerPageOptions = [
//     { value: 10, label: '10' },
//     { value: 20, label: '20' },
//     { value: 30, label: '30' },
//     { value: 50, label: '50' },
//     { value: 100, label: '100' },
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
//     setCurrentPage(1);
//   };

//   const handleToPartyInputChange = (selectedOption) => {
//     setFormData({ ...formData, toParty: selectedOption ? selectedOption.value : '' });
//   };

//   const handleEntriesPerPageChange = (selectedOption) => {
//     setEntriesPerPage(selectedOption.value);
//     setCurrentPage(1);
//   };

//   const handlePageInputChange = (e) => {
//     setPageInput(e.target.value);
//   };

//   const handleGoToPage = () => {
//     const pageNumber = parseInt(pageInput, 10);
//     if (pageNumber >= 1 && pageNumber <= totalPages && !isNaN(pageNumber)) {
//       setCurrentPage(pageNumber);
//       setPageInput('');
//     } else {
//       alert('Please enter a valid page number');
//     }
//   };

//   const handleSubmit = async (e) => {
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
//       date: formData.date,
//       to: formData.toParty || undefined,
//     };
//     try {
//       if (editId) {
//         await dispatch(updateAccount({ id: editId, ...accountData })).unwrap();
//         showMessages(accountData.credit, accountData.debit, formData.partyname);
//         await dispatch(fetchAccounts()).unwrap();
//         setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date, toParty: '' });
//         setEditId(null);
//       } else {
//         const result = await dispatch(createAccount(accountData)).unwrap();
//         showMessages(accountData.credit, accountData.debit, formData.partyname);
//         await dispatch(fetchAccounts()).unwrap();
//         if (formData.toParty) {
//           setFormData((prev) => ({ ...prev, partyname: formData.toParty, toParty: '' }));
//         } else {
//           setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date, toParty: '' });
//         }
//       }
//     } catch (err) {
//       if (err === 'No token available' || err.includes('Invalid token')) {
//         navigate('/');
//       } else {
//         alert('Error creating/updating account: ' + err);
//       }
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
//       toParty: '',
//     });
//     setEditId(account._id);
//   };

//   const handleDelete = (id) => {
//     const account = accounts.find((acc) => acc._id === id);
//     if (account.verified) {
//       alert('This account is verified and cannot be deleted.');
//       return;
//     }
//     if (!window.confirm('Are you sure you want to delete this account?')) {
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
//     if (!formData.partyname) {
//       alert('Please select a party to download the statement.');
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
//       Object.keys(grouped).forEach((pId) => {
//         const doc = new jsPDF();
//         let y = 20;
//         let page = 1;
//         const group = grouped[pId];
//         if (!group || !group.accounts || group.accounts.length === 0) {
//           return;
//         }
//         const party = parties.find((p) => p._id === pId);
//         if (!party) {
//           return;
//         }
//         // Header
//         doc.setFillColor(0, 51, 102);
//         doc.rect(0, 0, 210, 15, 'F');
//         doc.setTextColor(255, 255, 255);
//         doc.setFontSize(14);
//         doc.setFont('times', 'bold');
//         doc.text(`${party.partyname} Statement`, 10, 10);
//         doc.setFontSize(12);
//         doc.setTextColor(0, 0, 0);
//         doc.setFont('times', 'normal');
//         y += 10;

//         // Calculate balance
//         const balance = (group.totalDebit || 0) - (group.totalCredit || 0);
//         const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
//         const balValue = formatNumber(Math.abs(balance));
//         const balanceTextColor = balSign === 'Cr' ? [0, 128, 0] : [255, 0, 0]; // Green for Cr, Red for Dr

//         // Closing Balance Box (Right Side, Above Table)
//         const boxX = 130;
//         const boxWidth = 70;
//         const boxHeight = 20;
//         const bgColor = balance > 0 ? [255, 200, 200] : balance < 0 ? [200, 255, 200] : [240, 240, 240];
//         doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
//         doc.rect(boxX, y, boxWidth, boxHeight, 'F');
//         doc.setDrawColor(150, 150, 150);
//         doc.rect(boxX, y, boxWidth, boxHeight);
//         doc.setFontSize(12);
//         doc.setFont('times', 'bold');
//         doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
//         doc.text('Closing Balance', boxX + 5, y + 8);
//         doc.setFont('times', 'normal');
//         doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
//         doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
//         y += 25;

//         // Table setup
//         const tableX = 10;
//         const tableWidth = 190;
//         const colWidths = [35, 35, 35, 35, 50]; // Adjusted widths: reduced Date, Debit, Credit, Balance; increased Remark
//         const baseRowHeight = 8;
//         const tableStartY = y;

//         // Table header
//         doc.setFillColor(0, 51, 102);
//         doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
//         doc.setTextColor(150, 150, 150);
//         doc.setFontSize(10);
//         doc.setFont('times', 'bold');
//         doc.text('Date', tableX + 2, y + 6);
//         doc.text('Debit (-)', tableX + 37, y + 6);
//         doc.text('Credit (+)', tableX + 72, y + 6);
//         doc.text('Balance', tableX + 107, y + 6);
//         doc.text('Remark', tableX + 142, y + 6);
//         y += baseRowHeight;
//         doc.setFont('times', 'normal');
//         doc.setTextColor(0, 0, 0);

//         // Filter and sort accounts for PDF
//         const validAccounts = group.accounts
//           .filter((acc) => acc && acc.date && !isNaN(new Date(acc.date)))
//           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         if (validAccounts.length === 0) {
//           doc.setFontSize(10);
//           doc.setTextColor(255, 0, 0);
//           doc.text('No valid accounts available for this party.', tableX, y + 10);
//           doc.save(`${party.partyname}_account_statement.pdf`);
//           return;
//         }

//         // Create reverse sorted accounts for balance calculation
//         const reverseSortedAccounts = [...validAccounts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

//         validAccounts.forEach((acc, rowIndex) => {
//           // Reverse balance calculation
//           const reverseIndex = validAccounts.length - rowIndex - 1;
//           let currentBalance = 0;
//           const accountsUpToReverseIndex = reverseSortedAccounts.slice(0, reverseIndex + 1);
//           accountsUpToReverseIndex.forEach((acc) => {
//             currentBalance += (acc.debit || 0) - (acc.credit || 0);
//           });
//           const curBalSign = currentBalance > 0 ? 'Dr' : currentBalance < 0 ? 'Cr' : '';
//           const curBalValue = formatNumber(Math.abs(currentBalance));
//           const currentBalanceTextColor = curBalSign === 'Cr' ? [0, 128, 0] : [255, 0, 0];

//           // Handle remark and calculate dynamic row height
//           const remarkText = acc.remark || '';
//           const maxWidth = colWidths[4] - 4; // Adjust for padding
//           const splitText = doc.splitTextToSize(remarkText, maxWidth);
//           const textHeight = splitText.length * 5; // Approximate height per line (5 units per line)
//           const rowHeight = Math.max(baseRowHeight, textHeight);

//           // Draw row background if even
//           if (rowIndex % 2 === 0) {
//             doc.setFillColor(240, 240, 240);
//             doc.rect(tableX, y, tableWidth, rowHeight, 'F');
//           }

//           // Draw single row border for the entire table row
//           doc.setDrawColor(150, 150, 150);
//           doc.rect(tableX, y, tableWidth, rowHeight);

//           let x = tableX;
//           let lineY = y + 6; // Starting y-position for text
//           colWidths.forEach((width, i) => {
//             if (i === 0) doc.text(formatDate(acc.date), x + 2, lineY);
//             if (i === 1 && (acc.debit || 0) > 0) {
//               doc.setTextColor(255, 0, 0);
//               doc.text(formatNumber(acc.debit || 0), x + 2, lineY);
//               doc.setTextColor(0, 0, 0);
//             }
//             if (i === 2 && (acc.credit || 0) > 0) {
//               doc.setTextColor(0, 128, 0);
//               doc.text(formatNumber(acc.credit || 0), x + 2, lineY);
//               doc.setTextColor(0, 0, 0);
//             }
//             if (i === 3) {
//               doc.setTextColor(currentBalanceTextColor[0], currentBalanceTextColor[1], currentBalanceTextColor[2]);
//               doc.text(`${curBalValue} ${curBalSign}`, x + 2, lineY); // Removed "Rs."
//               doc.setTextColor(0, 0, 0);
//             }
//             if (i === 4) {
//               // Adjust y-position for multi-line text
//               let textY = y + 4; // Start slightly above to center vertically
//               splitText.forEach((line, index) => {
//                 doc.text(line, x + 2, textY + (index * 5));
//               });
//             }
//             x += width;
//           });

//           y += rowHeight;

//           // Check if we need a new page
//           if (y > 260 && rowIndex < validAccounts.length - 1) {
//             doc.addPage();
//             y = 20;
//             page++;
//             doc.setFillColor(0, 51, 102);
//             doc.rect(0, 0, 210, 15, 'F');
//             doc.setTextColor(255, 255, 255);
//             doc.setFontSize(14);
//             doc.setFont('times', 'bold');
//             doc.text(`${party.partyname} Statement`, 10, 10);
//             y += 15;

//             // Closing Balance Box (Right Side, Above Table) - NEW PAGE
//             doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
//             doc.rect(boxX, y, boxWidth, boxHeight, 'F');
//             doc.setDrawColor(150, 150, 150);
//             doc.rect(boxX, y, boxWidth, boxHeight);
//             doc.setFontSize(12);
//             doc.setFont('times', 'bold');
//             doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
//             doc.text('Closing Balance', boxX + 5, y + 8);
//             doc.setFont('times', 'normal');
//             doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
//             doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
//             y += 25;

//             doc.setFillColor(0, 51, 102);
//             doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
//             doc.setTextColor(255, 255, 255);
//             doc.setFontSize(10);
//             doc.setFont('times', 'bold');
//             doc.text('Date', tableX + 2, y + 6);
//             doc.text('Debit (-)', tableX + 37, y + 6);
//             doc.text('Credit (+)', tableX + 72, y + 6);
//             doc.text('Balance', tableX + 107, y + 6);
//             doc.text('Remark', tableX + 142, y + 6);
//             y += baseRowHeight;
//             doc.setFont('times', 'normal');
//             doc.setTextColor(0, 0, 0);
//           }
//         });

//         // Add report generation timestamp
//         y += 15;
//         const now = new Date();
//         const hours = now.getHours() % 12 || 12;
//         const minutes = String(now.getMinutes()).padStart(2, '0');
//         const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
//         const genDate = formatDate(now).replace(/\d{4}$/, `'${now.getFullYear().toString().slice(2)}`);
//         const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
//         doc.setFontSize(9);
//         doc.setTextColor(100, 100, 100);
//         doc.text(`Report Generated: ${genTime}`, tableX, y);

//         doc.save(`${party.partyname}_account_statement.pdf`);
//       });
//     } catch (error) {
//       alert('Error generating statement: ' + error.message);
//     }
//   };

//   const handleSendEmail = async () => {
//     try {
//       await dispatch(sendStatementEmail()).unwrap();
//       alert('JSON file sent via email successfully');
//     } catch (err) {
//       // Display the exact error message from the backend
//       const errorMessage = err || 'An unknown error occurred';
//       alert(`Error sending email: ${errorMessage}`);
//     }
//   };

//   const handleImport = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     try {
//       await dispatch(importAccounts(file)).unwrap();
//       await dispatch(fetchAccounts()).unwrap();
//       await dispatch(fetchParties()).unwrap();
//       alert('Data imported successfully');
//     } catch (err) {
//       alert('Error importing data: ' + err);
//     }
//   };

//   const groupedAccounts = parties.reduce((acc, party) => {
//     const partyAccounts = accounts.filter((account) => account.partyname?._id === party._id);
//     if (partyAccounts.length > 0 && (party._id === formData.partyname || party._id === formData.toParty)) {
//       acc[party._id] = {
//         partyname: party.partyname,
//         accounts: partyAccounts,
//       };
//     }
//     return acc;
//   }, {});

//   const selectedPartyAccounts = formData.partyname && groupedAccounts[formData.partyname] ? groupedAccounts[formData.partyname].accounts : [];
//   const sortedAccounts = [...(selectedPartyAccounts || [])]
//     .filter((acc) => acc && acc._id && acc.date && !isNaN(new Date(acc.date)))
//     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//   const totalPages = Math.ceil((sortedAccounts.length || 0) / entriesPerPage);
//   const indexOfLast = currentPage * entriesPerPage;
//   const indexOfFirst = indexOfLast - entriesPerPage;
//   const currentAccounts = sortedAccounts.slice(indexOfFirst, indexOfLast);
//   const totalDebit = (sortedAccounts || []).reduce((sum, account) => sum + (account.debit || 0), 0);
//   const totalCredit = (sortedAccounts || []).reduce((sum, account) => sum + (account.credit || 0), 0);
//   const balance = totalDebit - totalCredit;
//   const balSign = balance > 0 ? 'D' : balance < 0 ? 'C' : '';
//   const balValue = formatNumber(Math.abs(balance));
//   const balanceColor = balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800';

//   return (
//     <div className="container mx-auto p-6 bg-white min-h-screen">
//       <div className="bg-white shadow-xl rounded-lg p-6">
//         <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4 items-end">
//           <div>
//             <label className="block mb-1 font-medium text-gray-700">Party Name</label>
//             <Select
//               options={partyOptions.filter((option) => option.value !== '')}
//               value={partyOptions.find((option) => option.value === formData.partyname) || null}
//               onChange={handlePartyInputChange}
//               placeholder="Select or type to search party"
//               className="w-full"
//               classNamePrefix="select"
//               isClearable
//               isSearchable
//               styles={{
//                 control: (base) => ({
//                   ...base,
//                   borderColor: '#d1d5db',
//                   padding: '2px',
//                   borderRadius: '0.375rem',
//                   boxShadow: 'none',
//                   '&:hover': {
//                     borderColor: '#3b82f6',
//                   },
//                   '&:focus': {
//                     borderColor: '#3b82f6',
//                     boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
//                   },
//                 }),
//               }}
//             />
//           </div>
//           <div>
//             <label className="block mb-1 font-medium text-gray-700">To Party</label>
//             <Select
//               options={partyOptions.filter((option) => option.value !== '' && option.value !== formData.partyname)}
//               value={partyOptions.find((option) => option.value === formData.toParty) || null}
//               onChange={handleToPartyInputChange}
//               placeholder="Select to party for transfer"
//               className="w-full"
//               classNamePrefix="select"
//               isClearable
//               isSearchable
//               styles={{
//                 control: (base) => ({
//                   ...base,
//                   borderColor: '#d1d5db',
//                   padding: '2px',
//                   borderRadius: '0.375rem',
//                   boxShadow: 'none',
//                   '&:hover': {
//                     borderColor: '#3b82f6',
//                   },
//                   '&:focus': {
//                     borderColor: '#3b82f6',
//                     boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
//                   },
//                 }),
//               }}
//             />
//           </div>
//           <div>
//             <label className="block mb-1 font-medium text-gray-700">Transaction Type*</label>
//             <select
//               name="transactionType"
//               value={formData.transactionType}
//               onChange={handleInputChange}
//               className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//             >
//               <option value="credit">Deposit(Dena)</option>
//               <option value="debit">Withdraw(Lena)</option>
//             </select>
//           </div>
//           <div>
//             <label className="block mb-1 font-medium text-gray-700">Amount*</label>
//             <input
//               type="number"
//               name="amount"
//               value={formData.amount}
//               onChange={handleInputChange}
//               placeholder="Enter amount"
//               className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//               required
//             />
//           </div>
//           <div>
//             <label className="block mb-1 font-medium text-gray-700">Date</label>
//             <input
//               type="date"
//               name="date"
//               value={formData.date}
//               onChange={handleInputChange}
//               className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//               required
//             />
//           </div>
//           <div>
//             <label className="block mb-1 font-medium text-gray-700">Remark</label>
//             <input
//               type="text"
//               name="remark"
//               value={formData.remark}
//               onChange={handleInputChange}
//               placeholder="Enter remark"
//               className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//             />
//           </div>
//           <div className="flex gap-2">
//             <button
//               type="submit"
//               className="bg-blue-600 text-white p-2 flex items-center gap-2 rounded-[5px] hover:bg-blue-700 transition duration-200 col-span-1 md:col-auto"
//               title={editId ? 'Update Account' : 'Submit Account'}
//             >
//               <FaPlus size={18} />
//               {editId ? 'Update' : 'Add'}
//             </button>
//             <button
//               type="button"
//               onClick={handleDownload}
//               className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200 col-span-1 md:col-auto"
//               title="Download Statement"
//             >
//               <FaFileDownload size={18} />
//             </button>
//             <button
//               type="button"
//               onClick={handleSendEmail}
//               className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition duration-200 col-span-1 md:col-auto"
//               title="Send JSON via Email"
//             >
//               <FaEnvelope size={18} />
//             </button>
//             <label className="bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition duration-200 col-span-1 md:col-auto cursor-pointer">
//               <FaUpload size={18} />
//               <input
//                 type="file"
//                 accept=".json"
//                 onChange={handleImport}
//                 className="hidden"
//               />
//             </label>
//           </div>
//         </form>

//         {loading && <p className="text-blue-600 text-center">Loading...</p>}
//         {error && <p className="text-red-600 text-center">{error}</p>}
//         <div className="mb-8">
//           {formData.partyname && groupedAccounts[formData.partyname] ? (
//             <div className="mb-8 overflow-x-auto">
//               <div className="flex justify-between items-start mb-4">
//                 <h3 className="text-xl font-semibold text-gray-800">{groupedAccounts[formData.partyname].partyname}</h3>
//                 <div
//                   className={`bg-white flex gap-4 border-2 border-gray-300 p-4 rounded-lg shadow-xl md:w-1/3 bg-gradient-to-br ${
//                     balance > 0 ? 'from-red-50 to-red-100' : balance < 0 ? 'from-green-50 to-green-100' : 'from-gray-50 to-gray-100'
//                   }`}
//                 >
//                   <div className="border-b border-gray-400 pb-2 mb-1">
//                     <span className={`text-2xl font-bold font-sans ${balanceColor}`}>Closing Balance</span>
//                   </div>
//                   <div className={`text-2xl font-extrabold font-sans ${balanceColor}`}>₹ {balValue} {balSign}</div>
//                 </div>
//               </div>
//               {sortedAccounts.length === 0 ? (
//                 <p className="text-gray-600">No accounts available for {groupedAccounts[formData.partyname].partyname}.</p>
//               ) : (
//                 <>
//                   <div className="flex justify-between items-center mb-4">
//                     <p className="text-gray-600">Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedAccounts.length)} of {sortedAccounts.length} entries</p>
//                     <div className="flex gap-4 items-center">
//                       <div className="flex items-center gap-2">
//                         <label className="text-gray-700">Show</label>
//                         <Select
//                           options={entriesPerPageOptions}
//                           value={entriesPerPageOptions.find((option) => option.value === entriesPerPage)}
//                           onChange={handleEntriesPerPageChange}
//                           className="w-24"
//                           classNamePrefix="select"
//                           styles={{
//                             control: (base) => ({
//                               ...base,
//                               borderColor: '#d1d5db',
//                               padding: '2px',
//                               borderRadius: '0.375rem',
//                               boxShadow: 'none',
//                               '&:hover': {
//                                 borderColor: '#3b82f6',
//                               },
//                               '&:focus': {
//                                 borderColor: '#3b82f6',
//                                 boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
//                               },
//                             }),
//                           }}
//                         />
//                         <label className="text-gray-700">entries</label>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <input
//                           type="number"
//                           value={pageInput}
//                           onChange={handlePageInputChange}
//                           placeholder="Page"
//                           className="border border-gray-300 p-2 rounded w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//                         />
//                         <button
//                           onClick={handleGoToPage}
//                           className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200"
//                           title="Go to Page"
//                         >
//                           <FaArrowRight size={18} />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                   <table className="w-full border-collapse bg-white shadow-md rounded-lg">
//                     <thead>
//                       <tr className="bg-blue-900 text-white">
//                         <th className="p-3 text-left">Date</th>
//                         <th className="p-3 text-left">Debit (-)</th>
//                         <th className="p-3 text-left">Credit (+)</th>
//                         <th className="p-3 text-left">Balance</th>
//                         <th className="p-3 text-left">Remark</th>
//                         <th className="p-3 text-left">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {currentAccounts.map((account, index) => {
//                         const currentBalance = sortedAccounts
//                           .slice(sortedAccounts.findIndex((a) => a._id === account._id))
//                           .reduce((sum, acc) => sum + (acc.debit || 0) - (acc.credit || 0), 0);
//                         const curBalSign = currentBalance > 0 ? 'D' : currentBalance < 0 ? 'C' : '';
//                         const curBalValue = formatNumber(Math.abs(currentBalance));
//                         const currentBalanceColor = currentBalance > 0 ? 'text-red-600' : currentBalance < 0 ? 'text-green-600' : 'text-gray-800';
//                         return (
//                           <tr
//                             key={account._id}
//                             className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
//                           >
//                             <td className="p-3">{formatDate(account.date)}</td>
//                             <td className="p-3 text-red-600">{account.debit > 0 ? formatNumber(account.debit) : ''}</td>
//                             <td className="p-3 text-green-600">{account.credit > 0 ? formatNumber(account.credit) : ''}</td>
//                             <td className={`p-3 ${currentBalanceColor}`}>
//                               ₹ {curBalValue} {curBalSign}
//                             </td>
//                             <td className="p-3">{account.remark || ''}</td>
//                             <td className="p-3 flex gap-2">
//                               {!account.verified && (
//                                 <>
//                                   <button
//                                     onClick={() => handleEdit(account)}
//                                     className="text-blue-600 hover:text-blue-800"
//                                     title="Edit Account"
//                                   >
//                                     <FaEdit size={18} />
//                                   </button>
//                                   <button
//                                     onClick={() => handleDelete(account._id)}
//                                     className="text-red-600 hover:text-red-800"
//                                     title="Delete Account"
//                                   >
//                                     <FaTrash size={18} />
//                                   </button>
//                                   <button
//                                     onClick={() => handleVerify(account._id)}
//                                     className="text-green-600 hover:text-green-800"
//                                     title="Verify Account"
//                                   >
//                                     <FaCheck size={18} />
//                                   </button>
//                                 </>
//                               )}
//                               {account.verified && (
//                                 <span className="text-green-600 font-semibold">Verified</span>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                   <div className="flex justify-between items-center mt-4">
//                     <button
//                       onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                       disabled={currentPage === 1}
//                       className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400 hover:bg-blue-700 transition duration-200"
//                     >
//                       Previous
//                     </button>
//                     <span>Page {currentPage} of {totalPages}</span>
//                     <button
//                       onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                       disabled={currentPage === totalPages}
//                       className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400 hover:bg-blue-700 transition duration-200"
//                     >
//                       Next
//                     </button>
//                   </div>
//                 </>
//               )}
//             </div>
//           ) : (
//             <p className="text-gray-600">Please select a party to view accounts.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Account;

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties, verifyAccount, sendStatementEmail, importAccounts } from '../redux/accountSlice';
import { jsPDF } from 'jspdf';
import Select from 'react-select';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaFileDownload, FaArrowRight, FaEnvelope, FaUpload } from 'react-icons/fa';

// Utility function to format numbers with commas
const formatNumber = (number) => {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return Number(number).toLocaleString('en-IN');
};

// Utility function to remove commas for raw number
const parseNumber = (value) => {
  return value.replace(/,/g, '');
};

// Utility function to format dates
const formatDate = (date) => {
  if (!date || isNaN(new Date(date))) return 'N/A';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-GB', options);
};

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
    toParty: '',
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
    if (name === 'amount') {
      // Remove non-numeric characters except for decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = numericValue.split('.');
      let formattedValue = parts[0];
      if (parts.length > 1) {
        formattedValue += '.' + parts[1].slice(0, 2); // Limit to 2 decimal places
      }
      // Add commas to the integer part
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formattedValue = parts.length > 1 ? `${integerPart}.${parts[1].slice(0, 2)}` : integerPart;
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePartyInputChange = (selectedOption) => {
    setFormData({ ...formData, partyname: selectedOption ? selectedOption.value : '' });
    setCurrentPage(1);
  };

  const handleToPartyInputChange = (selectedOption) => {
    setFormData({ ...formData, toParty: selectedOption ? selectedOption.value : '' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyname || !formData.amount || !formData.date) {
      alert('Party name, amount, and date are required');
      return;
    }
    const accountData = {
      partyname: formData.partyname,
      credit: formData.transactionType === 'credit' ? parseFloat(parseNumber(formData.amount)) : 0,
      debit: formData.transactionType === 'debit' ? parseFloat(parseNumber(formData.amount)) : 0,
      remark: formData.remark,
      date: formData.date,
      to: formData.toParty || undefined,
    };
    try {
      if (editId) {
        await dispatch(updateAccount({ id: editId, ...accountData })).unwrap();
        showMessages(accountData.credit, accountData.debit, formData.partyname);
        await dispatch(fetchAccounts()).unwrap();
        setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date, toParty: '' });
        setEditId(null);
      } else {
        const result = await dispatch(createAccount(accountData)).unwrap();
        showMessages(accountData.credit, accountData.debit, formData.partyname);
        await dispatch(fetchAccounts()).unwrap();
        if (formData.toParty) {
          setFormData((prev) => ({ ...prev, partyname: formData.toParty, toParty: '' }));
        } else {
          setFormData({ partyname: formData.partyname, amount: '', transactionType: 'credit', remark: '', date: formData.date, toParty: '' });
        }
      }
    } catch (err) {
      if (err === 'No token available' || err.includes('Invalid token')) {
        navigate('/');
      } else {
        alert('Error creating/updating account: ' + err);
      }
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
      amount: formatNumber(account.credit > 0 ? account.credit : account.debit),
      transactionType: account.credit > 0 ? 'credit' : 'debit',
      remark: account.remark || '',
      date: new Date(account.date).toISOString().split('T')[0],
      toParty: '',
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
    if (!formData.partyname) {
      alert('Please select a party to download the statement.');
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
      Object.keys(grouped).forEach((pId) => {
        const doc = new jsPDF();
        let y = 20;
        let page = 1;
        const group = grouped[pId];
        if (!group || !group.accounts || group.accounts.length === 0) {
          return;
        }
        const party = parties.find((p) => p._id === pId);
        if (!party) {
          return;
        }
        // Header
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('times', 'bold');
        doc.text(`${party.partyname} Statement`, 10, 10);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('times', 'normal');
        y += 10;

        // Calculate balance
        const balance = (group.totalDebit || 0) - (group.totalCredit || 0);
        const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
        const balValue = formatNumber(Math.abs(balance));
        const balanceTextColor = balSign === 'Cr' ? [0, 128, 0] : [255, 0, 0]; // Green for Cr, Red for Dr

        // Closing Balance Box (Right Side, Above Table)
        const boxX = 130;
        const boxWidth = 70;
        const boxHeight = 20;
        const bgColor = balance > 0 ? [255, 200, 200] : balance < 0 ? [200, 255, 200] : [240, 240, 240];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(boxX, y, boxWidth, boxHeight, 'F');
        doc.setDrawColor(150, 150, 150);
        doc.rect(boxX, y, boxWidth, boxHeight);
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
        doc.text('Closing Balance', boxX + 5, y + 8);
        doc.setFont('times', 'normal');
        doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
        doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
        y += 25;

        // Table setup
        const tableX = 10;
        const tableWidth = 190;
        const colWidths = [35, 35, 35, 35, 50]; // Adjusted widths: reduced Date, Debit, Credit, Balance; increased Remark
        const baseRowHeight = 8;
        const tableStartY = y;

        // Table header
        doc.setFillColor(0, 51, 102);
        doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.setFont('times', 'bold');
        doc.text('Date', tableX + 2, y + 6);
        doc.text('Debit (-)', tableX + 37, y + 6);
        doc.text('Credit (+)', tableX + 72, y + 6);
        doc.text('Balance', tableX + 107, y + 6);
        doc.text('Remark', tableX + 142, y + 6);
        y += baseRowHeight;
        doc.setFont('times', 'normal');
        doc.setTextColor(0, 0, 0);

        // Filter and sort accounts for PDF
        const validAccounts = group.accounts
          .filter((acc) => acc && acc.date && !isNaN(new Date(acc.date)))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (validAccounts.length === 0) {
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text('No valid accounts available for this party.', tableX, y + 10);
          doc.save(`${party.partyname}_account_statement.pdf`);
          return;
        }

        // Create reverse sorted accounts for balance calculation
        const reverseSortedAccounts = [...validAccounts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        validAccounts.forEach((acc, rowIndex) => {
          // Reverse balance calculation
          const reverseIndex = validAccounts.length - rowIndex - 1;
          let currentBalance = 0;
          const accountsUpToReverseIndex = reverseSortedAccounts.slice(0, reverseIndex + 1);
          accountsUpToReverseIndex.forEach((acc) => {
            currentBalance += (acc.debit || 0) - (acc.credit || 0);
          });
          const curBalSign = currentBalance > 0 ? 'Dr' : currentBalance < 0 ? 'Cr' : '';
          const curBalValue = formatNumber(Math.abs(currentBalance));
          const currentBalanceTextColor = curBalSign === 'Cr' ? [0, 128, 0] : [255, 0, 0];

          // Handle remark and calculate dynamic row height
          const remarkText = acc.remark || '';
          const maxWidth = colWidths[4] - 4; // Adjust for padding
          const splitText = doc.splitTextToSize(remarkText, maxWidth);
          const textHeight = splitText.length * 5; // Approximate height per line (5 units per line)
          const rowHeight = Math.max(baseRowHeight, textHeight);

          // Draw row background if even
          if (rowIndex % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(tableX, y, tableWidth, rowHeight, 'F');
          }

          // Draw single row border for the entire table row
          doc.setDrawColor(150, 150, 150);
          doc.rect(tableX, y, tableWidth, rowHeight);

          let x = tableX;
          let lineY = y + 6; // Starting y-position for text
          colWidths.forEach((width, i) => {
            if (i === 0) doc.text(formatDate(acc.date), x + 2, lineY);
            if (i === 1 && (acc.debit || 0) > 0) {
              doc.setTextColor(255, 0, 0);
              doc.text(formatNumber(acc.debit || 0), x + 2, lineY);
              doc.setTextColor(0, 0, 0);
            }
            if (i === 2 && (acc.credit || 0) > 0) {
              doc.setTextColor(0, 128, 0);
              doc.text(formatNumber(acc.credit || 0), x + 2, lineY);
              doc.setTextColor(0, 0, 0);
            }
            if (i === 3) {
              doc.setTextColor(currentBalanceTextColor[0], currentBalanceTextColor[1], currentBalanceTextColor[2]);
              doc.text(`${curBalValue} ${curBalSign}`, x + 2, lineY); // Removed "Rs."
              doc.setTextColor(0, 0, 0);
            }
            if (i === 4) {
              // Adjust y-position for multi-line text
              let textY = y + 4; // Start slightly above to center vertically
              splitText.forEach((line, index) => {
                doc.text(line, x + 2, textY + (index * 5));
              });
            }
            x += width;
          });

          y += rowHeight;

          // Check if we need a new page
          if (y > 260 && rowIndex < validAccounts.length - 1) {
            doc.addPage();
            y = 20;
            page++;
            doc.setFillColor(0, 51, 102);
            doc.rect(0, 0, 210, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            doc.text(`${party.partyname} Statement`, 10, 10);
            y += 15;

            // Closing Balance Box (Right Side, Above Table) - NEW PAGE
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.rect(boxX, y, boxWidth, boxHeight, 'F');
            doc.setDrawColor(150, 150, 150);
            doc.rect(boxX, y, boxWidth, boxHeight);
            doc.setFontSize(12);
            doc.setFont('times', 'bold');
            doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
            doc.text('Closing Balance', boxX + 5, y + 8);
            doc.setFont('times', 'normal');
            doc.setTextColor(balanceTextColor[0], balanceTextColor[1], balanceTextColor[2]);
            doc.text(`Rs. ${balValue} ${balSign}`, boxX + 5, y + 16);
            y += 25;

            doc.setFillColor(0, 51, 102);
            doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('times', 'bold');
            doc.text('Date', tableX + 2, y + 6);
            doc.text('Debit (-)', tableX + 37, y + 6);
            doc.text('Credit (+)', tableX + 72, y + 6);
            doc.text('Balance', tableX + 107, y + 6);
            doc.text('Remark', tableX + 142, y + 6);
            y += baseRowHeight;
            doc.setFont('times', 'normal');
            doc.setTextColor(0, 0, 0);
          }
        });

        // Add report generation timestamp
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
      alert('Error generating statement: ' + error.message);
    }
  };

  const handleSendEmail = async () => {
    try {
      await dispatch(sendStatementEmail()).unwrap();
      alert('JSON file sent via email successfully');
    } catch (err) {
      // Display the exact error message from the backend
      const errorMessage = err || 'An unknown error occurred';
      alert(`Error sending email: ${errorMessage}`);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await dispatch(importAccounts(file)).unwrap();
      await dispatch(fetchAccounts()).unwrap();
      await dispatch(fetchParties()).unwrap();
      alert('Data imported successfully');
    } catch (err) {
      alert('Error importing data: ' + err);
    }
  };

  const groupedAccounts = parties.reduce((acc, party) => {
    const partyAccounts = accounts.filter((account) => account.partyname?._id === party._id);
    if (partyAccounts.length > 0 && (party._id === formData.partyname || party._id === formData.toParty)) {
      acc[party._id] = {
        partyname: party.partyname,
        accounts: partyAccounts,
      };
    }
    return acc;
  }, {});

  const selectedPartyAccounts = formData.partyname && groupedAccounts[formData.partyname] ? groupedAccounts[formData.partyname].accounts : [];
  const sortedAccounts = [...(selectedPartyAccounts || [])]
    .filter((acc) => acc && acc._id && acc.date && !isNaN(new Date(acc.date)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalPages = Math.ceil((sortedAccounts.length || 0) / entriesPerPage);
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentAccounts = sortedAccounts.slice(indexOfFirst, indexOfLast);
  const totalDebit = (sortedAccounts || []).reduce((sum, account) => sum + (account.debit || 0), 0);
  const totalCredit = (sortedAccounts || []).reduce((sum, account) => sum + (account.credit || 0), 0);
  const balance = totalDebit - totalCredit;
  const balSign = balance > 0 ? 'D' : balance < 0 ? 'C' : '';
  const balValue = formatNumber(Math.abs(balance));
  const balanceColor = balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800';

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-6">
        <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Party Name</label>
            <Select
              options={partyOptions.filter((option) => option.value !== '')}
              value={partyOptions.find((option) => option.value === formData.partyname) || null}
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
            <label className="block mb-1 font-medium text-gray-700">To Party</label>
            <Select
              options={partyOptions.filter((option) => option.value !== '' && option.value !== formData.partyname)}
              value={partyOptions.find((option) => option.value === formData.toParty) || null}
              onChange={handleToPartyInputChange}
              placeholder="Select to party for transfer"
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
            <button
              type="button"
              onClick={handleSendEmail}
              className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition duration-200 col-span-1 md:col-auto"
              title="Send JSON via Email"
            >
              <FaEnvelope size={18} />
            </button>
            <label className="bg-orange-600 text-white p-2 rounded hover:bg-orange-700 transition duration-200 col-span-1 md:col-auto cursor-pointer">
              <FaUpload size={18} />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </form>

        {loading && <p className="text-blue-600 text-center">Loading...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        <div className="mb-8">
          {formData.partyname && groupedAccounts[formData.partyname] ? (
            <div className="mb-8 overflow-x-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{groupedAccounts[formData.partyname].partyname}</h3>
                <div
                  className={`bg-white flex gap-4 border-2 border-gray-300 p-4 rounded-lg shadow-xl md:w-1/3 bg-gradient-to-br ${
                    balance > 0 ? 'from-red-50 to-red-100' : balance < 0 ? 'from-green-50 to-green-100' : 'from-gray-50 to-gray-100'
                  }`}
                >
                  <div className="border-b border-gray-400 pb-2 mb-1">
                    <span className={`text-2xl font-bold font-sans ${balanceColor}`}>Closing Balance</span>
                  </div>
                  <div className={`text-2xl font-extrabold font-sans ${balanceColor}`}>₹ {balValue} {balSign}</div>
                </div>
              </div>
              {sortedAccounts.length === 0 ? (
                <p className="text-gray-600">No accounts available for {groupedAccounts[formData.partyname].partyname}.</p>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedAccounts.length)} of {sortedAccounts.length} entries</p>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-gray-700">Show</label>
                        <Select
                          options={entriesPerPageOptions}
                          value={entriesPerPageOptions.find((option) => option.value === entriesPerPage)}
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
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Debit (-)</th>
                        <th className="p-3 text-left">Credit (+)</th>
                        <th className="p-3 text-left">Balance</th>
                        <th className="p-3 text-left">Remark</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAccounts.map((account, index) => {
                        const currentBalance = sortedAccounts
                          .slice(sortedAccounts.findIndex((a) => a._id === account._id))
                          .reduce((sum, acc) => sum + (acc.debit || 0) - (acc.credit || 0), 0);
                        const curBalSign = currentBalance > 0 ? 'D' : currentBalance < 0 ? 'C' : '';
                        const curBalValue = formatNumber(Math.abs(currentBalance));
                        const currentBalanceColor = currentBalance > 0 ? 'text-red-600' : currentBalance < 0 ? 'text-green-600' : 'text-gray-800';
                        return (
                          <tr
                            key={account._id}
                            className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                          >
                            <td className="p-3">{formatDate(account.date)}</td>
                            <td className="p-3 text-red-600">{account.debit > 0 ? formatNumber(account.debit) : ''}</td>
                            <td className="p-3 text-green-600">{account.credit > 0 ? formatNumber(account.credit) : ''}</td>
                            <td className={`p-3 ${currentBalanceColor}`}>
                              ₹ {curBalValue} {curBalSign}
                            </td>
                            <td className="p-3">{account.remark || ''}</td>
                            <td className="p-3 flex gap-2">
                              {!account.verified && (
                                <>
                                  <button
                                    onClick={() => handleEdit(account)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit Account"
                                  >
                                    <FaEdit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(account._id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete Account"
                                  >
                                    <FaTrash size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleVerify(account._id)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Verify Account"
                                  >
                                    <FaCheck size={18} />
                                  </button>
                                </>
                              )}
                              {account.verified && (
                                <span className="text-green-600 font-semibold">Verified</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400 hover:bg-blue-700 transition duration-200"
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400 hover:bg-blue-700 transition duration-200"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-600">Please select a party to view accounts.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;