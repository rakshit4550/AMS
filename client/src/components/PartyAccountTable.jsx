import React, { useState } from 'react';
const PartyAccountTable = ({ partyname, accounts, onEdit, onDelete, onVerify, entriesPerPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  // Ensure accounts are sorted by date in descending order (newest first)
  const sortedAccounts = [...accounts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(accounts.length / entriesPerPage);
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentAccounts = sortedAccounts.slice(indexOfFirst, indexOfLast);
  const totalDebit = accounts.reduce((sum, account) => sum + account.debit, 0);
  const totalCredit = accounts.reduce((sum, account) => sum + account.credit, 0);
  const balance = totalDebit - totalCredit;
  const balSign = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '';
  const balValue = Math.abs(balance).toFixed(2);
  const balanceColor = balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800';

  return (
    <div className="mb-8 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{partyname}</h3>
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
                  onClick={() => !account.verified && onEdit(account)}
                  className={`bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={account.verified}
                >
                  Edit
                </button>
                <button
                  onClick={() => !account.verified && onDelete(account._id)}
                  className={`bg-red-500 text-white px-2 py-1 rounded mr-2 hover:bg-red-600 transition duration-200 ${account.verified ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={account.verified}
                >
                  Delete
                </button>
                <button
                  onClick={() => onVerify(account._id)}
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
        <p>Showing {indexOfFirst + 1} to {Math.min(indexOfLast, sortedAccounts.length)} of {accounts.length} entries</p>
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
  );
};

export default PartyAccountTable