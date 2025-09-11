import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchParties, createParty, updateParty, deleteParty } from '../redux/partySlice';
import 'tailwindcss/tailwind.css';

const Party = () => {
  const dispatch = useDispatch();
  const { parties, loading, error } = useSelector((state) => state.party);
  const [partyName, setPartyName] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchParties());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!partyName.trim()) return;
    if (editId) {
      dispatch(updateParty({ id: editId, partyname: partyName }));
      setEditId(null);
    } else {
      dispatch(createParty({ partyname: partyName }));
    }
    setPartyName('');
  };

  const handleEdit = (party) => {
    setPartyName(party.partyname);
    setEditId(party._id);
  };

  const handleDelete = (id) => {
    dispatch(deleteParty(id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Party Management</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          placeholder="Enter party name"
          className="border p-2 rounded mr-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {editId ? 'Update Party' : 'Add Party'}
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <ul className="space-y-2">
        {parties.map((party) => (
          <li key={party._id} className="flex justify-between items-center border p-2 rounded">
            <span>{party.partyname}</span>
            <div>
              <button
                onClick={() => handleEdit(party)}
                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(party._id)}
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

export default Party;