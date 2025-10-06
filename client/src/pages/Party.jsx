// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchParties, createParty, updateParty, deleteParty } from '../redux/partySlice';
// import 'tailwindcss/tailwind.css';
// import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// const Party = () => {
//   const dispatch = useDispatch();
//   const { parties, loading, error } = useSelector((state) => state.party);
//   const [partyName, setPartyName] = useState('');
//   const [editId, setEditId] = useState(null);

//   useEffect(() => {
//     dispatch(fetchParties());
//   }, [dispatch]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!partyName.trim()) return;
//     if (editId) {
//       dispatch(updateParty({ id: editId, partyname: partyName }));
//       setEditId(null);
//     } else {
//       dispatch(createParty({ partyname: partyName }));
//     }
//     setPartyName('');
//   };

//   const handleEdit = (party) => {
//     setPartyName(party.partyname);
//     setEditId(party._id);
//   };

//   const handleDelete = (id) => {
//     if (!window.confirm('Are you sure you want to delete this party?')) {
//       return;
//     }
//     dispatch(deleteParty(id));
//   };

//   return (
//     <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
//       <div className='bg-white shadow-xl rounded-lg p-6'>
//         <h1 className="text-2xl font-bold mb-4">Party Management</h1>

//         <form onSubmit={handleSubmit} className="mb-6 flex items-center">
//           <input
//             type="text"
//             value={partyName}
//             onChange={(e) => setPartyName(e.target.value)}
//             placeholder="Enter party name"
//             className="border p-2 rounded mr-2 flex-grow"
//           />
//           <button
//             type="submit"
//             className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex items-center"
//           >
//             <FaPlus className="mr-1" />
//             {editId ? 'Update' : 'Add'}
//           </button>
//         </form>

//         {loading && <p>Loading...</p>}
//         {error && <p className="text-red-500">{error}</p>}

//         <ul className="space-y-2">
//           {parties.map((party) => (
//             <li key={party._id} className="flex justify-between items-center border p-2 rounded">
//               <span>{party.partyname}</span>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => handleEdit(party)}
//                   className="  p-1 rounded text-yellow-600 flex items-center"
//                 >
//                   <FaEdit className="mr-1" />

//                 </button>
//                 <button
//                   onClick={() => handleDelete(party._id)}
//                   className=" text-red-600 p-2 rounded  flex items-center"
//                 >
//                   <FaTrash className="mr-1" />

//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default Party;

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchParties, createParty, updateParty, deleteParty } from '../redux/partySlice';
import 'tailwindcss/tailwind.css';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const Party = () => {
  const dispatch = useDispatch();
  const { parties, loading, error } = useSelector((state) => state.party);
  const [formData, setFormData] = useState({
    partyname: '',
    mobileNumber: '',
    city: '',
    remark: ''
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchParties());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.partyname.trim()) return;
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) {
      alert('Mobile number must be exactly 10 digits');
      return;
    }
    if (editId) {
      dispatch(updateParty({ id: editId, ...formData }));
      setEditId(null);
    } else {
      dispatch(createParty(formData));
    }
    setFormData({ partyname: '', mobileNumber: '', city: '', remark: '' });
  };

  const handleEdit = (party) => {
    setFormData({
      partyname: party.partyname,
      mobileNumber: party.mobileNumber || '',
      city: party.city || '',
      remark: party.remark || ''
    });
    setEditId(party._id);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this party?')) {
      return;
    }
    dispatch(deleteParty(id));
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className='bg-white shadow-xl rounded-lg p-6'>
        <h1 className="text-2xl font-bold mb-4">Party Management</h1>

        <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-2">
          <input
            type="text"
            name="partyname"
            value={formData.partyname}
            onChange={handleInputChange}
            placeholder="Enter party name"
            className="border p-2 rounded flex-1 min-w-[150px]"
            required
          />
          <input
            type="text"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            placeholder="Enter mobile number (10 digits)"
            className="border p-2 rounded flex-1 min-w-[150px]"
          />
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Enter city"
            className="border p-2 rounded flex-1 min-w-[150px]"
          />
          <input
            type="text"
            name="remark"
            value={formData.remark}
            onChange={handleInputChange}
            placeholder="Enter remark"
            className="border p-2 rounded flex-1 min-w-[150px]"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex items-center justify-center min-w-[100px]"
          >
            <FaPlus className="mr-1" />
            {editId ? 'Update' : 'Add'}
          </button>
        </form>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Party Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Mobile Number</th>
                <th className="border border-gray-300 px-4 py-2 text-left">City</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Remark</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((party) => (
                <tr key={party._id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">{party.partyname}</td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-500">{party.mobileNumber || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-500">{party.city || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-500">{party.remark || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(party)}
                        className="p-1 rounded text-yellow-600 hover:bg-yellow-100 flex items-center"
                      >
                        <FaEdit className="mr-1" />
                      </button>
                      <button
                        onClick={() => handleDelete(party._id)}
                        className="text-red-600 p-1 rounded hover:bg-red-100 flex items-center"
                      >
                        <FaTrash className="mr-1" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Party;