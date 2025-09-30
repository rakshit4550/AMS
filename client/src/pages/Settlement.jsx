// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { 
//   createSettlement, 
//   getSettlements, 
//   updateSettlement, 
//   deleteSettlement, 
//   downloadSettlements,
//   fetchDomains,
//   reset 
// } from '../redux/settlementSlice';
// import { loadUser, logout } from '../redux/authSlice';
// import { toast } from 'react-toastify';
// import Select from 'react-select';
// import { FaPlus, FaEdit, FaTrash, FaFileDownload, FaArrowRight } from 'react-icons/fa';
// import { jsPDF } from 'jspdf';

// // Utility function to format numbers with commas
// const formatNumber = (number) => {
//   if (number === undefined || number === null || isNaN(number)) return '0';
//   return Number(number).toLocaleString('en-IN');
// };

// // Utility function to remove commas for raw number
// const parseNumber = (value) => {
//   if (!value) return '';
//   return value.replace(/,/g, '');
// };

// // Utility function to format dates
// const formatDate = (date) => {
//   if (!date || isNaN(new Date(date))) return 'N/A';
//   const options = { day: 'numeric', month: 'short', year: 'numeric' };
//   return new Date(date).toLocaleDateString('en-GB', options);
// };

// const Settlement = () => {
//   const dispatch = useDispatch();
//   const { settlements, domains, loading, error, success, groupedSettlements } = useSelector((state) => state.settlement || {});
//   const userState = useSelector((state) => state.user || {});
//   const { currentUser: user, token, loading: loadingAuth } = userState;

//   const [formData, setFormData] = useState({
//     date: new Date().toISOString().split('T')[0],
//     domain: '',
//     settlement: '',
//     rate: '',
//   });
//   const [editId, setEditId] = useState(null);
//   const [showForm, setShowForm] = useState(false);
//   const [entriesPerPage, setEntriesPerPage] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageInput, setPageInput] = useState('');
//   const [selectedDomain, setSelectedDomain] = useState(null);

//   const domainOptions = domains.length > 0 
//     ? [
//         { value: '', label: 'Select a Domain' },
//         ...domains.map((domain) => ({ value: domain._id, label: domain.domainname })),
//       ]
//     : [{ value: '', label: 'No Domains Available' }];

//   const entriesPerPageOptions = [
//     { value: 10, label: '10' },
//     { value: 20, label: '20' },
//     { value: 30, label: '30' },
//     { value: 50, label: '50' },
//     { value: 100, label: '100' },
//   ];

//   useEffect(() => {
//     console.log('Settlement: useEffect triggered, userState:', userState);
//     console.log('User:', user, 'loadingAuth:', loadingAuth, 'token:', token);
    
//     // Dispatch loadUser to restore user state
//     dispatch(loadUser()).then((result) => {
//       console.log('loadUser result:', result);
//       if (result.type === 'user/loadUser/fulfilled') {
//         console.log('User loaded successfully, fetching settlements and domains');
//         dispatch(fetchDomains());
//         dispatch(getSettlements());
//       } else {
//         console.warn('loadUser failed:', result.payload);
//         toast.error('Please log in to access settlements');
//         dispatch(logout());
//         window.location.href = '/login';
//       }
//     });
//   }, [dispatch]);

//   useEffect(() => {
//     if (error) {
//       console.error('Redux error:', error);
//       if (error.includes('token') || error.includes('Unauthorized')) {
//         toast.error('Session expired. Please log in again.');
//         dispatch(logout());
//         window.location.href = '/login';
//       } else {
//         toast.error(error);
//       }
//       dispatch(reset());
//     }
//     if (success) {
//       console.log('Operation successful');
//       toast.success('Operation successful!');
//       dispatch(reset());
//     }
//     console.log('Domains in state:', domains);
//     console.log('Settlements in state:', settlements);
//   }, [error, success, domains, settlements, dispatch]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     console.log('Input changed:', name, value);
//     if (name === 'settlement' || name === 'rate') {
//       const numericValue = value.replace(/[^0-9.]/g, '');
//       const parts = numericValue.split('.');
//       const num = parts[0];
//       const integerPart = num === '' ? '' : Number(num).toLocaleString('en-IN');
//       let formattedValue = integerPart;
//       if (parts.length > 1) {
//         formattedValue += '.' + parts[1].slice(0, 2);
//       }
//       setFormData({ ...formData, [name]: formattedValue });
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };

//   const handleDomainChange = (selectedOption) => {
//     console.log('Selected domain:', selectedOption);
//     setSelectedDomain(selectedOption);
//     setFormData({ ...formData, domain: selectedOption?.value || '' });
//     setCurrentPage(1);
//   };

//   const handleEntriesPerPageChange = (selectedOption) => {
//     console.log('Entries per page changed:', selectedOption.value);
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

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log('Form submitted with data:', formData);
//     if (!formData.date || !formData.domain || !formData.settlement || !formData.rate) {
//       toast.error('All fields are required');
//       return;
//     }
//     const settlementData = {
//       date: formData.date,
//       domain: formData.domain,
//       settlement: parseFloat(parseNumber(formData.settlement)),
//       rate: parseFloat(parseNumber(formData.rate)),
//     };
//     console.log('Submitting settlement data:', settlementData);
//     if (editId) {
//       dispatch(updateSettlement({ id: editId, settlementData }))
//         .unwrap()
//         .then(() => {
//           setFormData({ date: new Date().toISOString().split('T')[0], domain: '', settlement: '', rate: '' });
//           setEditId(null);
//           setShowForm(false);
//           setSelectedDomain(null);
//           dispatch(getSettlements());
//           dispatch(fetchDomains());
//         })
//         .catch((err) => {
//           console.error('Update settlement failed:', err);
//           if (err.includes('token') || err.includes('Unauthorized')) {
//             toast.error('Session expired. Please log in again.');
//             dispatch(logout());
//             window.location.href = '/login';
//           } else {
//             toast.error(err || 'Failed to update settlement');
//           }
//         });
//     } else {
//       dispatch(createSettlement(settlementData))
//         .unwrap()
//         .then(() => {
//           setFormData({ date: new Date().toISOString().split('T')[0], domain: '', settlement: '', rate: '' });
//           setShowForm(false);
//           setSelectedDomain(null);
//           dispatch(getSettlements());
//           dispatch(fetchDomains());
//         })
//         .catch((err) => {
//           console.error('Create settlement failed:', err);
//           if (err.includes('token') || err.includes('Unauthorized')) {
//             toast.error('Session expired. Please log in again.');
//             dispatch(logout());
//             window.location.href = '/login';
//           } else {
//             toast.error(err || 'Failed to create settlement');
//           }
//         });
//     }
//   };

//   const handleEdit = (settlement) => {
//     console.log('Editing settlement:', settlement);
//     setFormData({
//       date: new Date(settlement.date).toISOString().split('T')[0],
//       domain: settlement.domain?._id || '',
//       settlement: formatNumber(settlement.settlement),
//       rate: formatNumber(settlement.rate),
//     });
//     setSelectedDomain(
//       settlement.domain ? { value: settlement.domain._id, label: settlement.domain.domainname } : null
//     );
//     setEditId(settlement._id);
//     setShowForm(true);
//   };

//   const handleDelete = (id) => {
//     console.log('Deleting settlement with ID:', id);
//     if (window.confirm('Are you sure you want to delete this settlement?')) {
//       dispatch(deleteSettlement(id))
//         .unwrap()
//         .then(() => {
//           dispatch(getSettlements());
//           dispatch(fetchDomains());
//         })
//         .catch((err) => {
//           console.error('Delete settlement failed:', err);
//           if (err.includes('token') || err.includes('Unauthorized')) {
//             toast.error('Session expired. Please log in again.');
//             dispatch(logout());
//             window.location.href = '/login';
//           } else {
//             toast.error(err || 'Failed to delete settlement');
//           }
//         });
//     }
//   };

//   const handleDownload = (domainId = null) => {
//     console.log('Downloading settlements for domain ID:', domainId);
//     dispatch(downloadSettlements(domainId))
//       .unwrap()
//       .then((data) => {
//         const doc = new jsPDF();
//         let y = 20;
//         let page = 1;

//         if (!data || Object.keys(data).length === 0) {
//           toast.error('No data available to download');
//           return;
//         }

//         Object.keys(data).forEach((domainName) => {
//           const group = data[domainName];
//           if (!group || !group.accounts || group.accounts.length === 0) return;

//           // Header
//           doc.setFillColor(0, 51, 102);
//           doc.rect(0, 0, 210, 15, 'F');
//           doc.setTextColor(255, 255, 255);
//           doc.setFontSize(14);
//           doc.setFont('times', 'bold');
//           doc.text(`${group.name} Settlement Statement`, 10, 10);
//           doc.setFontSize(12);
//           doc.setTextColor(0, 0, 0);
//           doc.setFont('times', 'normal');
//           y += 10;

//           // Closing Balance Box
//           const totalSettlement = group.totalSettlement || 0;
//           const totalRate = group.totalRate || 0;
//           const boxX = 130;
//           const boxWidth = 70;
//           const boxHeight = 20;
//           doc.setFillColor(240, 240, 240);
//           doc.rect(boxX, y, boxWidth, boxHeight, 'F');
//           doc.setDrawColor(150, 150, 150);
//           doc.rect(boxX, y, boxWidth, boxHeight);
//           doc.setFontSize(12);
//           doc.setFont('times', 'bold');
//           doc.text('Totals', boxX + 5, y + 8);
//           doc.setFont('times', 'normal');
//           doc.text(`Set: ${formatNumber(totalSettlement)}`, boxX + 5, y + 16);
//           y += 25;

//           // Table setup
//           const tableX = 10;
//           const tableWidth = 190;
//           const colWidths = [40, 50, 50, 50];
//           const baseRowHeight = 8;
//           doc.setFillColor(0, 51, 102);
//           doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
//           doc.setTextColor(255, 255, 255);
//           doc.setFontSize(10);
//           doc.setFont('times', 'bold');
//           doc.text('Date', tableX + 2, y + 6);
//           doc.text('Domain', tableX + 42, y + 6);
//           doc.text('Settlement', tableX + 92, y + 6);
//           doc.text('Rate', tableX + 142, y + 6);
//           y += baseRowHeight;
//           doc.setFont('times', 'normal');
//           doc.setTextColor(0, 0, 0);

//           const validAccounts = group.accounts
//             .filter((acc) => acc && acc.date && !isNaN(new Date(acc.date)))
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//           validAccounts.forEach((acc, rowIndex) => {
//             if (rowIndex % 2 === 0) {
//               doc.setFillColor(240, 240, 240);
//               doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
//             }
//             doc.setDrawColor(150, 150, 150);
//             doc.rect(tableX, y, tableWidth, baseRowHeight);
//             let x = tableX;
//             colWidths.forEach((width, i) => {
//               if (i === 0) doc.text(formatDate(acc.date), x + 2, y + 6);
//               if (i === 1) doc.text(acc.domainname || 'Unknown', x + 2, y + 6);
//               if (i === 2) doc.text(formatNumber(acc.settlement || 0), x + 2, y + 6);
//               if (i === 3) doc.text(formatNumber(acc.rate || 0), x + 2, y + 6);
//               x += width;
//             });
//             y += baseRowHeight;

//             if (y > 260 && rowIndex < validAccounts.length - 1) {
//               doc.addPage();
//               y = 20;
//               page++;
//               doc.setFillColor(0, 51, 102);
//               doc.rect(0, 0, 210, 15, 'F');
//               doc.setTextColor(255, 255, 255);
//               doc.setFontSize(14);
//               doc.setFont('times', 'bold');
//               doc.text(`${group.name} Settlement Statement`, 10, 10);
//               y += 15;
//               doc.setFillColor(240, 240, 240);
//               doc.rect(boxX, y, boxWidth, boxHeight, 'F');
//               doc.setDrawColor(150, 150, 150);
//               doc.rect(boxX, y, boxWidth, boxHeight);
//               doc.setFontSize(12);
//               doc.setFont('times', 'bold');
//               doc.text('Totals', boxX + 5, y + 8);
//               doc.setFont('times', 'normal');
//               doc.text(`Set: ${formatNumber(totalSettlement)}`, boxX + 5, y + 16);
//               y += 25;
//               doc.setFillColor(0, 51, 102);
//               doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
//               doc.setTextColor(255, 255, 255);
//               doc.setFontSize(10);
//               doc.setFont('times', 'bold');
//               doc.text('Date', tableX + 2, y + 6);
//               doc.text('Domain', tableX + 42, y + 6);
//               doc.text('Settlement', tableX + 92, y + 6);
//               doc.text('Rate', tableX + 142, y + 6);
//               y += baseRowHeight;
//               doc.setFont('times', 'normal');
//               doc.setTextColor(0, 0, 0);
//             }
//           });

//           // Add report generation timestamp
//           y += 15;
//           const now = new Date();
//           const hours = now.getHours() % 12 || 12;
//           const minutes = String(now.getMinutes()).padStart(2, '0');
//           const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
//           const genDate = formatDate(now).replace(/\d{4}$/, `'${now.getFullYear().toString().slice(2)}`);
//           const genTime = `${hours}:${minutes} ${ampm} | ${genDate}`;
//           doc.setFontSize(9);
//           doc.setTextColor(100, 100, 100);
//           doc.text(`Report Generated: ${genTime}`, tableX, y);

//           doc.save(`${group.name}_settlement_statement.pdf`);
//         });
//       })
//       .catch((err) => {
//         console.error('Download settlements failed:', err);
//         if (err.includes('token') || err.includes('Unauthorized')) {
//           toast.error('Session expired. Please log in again.');
//           dispatch(logout());
//           window.location.href = '/login';
//         } else {
//           toast.error(err || 'Failed to download settlements');
//         }
//       });
//   };

//   // Filter settlements by selected domain
//   const filteredSettlements = selectedDomain && selectedDomain.value
//     ? settlements.filter((sett) => sett.domain?._id === selectedDomain.value)
//     : settlements;

//   // Pagination logic
//   const sortedSettlements = [...filteredSettlements]
//     .filter((sett) => sett && sett._id && sett.date && !isNaN(new Date(sett.date)))
//     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//   const totalPages = Math.ceil(sortedSettlements.length / entriesPerPage);
//   const indexOfLast = currentPage * entriesPerPage;
//   const indexOfFirst = indexOfLast - entriesPerPage;
//   const currentSettlements = sortedSettlements.slice(indexOfFirst, indexOfLast);

//   // Calculate totals for display
//   const totalSettlement = sortedSettlements.reduce((sum, sett) => sum + (sett.settlement || 0), 0);
//   const totalRate = sortedSettlements.reduce((sum, sett) => sum + (sett.rate || 0), 0);

//   // Show loading state while checking authentication
//   if (loadingAuth) {
//     return <div className="container mx-auto p-4 text-center">Loading authentication...</div>;
//   }

//   return (
//     <div className="container mx-auto p-4 bg-white min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">Settlements</h1>

//       <button
//         onClick={() => {
//           console.log('Toggling form visibility, current showForm:', showForm);
//           setShowForm(!showForm);
//         }}
//         className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//       >
//         {showForm ? 'Cancel' : 'Add New Settlement'}
//       </button>

//       {showForm && (
//         <div className="mb-8 p-4 bg-gray-100 rounded">
//           <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Settlement' : 'Create Settlement'}</h2>
//           <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Date*</label>
//               <input
//                 type="date"
//                 name="date"
//                 value={formData.date}
//                 onChange={handleInputChange}
//                 required
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Domain Name*</label>
//               <Select
//                 options={domainOptions}
//                 value={selectedDomain || null}
//                 onChange={handleDomainChange}
//                 placeholder="Select a domain"
//                 className="w-full"
//                 classNamePrefix="select"
//                 isClearable
//                 isSearchable
//                 noOptionsMessage={() => 'No domains available. Add domains first.'}
//                 styles={{
//                   control: (base) => ({
//                     ...base,
//                     borderColor: '#d1d5db',
//                     padding: '2px',
//                     borderRadius: '0.375rem',
//                     boxShadow: 'none',
//                     '&:hover': { borderColor: '#3b82f6' },
//                     '&:focus': { borderColor: '#3b82f6', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' },
//                   }),
//                 }}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Settlement Amount*</label>
//               <input
//                 type="text"
//                 name="settlement"
//                 value={formData.settlement}
//                 onChange={handleInputChange}
//                 placeholder="Enter settlement amount"
//                 required
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Rate*</label>
//               <input
//                 type="text"
//                 name="rate"
//                 value={formData.rate}
//                 onChange={handleInputChange}
//                 placeholder="Enter rate"
//                 required
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
//               />
//             </div>
//             <div className="flex gap-2 items-center">
//               <button
//                 type="submit"
//                 disabled={loading || !user}
//                 className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
//                 title={editId ? 'Update Settlement' : 'Add Settlement'}
//               >
//                 <FaPlus size={18} />
//                 {editId ? 'Update' : 'Add'}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => handleDownload(selectedDomain?.value)}
//                 disabled={!selectedDomain || !user}
//                 className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-purple-600"
//                 title="Download Settlements"
//               >
//                 <FaFileDownload size={18} />
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {loading && <p className="text-blue-600 text-center">Loading...</p>}
//       {error && <p className="text-red-600 text-center">{error}</p>}

//       <div className="mb-8">
//         {sortedSettlements.length > 0 ? (
//           <div className="mb-8 overflow-x-auto">
//             <div className="flex justify-between items-start mb-4">
//               <h3 className="text-xl font-semibold text-gray-800">
//                 {selectedDomain ? selectedDomain.label : 'All Settlements'}
//               </h3>
//               <div
//                 className="bg-white flex gap-4 border-2 border-gray-300 p-4 rounded-lg shadow-xl md:w-1/3 bg-gradient-to-br from-gray-50 to-gray-100"
//               >
//                 <div className="border-b border-gray-400 pb-2 mb-1">
//                   <span className="text-2xl font-bold font-sans text-gray-800">Totals</span>
//                 </div>
//                 <div className="text-2xl font-extrabold font-sans text-gray-800">
//                   Set: ₹ {formatNumber(totalSettlement)}
//                 </div>
//               </div>
//             </div>
//             <div className="flex justify-between items-center mb-4">
//               <p className="text-gray-600">
//                 Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedSettlements.length)} of {sortedSettlements.length} entries
//               </p>
//               <div className="flex gap-4 items-center">
//                 <div className="flex items-center gap-2">
//                   <label className="text-gray-700">Show</label>
//                   <Select
//                     options={entriesPerPageOptions}
//                     value={entriesPerPageOptions.find((option) => option.value === entriesPerPage)}
//                     onChange={handleEntriesPerPageChange}
//                     className="w-24"
//                     classNamePrefix="select"
//                     styles={{
//                       control: (base) => ({
//                         ...base,
//                         borderColor: '#d1d5db',
//                         padding: '2px',
//                         borderRadius: '0.375rem',
//                         boxShadow: 'none',
//                         '&:hover': { borderColor: '#3b82f6' },
//                         '&:focus': { borderColor: '#3b82f6', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' },
//                       }),
//                     }}
//                   />
//                   <label className="text-gray-700">entries</label>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="number"
//                     value={pageInput}
//                     onChange={handlePageInputChange}
//                     placeholder="Page"
//                     className="border border-gray-300 p-2 rounded w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//                   />
//                   <button
//                     onClick={handleGoToPage}
//                     className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
//                     title="Go to Page"
//                   >
//                     <FaArrowRight size={18} />
//                   </button>
//                 </div>
//               </div>
//             </div>
//             <table className="w-full border-collapse bg-white shadow-md rounded-lg">
//               <thead>
//                 <tr className="bg-blue-900 text-white">
//                   <th className="p-3 text-left">Date</th>
//                   <th className="p-3 text-left">Domain</th>
//                   <th className="p-3 text-left">Settlement</th>
//                   <th className="p-3 text-left">Rate</th>
//                   <th className="p-3 text-left">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentSettlements.map((settlement, index) => (
//                   <tr
//                     key={settlement._id}
//                     className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
//                   >
//                     <td className="p-3">{formatDate(settlement.date)}</td>
//                     <td className="p-3">{settlement.domain?.domainname || 'Unknown'}</td>
//                     <td className="p-3 text-green-600">{formatNumber(settlement.settlement)}</td>
//                     <td className="p-3">{formatNumber(settlement.rate)}</td>
//                     <td className="p-3 flex gap-2">
//                       <button
//                         onClick={() => handleEdit(settlement)}
//                         className="text-blue-600 hover:text-blue-800"
//                         title="Edit Settlement"
//                       >
//                         <FaEdit size={18} />
//                       </button>
//                       <button
//                         onClick={() => handleDelete(settlement._id)}
//                         className="text-red-600 hover:text-red-800"
//                         title="Delete Settlement"
//                       >
//                         <FaTrash size={18} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <div className="flex justify-between items-center mt-4">
//               <button
//                 onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-blue-600"
//               >
//                 Previous
//               </button>
//               <span>Page {currentPage} of {totalPages}</span>
//               <button
//                 onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                 disabled={currentPage === totalPages}
//                 className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-blue-600"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         ) : (
//           <p className="text-gray-600">No settlements available{selectedDomain ? ` for ${selectedDomain.label}` : ''}. Add domains and settlements to view data.</p>
//         )}
//         {groupedSettlements && Object.values(groupedSettlements).length > 0 && (
//           <div className="mt-8">
//             <h2 className="text-xl font-semibold mb-4">Grouped Settlements</h2>
//             {Object.values(groupedSettlements).map((group) => (
//               <div key={group.name} className="mb-4 p-4 bg-gray-50 rounded shadow">
//                 <h3 className="text-lg font-medium">{group.name}</h3>
//                 <p>Total Settlement: ₹ {formatNumber(group.totalSettlement)}</p>
//                 <p>Total Rate: ₹ {formatNumber(group.totalRate)}</p>
//                 <button
//                   onClick={() => handleDownload(group.accounts[0]?.domainId || null)}
//                   className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                 >
//                   Download {group.name} Settlements
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Settlement;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  createSettlement, 
  getSettlements, 
  updateSettlement, 
  deleteSettlement, 
  downloadSettlements,
  fetchDomains,
  reset 
} from '../redux/settlementSlice';
import { loadUser, logout } from '../redux/authSlice';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { FaPlus, FaEdit, FaTrash, FaFileDownload, FaArrowRight } from 'react-icons/fa';
import { jsPDF } from 'jspdf';

// Utility function to format numbers with commas, handling negative numbers
const formatNumber = (number) => {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return Number(number).toLocaleString('en-IN');
};

// Utility function to remove commas for raw number
const parseNumber = (value) => {
  if (!value) return '';
  return value.replace(/,/g, '');
};

// Utility function to format dates
const formatDate = (date) => {
  if (!date || isNaN(new Date(date))) return 'N/A';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-GB', options);
};

const Settlement = () => {
  const dispatch = useDispatch();
  const { settlements, domains, loading, error, success, message } = useSelector((state) => state.settlement || {});
  const { currentUser: user, token, loading: loadingAuth } = useSelector((state) => state.user || {});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    domain: '',
    settlement: '',
    rate: '',
  });
  const [editId, setEditId] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);

  const domainOptions = [
    { value: '', label: 'Select a Domain' },
    ...domains.map((domain) => ({ value: domain._id, label: domain.domainname })),
  ];

  const entriesPerPageOptions = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ];

  useEffect(() => {
    dispatch(loadUser()).then((result) => {
      if (result.type === 'user/loadUser/fulfilled') {
        dispatch(fetchDomains());
        dispatch(getSettlements());
      } else {
        toast.error('Please log in to access settlements');
        dispatch(logout());
        window.location.href = '/login';
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      if (error.includes('token') || error.includes('Unauthorized')) {
        toast.error('Session expired. Please log in again.');
        dispatch(logout());
        window.location.href = '/login';
      } else {
        toast.error(error);
      }
      dispatch(reset());
    }
    if (success && message) {
      toast.success(message);
      dispatch(reset());
    }
  }, [error, success, message, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'settlement' || name === 'rate') {
      // Allow negative numbers, digits, and a single decimal point
      const numericValue = value.replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '').replace(/\.(?=.*\.)/g, '');
      const parts = numericValue.split('.');
      const num = parts[0];
      const integerPart = num === '' || num === '-' ? num : Number(num.replace(/^-/, '')).toLocaleString('en-IN');
      let formattedValue = num.startsWith('-') ? `-${integerPart}` : integerPart;
      if (parts.length > 1 && parts[1]) {
        formattedValue += '.' + parts[1].slice(0, 2);
      }
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDomainChange = (selectedOption) => {
    setSelectedDomain(selectedOption);
    setFormData({ ...formData, domain: selectedOption?.value || '' });
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
    if (!formData.date || !formData.domain || !formData.settlement || !formData.rate) {
      toast.error('All fields are required');
      return;
    }
    const settlementData = {
      date: formData.date,
      domain: formData.domain,
      settlement: parseFloat(parseNumber(formData.settlement)),
      rate: parseFloat(parseNumber(formData.rate)),
    };
    if (editId) {
      dispatch(updateSettlement({ id: editId, settlementData }))
        .unwrap()
        .then(() => {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            domain: formData.domain,
            settlement: '',
            rate: '',
          });
          setEditId(null);
          dispatch(getSettlements());
          dispatch(fetchDomains());
        })
        .catch((err) => {
          if (err.includes('token') || err.includes('Unauthorized')) {
            toast.error('Session expired. Please log in again.');
            dispatch(logout());
            window.location.href = '/login';
          } else {
            toast.error(err || 'Failed to update settlement');
          }
        });
    } else {
      dispatch(createSettlement(settlementData))
        .unwrap()
        .then(() => {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            domain: formData.domain,
            settlement: '',
            rate: '',
          });
          dispatch(getSettlements());
          dispatch(fetchDomains());
        })
        .catch((err) => {
          if (err.includes('token') || err.includes('Unauthorized')) {
            toast.error('Session expired. Please log in again.');
            dispatch(logout());
            window.location.href = '/login';
          } else {
            toast.error(err || 'Failed to create settlement');
          }
        });
    }
  };

  const handleEdit = (settlement) => {
    setFormData({
      date: new Date(settlement.date).toISOString().split('T')[0],
      domain: settlement.domain?._id || '',
      settlement: formatNumber(settlement.settlement),
      rate: formatNumber(settlement.rate),
    });
    setSelectedDomain(
      settlement.domain ? { value: settlement.domain._id, label: settlement.domain.domainname } : null
    );
    setEditId(settlement._id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this settlement?')) {
      dispatch(deleteSettlement(id))
        .unwrap()
        .then(() => {
          dispatch(getSettlements());
          dispatch(fetchDomains());
        })
        .catch((err) => {
          if (err.includes('token') || err.includes('Unauthorized')) {
            toast.error('Session expired. Please log in again.');
            dispatch(logout());
            window.location.href = '/login';
          } else {
            toast.error(err || 'Failed to delete settlement');
          }
        });
    }
  };

  const handleDownload = () => {
    if (!selectedDomain) {
      toast.error('Please select a domain to download the statement.');
      return;
    }
    dispatch(downloadSettlements(selectedDomain.value))
      .unwrap()
      .then((data) => {
        const doc = new jsPDF();
        let y = 20;
        let page = 1;

        if (!data || Object.keys(data).length === 0) {
          toast.error('No data available to download');
          return;
        }

        Object.keys(data).forEach((domainName) => {
          const group = data[domainName];
          if (!group || !group.accounts || group.accounts.length === 0) return;

          // Header
          doc.setFillColor(0, 51, 102);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('times', 'bold');
          doc.text(`${group.name} Settlement Statement`, 10, 10);
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont('times', 'normal');
          y += 10;

          // Total Settlement Section (Right-aligned, Matching UI Styling)
          const totalSettlement = group.totalSettlement || 0;
          const boxWidth = 70; // Approximate md:w-1/3 (1/3 of A4 width ~210mm)
          const boxHeight = 20;
          const boxX = 210 - boxWidth - 10; // Right-aligned (A4 width - box width - margin)
          // Simulate gradient background (approximation with light gray)
          doc.setFillColor(245, 245, 245); // Light gray to approximate gray-50 to gray-100
          doc.rect(boxX, y, boxWidth, boxHeight, 'F');
          doc.setDrawColor(209, 213, 219); // Gray-300 border
          doc.rect(boxX, y, boxWidth, boxHeight);
          // Title
          doc.setFontSize(16); // Approximate text-2xl
          doc.setFont('helvetica', 'bold'); // Bold sans-serif font
          doc.setTextColor(31, 41, 55); // Gray-800
          doc.text('Total Settlement', boxX + 5, y + 8);
          // Amount
          doc.setFontSize(18); // Larger for extrabold amount
          doc.setFont('helvetica', 'bold'); // Extrabold sans-serif font
          doc.text(`Rs ${formatNumber(totalSettlement)}`, boxX + 5, y + 16); // Changed ₹ to Rs
          y += 25;

          // Table setup
          const tableX = 10;
          const tableWidth = 190;
          const colWidths = [40, 50, 50, 50];
          const baseRowHeight = 8;
          doc.setFillColor(0, 51, 102);
          doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('times', 'bold');
          doc.text('Date', tableX + 2, y + 6);
          doc.text('Domain', tableX + 42, y + 6);
          doc.text('Settlement', tableX + 92, y + 6);
          doc.text('Rate', tableX + 142, y + 6);
          y += baseRowHeight;
          doc.setFont('times', 'normal');
          doc.setTextColor(0, 0, 0);

          const validAccounts = group.accounts
            .filter((acc) => acc && acc.date && !isNaN(new Date(acc.date)))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          validAccounts.forEach((acc, rowIndex) => {
            if (rowIndex % 2 === 0) {
              doc.setFillColor(240, 240, 240);
              doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
            }
            doc.setDrawColor(150, 150, 150);
            doc.rect(tableX, y, tableWidth, baseRowHeight);
            let x = tableX;
            colWidths.forEach((width, i) => {
              if (i === 0) doc.text(formatDate(acc.date), x + 2, y + 6);
              if (i === 1) doc.text(acc.domainname || 'Unknown', x + 2, y + 6);
              if (i == 2) doc.text(formatNumber(acc.settlement || 0), x + 2, y + 6);
              if (i == 3) doc.text(formatNumber(acc.rate || 0), x + 2, y + 6);
              x += width;
            });
            y += baseRowHeight;

            if (y > 260 && rowIndex < validAccounts.length - 1) {
              doc.addPage();
              y = 20;
              page++;
              doc.setFillColor(0, 51, 102);
              doc.rect(0, 0, 210, 15, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(14);
              doc.setFont('times', 'bold');
              doc.text(`${group.name} Settlement Statement`, 10, 10);
              y += 15;
              // Total Settlement Section on New Page
              doc.setFillColor(245, 245, 245);
              doc.rect(boxX, y, boxWidth, boxHeight, 'F');
              doc.setDrawColor(209, 213, 219);
              doc.rect(boxX, y, boxWidth, boxHeight);
              doc.setFontSize(16);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(31, 41, 55);
              doc.text('Total Settlement', boxX + 5, y + 8);
              doc.setFontSize(18);
              doc.setFont('helvetica', 'bold');
              doc.text(`Rs ${formatNumber(totalSettlement)}`, boxX + 5, y + 16); // Changed ₹ to Rs
              y += 25;
              doc.setFillColor(0, 51, 102);
              doc.rect(tableX, y, tableWidth, baseRowHeight, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(10);
              doc.setFont('times', 'bold');
              doc.text('Date', tableX + 2, y + 6);
              doc.text('Domain', tableX + 42, y + 6);
              doc.text('Settlement', tableX + 92, y + 6);
              doc.text('Rate', tableX + 142, y + 6);
              y += baseRowHeight;
              doc.setFont('times', 'normal');
              doc.setTextColor(0, 0, 0);
            }
          });

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

          doc.save(`${group.name}_settlement_statement.pdf`);
        });
      })
      .catch((err) => {
        if (err.includes('token') || err.includes('Unauthorized')) {
          toast.error('Session expired. Please log in again.');
          dispatch(logout());
          window.location.href = '/login';
        } else {
          toast.error(err || 'Failed to download settlements');
        }
      });
  };

  // Filter settlements by selected domain
  const filteredSettlements = selectedDomain && selectedDomain.value
    ? settlements.filter((sett) => sett.domain?._id === selectedDomain.value)
    : [];

  // Pagination logic
  const sortedSettlements = [...filteredSettlements]
    .filter((sett) => sett && sett._id && sett.date && !isNaN(new Date(sett.date)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalPages = Math.ceil(sortedSettlements.length / entriesPerPage);
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentSettlements = sortedSettlements.slice(indexOfFirst, indexOfLast);

  // Calculate totals for display
  const totalSettlement = sortedSettlements.reduce((sum, sett) => sum + (sett.settlement || 0), 0);

  if (loadingAuth) {
    return <div className="container mx-auto p-6 text-center text-blue-600">Loading authentication...</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-6">
        <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Domain Name*</label>
            <Select
              options={domainOptions.filter((option) => option.value !== '')}
              value={selectedDomain || null}
              onChange={handleDomainChange}
              placeholder="Select or type to search domain"
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
            <label className="block mb-1 font-medium text-gray-700">Settlement Amount*</label>
            <input
              type="text"
              name="settlement"
              value={formData.settlement}
              onChange={handleInputChange}
              placeholder="Enter settlement amount"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Rate*</label>
            <input
              type="text"
              name="rate"
              value={formData.rate}
              onChange={handleInputChange}
              placeholder="Enter rate"
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <div className="flex gap-2 items-center">
            <button
              type="submit"
              disabled={loading || !user}
              className="bg-blue-600 text-white p-2 flex items-center gap-2 rounded-[5px] hover:bg-blue-700 transition duration-200 col-span-1 md:col-auto"
              title={editId ? 'Update Settlement' : 'Add Settlement'}
            >
              <FaPlus size={18} />
              {editId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!selectedDomain || !user}
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200 col-span-1 md:col-auto"
              title="Download Statement"
            >
              <FaFileDownload size={18} />
            </button>
          </div>
        </form>

        {loading && <p className="text-blue-600 text-center">Loading...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {selectedDomain && sortedSettlements.length > 0 ? (
          <div className="mb-8 overflow-x-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{selectedDomain.label}</h3>
              <div
                className="bg-white flex gap-4 border-2 border-gray-300 p-4 rounded-lg shadow-xl md:w-1/3 bg-gradient-to-br from-gray-50 to-gray-100"
              >
                <div className="border-b border-gray-400 pb-2 mb-1">
                  <span className="text-2xl font-bold font-sans text-gray-800">Total Settlement</span>
                </div>
                <div className="text-2xl font-extrabold font-sans text-gray-800">Rs {formatNumber(totalSettlement)}</div>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedSettlements.length)} of {sortedSettlements.length} entries
              </p>
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
                  <th className="p-3 text-left">Domain</th>
                  <th className="p-3 text-left">Settlement</th>
                  <th className="p-3 text-left">Rate</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSettlements.map((settlement, index) => (
                  <tr
                    key={settlement._id}
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                  >
                    <td className="p-3">{formatDate(settlement.date)}</td>
                    <td className="p-3">{settlement.domain?.domainname || 'Unknown'}</td>
                    <td className="p-3 text-green-600">{formatNumber(settlement.settlement)}</td>
                    <td className="p-3">{formatNumber(settlement.rate)}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(settlement)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Settlement"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(settlement._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Settlement"
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
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
          </div>
        ) : (
          <p className="text-gray-600">Please select a domain to view settlements.</p>
        )}
      </div>
    </div>
  );
};

export default Settlement;