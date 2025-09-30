import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDomains, createDomain, updateDomain, deleteDomain } from '../redux/domainSlice';
import 'tailwindcss/tailwind.css';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const Domain = () => {
  const dispatch = useDispatch();
  const { domains, loading, error } = useSelector((state) => state.domain);
  const [domainName, setDomainName] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchDomains());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!domainName.trim()) return;
    if (editId) {
      dispatch(updateDomain({ id: editId, domainname: domainName }));
      setEditId(null);
    } else {
      dispatch(createDomain({ domainname: domainName }));
    }
    setDomainName('');
  };

  const handleEdit = (domain) => {
    setDomainName(domain.domainname);
    setEditId(domain._id);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) {
      return;
    }
    dispatch(deleteDomain(id));
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className='bg-white shadow-xl rounded-lg p-6'>
        <h1 className="text-2xl font-bold mb-4">Domain Management</h1>

        <form onSubmit={handleSubmit} className="mb-6 flex items-center">
          <input
            type="text"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            placeholder="Enter domain name"
            className="border p-2 rounded mr-2 flex-grow"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex items-center"
          >
            <FaPlus className="mr-1" />
            {editId ? 'Update' : 'Add'}
          </button>
        </form>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <ul className="space-y-2">
          {domains.map((domain) => (
            <li key={domain._id} className="flex justify-between items-center border p-2 rounded">
              <span>{domain.domainname}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(domain)}
                  className="p-1 rounded text-yellow-600 flex items-center"
                >
                  <FaEdit className="mr-1" />
                </button>
                <button
                  onClick={() => handleDelete(domain._id)}
                  className="text-red-600 p-2 rounded flex items-center"
                >
                  <FaTrash className="mr-1" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Domain;