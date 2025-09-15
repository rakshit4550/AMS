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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Prepare options for react-select
  const partyOptions = [
    { value: '', label: 'Select a Party' },
    ...parties.map((party) => ({ value: party._id, label: party.partyname })),
  ];

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionType: '',
    minAmount: '',
    maxAmount: '',
    verificationStatus: '',
  });

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
    setIsFilterOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
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

  // Sort accounts by _id timestamp (newest to oldest)
  const sortedAccounts = [...(selectedPartyAccounts || [])].sort((a, b) => {
    const tsA = parseInt(a._id.substring(0, 8), 16) * 1000;
    const tsB = parseInt(b._id.substring(0, 8), 16) * 1000;
    return tsB - tsA;
  });

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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto bg-white shadow-2xl rounded-xl p-6 sm:p-8 lg:p-10">
        {/* Header Section */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Account Report</h2>

        {/* Party Select and Filter Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-full sm:w-1/2 lg:w-1/3">
            <label className="block mb-2 text-sm font-semibold text-gray-700">Select Party</label>
            <Select
              options={partyOptions.filter((option) => option.value !== '')}
              value={partyOptions.find((option) => option.value === selectedParty) || null}
              onChange={handlePartyInputChange}
              placeholder="Select or type to search party"
              className="w-full"
              classNamePrefix="select"
              isClearable
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#e5e7eb',
                  padding: '4px',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': { borderColor: '#3b82f6' },
                  '&:focus': { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' },
                }),
                menu: (base) => ({
                  ...base,
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }),
              }}
            />
          </div>
          {selectedParty && (
            <button
              onClick={toggleFilterPopup}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-300 shadow-md"
            >
              {isFilterOpen ? 'Close Filters' : 'Open Filters'}
            </button>
          )}
        </div>

        {/* Filter Popup */}
        {isFilterOpen && selectedParty && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300" onClick={() => setIsFilterOpen(false)} />
            <div
              ref={filterRef}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out sm:rounded-l-xl p-6 sm:p-8 overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Advanced Filters</h3>
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Transaction Type</label>
                  <select
                    name="transactionType"
                    value={filters.transactionType}
                    onChange={handleFilterChange}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  >
                    <option value="">All</option>
                    <option value="credit">Credit (Dena)</option>
                    <option value="debit">Debit (Lena)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Verification Status</label>
                  <select
                    name="verificationStatus"
                    value={filters.verificationStatus}
                    onChange={handleFilterChange}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  >
                    <option value="">All</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Min Amount</label>
                    <input
                      type="number"
                      name="minAmount"
                      value={filters.minAmount}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Max Amount</label>
                    <input
                      type="number"
                      name="maxAmount"
                      value={filters.maxAmount}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="mt-6 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Apply Filters
              </button>
            </div>
          </>
        )}

        {/* Loading and Error States */}
        {loading && <p className="text-blue-600 text-center text-lg">Loading...</p>}
        {error && <p className="text-red-600 text-center text-lg">{error}</p>}

        {/* Party Account Table */}
        {selectedParty && selectedPartyAccounts.length > 0 ? (
          <div className="mb-8 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">{selectedPartyName}</h3>
              <div className={`text-lg font-semibold ${balanceColor}`}>
                Closing Balance: ₹{balValue} {balSign}
              </div>
            </div>
            <div className="shadow-lg rounded-lg overflow-hidden">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                    <th className="border border-gray-200 p-4 text-left">Date</th>
                    <th className="border border-gray-200 p-4 text-left">Debit (-)</th>
                    <th className="border border-gray-200 p-4 text-left">Credit (+)</th>
                    <th className="border border-gray-200 p-4 text-left">Remark</th>
                    <th className="border border-gray-200 p-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAccounts.map((account) => (
                    <tr
                      key={account._id}
                      className={`hover:bg-gray-50 transition duration-150 ${
                        account.verified ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <td className="border border-gray-200 p-4">
                        {new Date(account.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="border border-gray-200 p-4 text-red-600">
                        {account.debit > 0 ? account.debit.toFixed(2) : ''}
                      </td>
                      <td className="border border-gray-200 p-4 text-green-600">
                        {account.credit > 0 ? account.credit.toFixed(2) : ''}
                      </td>
                      <td className="border border-gray-200 p-4">{account.remark || ''}</td>
                      <td className="border border-gray-200 p-4">
                        {account.verified ? 'Verified' : 'Not Verified'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedParty ? (
          <p className="text-gray-600 text-center text-lg">No accounts available for selected party.</p>
        ) : (
          <p className="text-gray-600 text-center text-lg">Please select a party to view their account statement.</p>
        )}
      </div>
    </div>
  );
};

export default Report;