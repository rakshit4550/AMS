import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  createSettlement, 
  getSettlements, 
  updateSettlement, 
  deleteSettlement, 
  downloadSettlements,
  reset 
} from '../redux/settlementSlice';
import { toast } from 'react-toastify';

const Settlement = () => {
  const dispatch = useDispatch();
  const { settlements, loading, error, success, groupedSettlements } = useSelector((state) => state.settlement);
  const { user } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    date: '',
    domainname: '',
    settlement: '',
    rate: '',
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    console.log('useEffect triggered, user:', user);
    if (user) {
      dispatch(getSettlements());
    }
    if (error) {
      console.log('Error in settlement state:', error);
      toast.error(error);
      dispatch(reset());
    }
    if (success) {
      console.log('Operation successful');
      toast.success('Operation successful!');
      dispatch(reset());
    }
  }, [user, error, success, dispatch]);

  const handleInputChange = (e) => {
    console.log('Input changed:', e.target.name, e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    const settlementData = {
      date: formData.date,
      domainname: formData.domainname,
      settlement: Number(formData.settlement),
      rate: Number(formData.rate),
    };

    if (editId) {
      console.log('Updating settlement with ID:', editId, 'Data:', settlementData);
      dispatch(updateSettlement({ id: editId, settlementData }));
      setEditId(null);
    } else {
      console.log('Creating new settlement:', settlementData);
      dispatch(createSettlement(settlementData)).then((result) => {
        if (result.type === 'settlement/create/rejected') {
          console.log('Create settlement failed:', result.payload);
          toast.error(result.payload || 'Failed to create settlement');
        } else {
          console.log('Create settlement succeeded:', result.payload);
        }
      });
    }
    setFormData({ date: '', domainname: '', settlement: '', rate: '' });
    setShowForm(false);
  };

  const handleEdit = (settlement) => {
    console.log('Editing settlement:', settlement);
    setFormData({
      date: settlement.date.split('T')[0],
      domainname: settlement.domainname,
      settlement: settlement.settlement,
      rate: settlement.rate,
    });
    setEditId(settlement._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    console.log('Deleting settlement with ID:', id);
    if (window.confirm('Are you sure you want to delete this settlement?')) {
      dispatch(deleteSettlement(id));
    }
  };

  const handleDownload = (domainId = null) => {
    console.log('Downloading settlements, domainId:', domainId);
    dispatch(downloadSettlements(domainId)).then((result) => {
      if (result.type === 'settlement/download/fulfilled') {
        const data = JSON.stringify(result.payload, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settlements${domainId ? `_${domainId}` : ''}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.log('Download settlements failed:', result.payload);
        toast.error(result.payload || 'Failed to download settlements');
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Settlements</h1>

      <button
        onClick={() => {
          console.log('Toggling form visibility, current showForm:', showForm);
          setShowForm(!showForm);
        }}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {showForm ? 'Cancel' : 'Add New Settlement'}
      </button>

      {showForm && (
        <div className="mb-8 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Settlement' : 'Create Settlement'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Domain Name</label>
              <input
                type="text"
                name="domainname"
                value={formData.domainname}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Settlement Amount</label>
              <input
                type="number"
                name="settlement"
                value={formData.settlement}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rate</label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : editId ? 'Update Settlement' : 'Create Settlement'}
            </button>
          </form>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => handleDownload()}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Download All Settlements
        </button>
      </div>

      {groupedSettlements && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Grouped Settlements</h2>
          {Object.values(groupedSettlements).map((group) => (
            <div key={group.name} className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-medium">{group.name}</h3>
              <p>Total Settlement: {group.totalSettlement}</p>
              <p>Total Rate: {group.totalRate}</p>
              <button
                onClick={() => handleDownload(group.name)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Download {group.name} Settlements
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settlements.map((settlement) => (
          <div key={settlement._id} className="p-4 bg-white rounded shadow">
            <p><strong>Date:</strong> {new Date(settlement.date).toLocaleDateString()}</p>
            <p><strong>Domain:</strong> {settlement.domainname}</p>
            <p><strong>Settlement:</strong> {settlement.settlement}</p>
            <p><strong>Rate:</strong> {settlement.rate}</p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => handleEdit(settlement)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(settlement._id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settlement;