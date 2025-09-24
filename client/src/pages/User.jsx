import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser, login, logout } from '../redux/authSlice';
import 'tailwindcss/tailwind.css';

const User = () => {
  const dispatch = useDispatch();
  const { users, currentUser, role, loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
  const [editId, setEditId] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (role === 'admin') {
      dispatch(fetchUsers());
    } else if (currentUser) {
      dispatch(fetchUsers(currentUser.id)); // Fetch only own data for non-admins
    }
  }, [dispatch, role, currentUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login(loginData)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setLoginData({ email: '', password: '' });
      }
    });
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      alert('Username, email, and password are required');
      return;
    }
    if (editId) {
      dispatch(updateUser({ id: editId, ...formData }));
      setEditId(null);
    } else {
      dispatch(createUser(formData));
    }
    setFormData({ username: '', email: '', password: '', role: 'user' });
  };

  const handleEdit = (user) => {
    setFormData({ username: user.username, email: user.email, password: '', role: user.role });
    setEditId(user._id);
  };

  const handleDelete = (id) => {
    dispatch(deleteUser(id));
  };

  return (
    <div className="cmin-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className='bg-white shadow-xl rounded-lg p-6'>

        {!currentUser ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                name="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="Username or Email"
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Password"
                className="border p-2 rounded w-full"
                required
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Login
              </button>
            </form>
          </div>
        ) : (
          <div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-6"
            >
              Logout
            </button>

            {role === 'admin' && (
              <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                <div>
                  <label className="block mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editId ? 'Update User' : 'Add User'}
                </button>
              </form>
            )}

            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <h2 className="text-xl font-semibold mb-2">User List</h2>
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user._id} className="flex justify-between items-center border p-2 rounded">
                  <div>
                    <p>Username: {user.username}</p>
                    <p>Email: {user.email}</p>
                    <p>Role: {user.role}</p>
                  </div>
                  {(role === 'admin' || user._id === currentUser.id) && (
                    <div>
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      {role === 'admin' && (
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default User;