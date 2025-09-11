import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, fetchParties } from '../redux/accountSlice';

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

  useEffect(() => {
    dispatch(fetchParties()).unwrap().catch((err) => {
      if (err === 'No token available' || err.includes('Invalid token')) {
        navigate('/'); // Redirect to login if token is missing or invalid
      }
    });
    dispatch(fetchAccounts()).unwrap().catch((err) => {
      if (err === 'No token available' || err.includes('Invalid token')) {
        navigate('/'); // Redirect to login
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
      dispatch(updateAccount({ id: editId, ...accountData })).unwrap().catch((err) => {
        if (err === 'No token available' || err.includes('Invalid token')) {
          navigate('/'); // Redirect to login
        }
      });
      setEditId(null);
    } else {
      dispatch(createAccount(accountData)).unwrap().catch((err) => {
        if (err === 'No token available' || err.includes('Invalid token')) {
          navigate('/'); // Redirect to login
        }
      });
    }
    setFormData({ partyname: '', credit: '', debit: '', remark: '' });
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
    dispatch(deleteAccount(id)).unwrap().catch((err) => {
      if (err === 'No token available' || err.includes('Invalid token')) {
        navigate('/'); // Redirect to login
      }
    });
  };

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    // Include token in the download request
    window.location.href = `http://localhost:4050/api/accounts/statement/download?token=${token}`;
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
              <p>Credit: {account.credit}</p>
              <p>Debit: {account.debit}</p>
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