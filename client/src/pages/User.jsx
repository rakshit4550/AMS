// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchUsers, createUser, updateUser, deleteUser, logout, loadUser, clearError } from '../redux/authSlice';
// import 'tailwindcss/tailwind.css';
// import { FaEdit, FaTrash } from 'react-icons/fa';
// import { useNavigate } from 'react-router-dom';

// const User = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { users, currentUser, role, loading, error } = useSelector((state) => state.user);
//   const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
//   const [editId, setEditId] = useState(null);

//   useEffect(() => {
//     dispatch(loadUser());
//   }, [dispatch]);

//   useEffect(() => {
//     if (currentUser) {
//       if (role === 'admin') {
//         dispatch(fetchUsers());
//       } else {
//         dispatch(fetchUsers(currentUser.id));
//       }
//     } else if (error && (error === 'No token found' || error.includes('Invalid token'))) {
//       navigate('/login');
//     }
//   }, [dispatch, role, currentUser, error, navigate]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     dispatch(clearError());
//     if (!formData.username || !formData.email) {
//       alert('Username and email are required');
//       return;
//     }
//     if (editId) {
//       const updateData = { 
//         id: editId, 
//         username: formData.username, 
//         email: formData.email, 
//         role: formData.role,
//         ...(formData.password && { password: formData.password }) 
//       };
      
//       dispatch(updateUser(updateData)).then((result) => {
//         if (result.meta.requestStatus === 'fulfilled') {
//           setFormData({ username: '', email: '', password: '', role: 'user' });
//           setEditId(null);
//           if (editId === currentUser?.id) {
//             if (result.payload.token) {
//               localStorage.setItem('token', result.payload.token);
//             }
//             dispatch(logout());
//             alert('Your account details have been updated. Please log in again.');
//             navigate('/login');
//           }
//         }
//       });
//     } else {
//       if (!formData.password) {
//         alert('Password is required for new users');
//         return;
//       }
//       dispatch(createUser(formData)).then((result) => {
//         if (result.meta.requestStatus === 'fulfilled') {
//           setFormData({ username: '', email: '', password: '', role: 'user' });
//         }
//       });
//     }
//   };

//   const handleEdit = (user) => {
//     setFormData({ 
//       username: user.username, 
//       email: user.email, 
//       password: '', 
//       role: user.role 
//     });
//     setEditId(user._id);
//   };

//   const handleDelete = (id) => {
//     if (window.confirm('Are you sure you want to delete this user?')) {
//       dispatch(deleteUser(id));
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
//       <div className="bg-white shadow-xl rounded-lg p-6">
//         {currentUser ? (
//           <div>
//             <button
//               onClick={() => {
//                 dispatch(logout());
//                 navigate('/login');
//               }}
//               className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-6"
//             >
//               Logout
//             </button>

//             {role === 'admin' && (
//               <form onSubmit={handleSubmit} className="mb-6 space-y-4">
//                 <div>
//                   <label className="block mb-1">Username</label>
//                   <input
//                     type="text"
//                     name="username"
//                     value={formData.username}
//                     onChange={handleInputChange}
//                     placeholder="Enter username"
//                     className="border p-2 rounded w-full"
//                   />
//                 </div>
//                 <div>
//                   <label className="block mb-1">Email</label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     placeholder="Enter email"
//                     className="border p-2 rounded w-full"
//                   />
//                 </div>
//                 <div>
//                   <label className="block mb-1">Password {editId ? '(Leave blank to keep unchanged)' : ''}</label>
//                   <input
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleInputChange}
//                     placeholder={editId ? 'Enter new password (optional)' : 'Enter password'}
//                     className="border p-2 rounded w-full"
//                   />
//                 </div>
//                 <div>
//                   <label className="block mb-1">Role</label>
//                   <select
//                     name="role"
//                     value={formData.role}
//                     onChange={handleInputChange}
//                     className="border p-2 rounded w-full"
//                   >
//                     <option value="user">User</option>
//                     <option value="admin">Admin</option>
//                   </select>
//                 </div>
//                 <button
//                   type="submit"
//                   className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                 >
//                   {editId ? 'Update User' : 'Add User'}
//                 </button>
//               </form>
//             )}

//             {loading && <p>Loading...</p>}
//             {error && (
//               <div className="text-red-500 mb-4">
//                 {error}
//                 <button
//                   onClick={() => dispatch(clearError())}
//                   className="ml-2 text-blue-500 hover:underline"
//                 >
//                   Clear Error
//                 </button>
//               </div>
//             )}

//             <h2 className="text-xl font-semibold mb-2">User List</h2>
//             <ul className="space-y-2">
//               {users.map((user) => (
//                 <li key={user._id} className="flex justify-between items-center border p-2 rounded">
//                   <div>
//                     <p>Username: {user.username}</p>
//                     <p>Email: {user.email}</p>
//                     <p>Role: {user.role}</p>
//                   </div>
//                   {(role === 'admin' || user._id === currentUser?.id) && (
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => handleEdit(user)}
//                         className="text-yellow-500 hover:text-yellow-600"
//                         title="Edit User"
//                       >
//                         <FaEdit size={20} />
//                       </button>
//                       {role === 'admin' && (
//                         <button
//                           onClick={() => handleDelete(user._id)}
//                           className="text-red-500 hover:text-red-600"
//                           title="Delete User"
//                         >
//                           <FaTrash size={20} />
//                         </button>
//                       )}
//                     </div>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ) : (
//           <p>Redirecting to login...</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default User;


import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser, logout, loadUser, clearError } from '../redux/authSlice';
import 'tailwindcss/tailwind.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const User = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, currentUser, role, loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (currentUser) {
      if (role === 'admin') {
        dispatch(fetchUsers());
      } else {
        dispatch(fetchUsers(currentUser.id));
      }
    } else if (error && (error === 'No token found' || error.includes('Invalid token'))) {
      navigate('/login');
    }
  }, [dispatch, role, currentUser, error, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'user' });
    setEditId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());

    if (!formData.username || !formData.email) {
      alert('Username and email are required');
      return;
    }

    if (editId) {
      const updateData = {
        id: editId,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        ...(formData.password && { password: formData.password })
      };

      dispatch(updateUser(updateData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          resetForm();

          if (editId === currentUser?.id && result.payload?.token) {
            localStorage.setItem('token', result.payload.token);
          }

          if (editId === currentUser?.id) {
            dispatch(logout());
            alert('Your account details have been updated. Please log in again.');
            navigate('/login');
          }
        }
      });
    } else {
      if (!formData.password) {
        alert('Password is required for new users');
        return;
      }

      dispatch(createUser(formData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          resetForm();
        }
      });
    }
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setEditId(user._id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(id));
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-xl rounded-lg p-6">
        {currentUser ? (
          <div>
            <button
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
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
                  <label className="block mb-1">
                    Password {editId ? '(Leave blank to keep unchanged)' : ''}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editId ? 'Enter new password (optional)' : 'Enter password'}
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
                    <option value="trader">Trader</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {editId ? 'Update User' : 'Add User'}
                  </button>

                  {editId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {loading && <p>Loading...</p>}

            {error && (
              <div className="text-red-500 mb-4">
                {error}
                <button
                  onClick={() => dispatch(clearError())}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  Clear Error
                </button>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-2">User List</h2>

            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user._id} className="flex justify-between items-center border p-2 rounded">
                  <div>
                    <p>Username: {user.username}</p>
                    <p>Email: {user.email}</p>
                    <p>Role: {user.role}</p>
                  </div>

                  {(role === 'admin' || user._id === currentUser?.id) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-yellow-500 hover:text-yellow-600"
                        title="Edit User"
                      >
                        <FaEdit size={20} />
                      </button>

                      {role === 'admin' && (
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete User"
                        >
                          <FaTrash size={20} />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Redirecting to login...</p>
        )}
      </div>
    </div>
  );
};

export default User;