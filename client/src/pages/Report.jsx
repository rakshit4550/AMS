import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAccounts, fetchParties } from '../redux/accountSlice';
import Select from 'react-select';

const Report = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accounts, parties, loading, error } = useSelector((state) => state.account);
  const [selectedParty, setSelectedParty] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10); // Default to 10 entries
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionType: '',
    minAmount: '',
    maxAmount: '',
    verificationStatus: '', // New filter for verified/unverified
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Filter popup state
  const filterRef = useRef(null); // Ref for filter popup

  // Prepare options for react-select
  const partyOptions = [
    { value: '', label: 'Select a Party' },
    ...parties.map((party) => ({ value: party._id, label: party.partyname })),
  ];

  // Entries per page options
  const entriesOptions = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
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

  // Handle clicks outside the filter popup to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePartyInputChange = (selectedOption) => {
    setSelectedParty(selectedOption ? selectedOption.value : '');
    setCurrentPage(1); // Reset to first page when party changes
    setIsFilterOpen(false); // Close filter popup when party changes
  };

  const handleEntriesChange = (selectedOption) => {
    setEntriesPerPage(selectedOption ? selectedOption.value : 10);
    setCurrentPage(1); // Reset to first page when entries per page changes
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const toggleFilterPopup = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Filter accounts for the selected party and apply advanced filters
  const selectedPartyAccounts = selectedParty
    ? accounts.filter((account) => {
        if (account.partyname?._id !== selectedParty) return false;

        // Date range filter
        if (filters.startDate && new Date(account.date) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(account.date) > new Date(filters.endDate)) return false;

        // Transaction type filter
        if (filters.transactionType) {
          if (filters.transactionType === 'credit' && account.credit <= 0) return false;
          if (filters.transactionType === 'debit' && account.debit <= 0) return false;
        }

        // Amount range filter
        const amount = account.credit > 0 ? account.credit : account.debit;
        if (filters.minAmount && amount < parseFloat(filters.minAmount)) return false;
        if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) return false;

        // Verification status filter
        if (filters.verificationStatus) {
          if (filters.verificationStatus === 'verified' && !account.verified) return false;
          if (filters.verificationStatus === 'unverified' && account.verified) return false;
        }

        return true;
      })
    : [];

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

  // Get the party name for the selected party
  const selectedPartyName = selectedParty
    ? parties.find((party) => party._id === selectedParty)?.partyname || 'Selected Party'
    : '';

  return (
    <div className="container mx-auto p-4 bg-white shadow-lg rounded-lg relative">
      {/* Party Select and Entries Per Page */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700">Party Name</label>
          <Select
            options={partyOptions.filter((option) => option.value !== '')}
            value={partyOptions.find((option) => option.value === selectedParty) || null}
            onChange={handlePartyInputChange}
            placeholder="Select or type to search party"
            className="w-full max-w-md"
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
        {selectedParty && (
          <div className="flex items-end gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Entries per page</label>
              <Select
                options={entriesOptions}
                value={entriesOptions.find((option) => option.value === entriesPerPage)}
                onChange={handleEntriesChange}
                placeholder="Select entries per page"
                className="w-full max-w-md"
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
            </div>
            <button
              onClick={toggleFilterPopup}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
            >
              {isFilterOpen ? 'Close Filters' : 'Open Filters'}
            </button>
          </div>
        )}
      </div>

      {/* Filter Popup */}
      {isFilterOpen && selectedParty && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setIsFilterOpen(false)} />
      )}
      {isFilterOpen && selectedParty && (
        <div
          ref={filterRef}
          className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Filters</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Transaction Type</label>
                <select
                  name="transactionType"
                  value={filters.transactionType}
                  onChange={handleFilterChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="credit">Credit (Dena)</option>
                  <option value="debit">Debit (Lena)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">Verification Status</label>
                <select
                  name="verificationStatus"
                  value={filters.verificationStatus}
                  onChange={handleFilterChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Min Amount</label>
                  <input
                    type="number"
                    name="minAmount"
                    value={filters.minAmount}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Max Amount</label>
                  <input
                    type="number"
                    name="maxAmount"
                    value={filters.maxAmount}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && <p className="text-blue-600">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Party Account Table */}
      {selectedParty && selectedPartyAccounts.length > 0 ? (
        <div className="mb-8 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">{selectedPartyName}</h3>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border p-2">Date</th>
                <th className="border p-2">Debit (-)</th>
                <th className="border p-2">Credit (+)</th>
                <th className="border p-2">Remark</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentAccounts.map((account, index) => (
                <tr
                  key={account._id}
                  className={account.verified ? 'bg-green-100' : 'bg-red-100'}
                >
                  <td className="border p-2">{new Date(account.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td className="border p-2 text-red-600">{account.debit > 0 ? account.debit.toFixed(2) : ''}</td>
                  <td className="border p-2 text-green-600">{account.credit > 0 ? account.credit.toFixed(2) : ''}</td>
                  <td className="border p-2">{account.remark || 'N/A'}</td>
                  <td className="border p-2">{account.verified ? 'Verified' : 'Not Verified'}</td>
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
        </div>
      ) : selectedParty ? (
        <p className="text-gray-600">No accounts available for selected party.</p>
      ) : (
        <p className="text-gray-600">Please select a party to view their account statement.</p>
      )}
    </div>
  );
};

export default Report;