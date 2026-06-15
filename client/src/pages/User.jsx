import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser, logout, loadUser, clearError } from '../redux/authSlice';
import 'tailwindcss/tailwind.css';
import { FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';


const limitedRoles = ['user', 'trader'];

const pad2 = (value) => String(value).padStart(2, '0');

const toDateTimeInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const addMonthsToDateTimeInput = (months = 1) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return toDateTimeInputValue(date);
};

const nowDateTimeInput = () => toDateTimeInputValue(new Date());

const dateTimeInputToIso = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

const User = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, currentUser, role, loading, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user', subscriptionExpiresAt: addMonthsToDateTimeInput(1) });
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
    setFormData({ username: '', email: '', password: '', role: 'user', subscriptionExpiresAt: addMonthsToDateTimeInput(1) });
    setEditId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());

    if (!formData.username || !formData.email) {
      alert('Username and email are required');
      return;
    }

    if (limitedRoles.includes(formData.role) && !formData.subscriptionExpiresAt) {
      alert('Please select account validity expiry date');
      return;
    }

    if (editId) {
      const editingUserId = editId;
      const updateData = {
        id: editingUserId,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        subscriptionExpiresAt: limitedRoles.includes(formData.role) ? dateTimeInputToIso(formData.subscriptionExpiresAt) : '',
        ...(formData.password && { password: formData.password })
      };

      dispatch(updateUser(updateData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          resetForm();

          if (editingUserId === currentUser?.id && result.payload?.token) {
            localStorage.setItem('token', result.payload.token);
          }

          if (editingUserId === currentUser?.id) {
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

      const createPayload = {
        ...formData,
        subscriptionExpiresAt: limitedRoles.includes(formData.role)
          ? dateTimeInputToIso(formData.subscriptionExpiresAt)
          : '',
      };

      dispatch(createUser(createPayload)).then((result) => {
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
      role: user.role,
      subscriptionExpiresAt: toDateTimeInputValue(user.subscriptionExpiresAt)
    });
    setEditId(user._id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(id));
    }
  };

  const fieldClass =
    "h-8 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 text-xs transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#424687]/40 sm:text-sm";

  const roleBadgeClass = (r) => {
    if (r === 'admin') return 'bg-violet-100 text-violet-800 ring-1 ring-violet-200/80';
    if (r === 'trader') return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80';
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80';
  };

  const formatValidity = (user) => {
    if (user.role === 'admin') return 'No limit';
    if (!user.subscriptionExpiresAt) return 'Active';

    const expiry = new Date(user.subscriptionExpiresAt);
    if (Number.isNaN(expiry.getTime())) return 'Active';

    const dateLabel = expiry.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (user.subscriptionStatus === 'expired') {
      return `Expired on ${dateLabel}`;
    }

    const days = user.subscriptionRemainingDays;
    return days === null || days === undefined
      ? `Valid till ${dateLabel}`
      : `Valid till ${dateLabel} (${days} days left)`;
  };

  const validityClass = (user) => {
    if (user.role === 'admin') return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80';
    if (user.subscriptionStatus === 'expired') return 'bg-red-100 text-red-800 ring-1 ring-red-200/80';
    return 'bg-green-100 text-green-800 ring-1 ring-green-200/80';
  };

  return (
    <div className="z-[99] min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/90 py-2 sm:py-3">
      <div className="mx-auto flex w-full max-w-none flex-col gap-2">
        {currentUser ? (
          <>
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
              <div className="flex min-w-0 items-start gap-2">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#424687]/10 text-[#424687]">
                  <FaUser size={18} />
                </span>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-800 sm:text-lg">
                    User management
                  </h1>
                  <p className="truncate text-xs text-slate-500 sm:text-sm">
                    Signed in as{' '}
                    <span className="font-medium text-slate-700">
                      {currentUser?.username ?? currentUser?.email ?? '—'}
                    </span>
                    <span className="text-slate-400"> · </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(role)}`}>
                      {role}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  dispatch(logout());
                  navigate('/login');
                }}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>

            {role === 'admin' && (
              <div className="w-full rounded-xl border border-slate-200/90 bg-white/95 px-2.5 py-2.5 shadow-sm backdrop-blur-sm sm:px-4 sm:py-3">
                <h2 className="text-sm font-bold text-slate-800 sm:text-base">
                  Add or edit user
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Password optional when updating; required for new users.
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3"
                >
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <div className="min-w-0">
                      <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Username"
                        className={fieldClass}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <div className="min-w-0">
                      <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                        Password{' '}
                        {editId ? (
                          <span className="font-normal text-slate-400">
                            (optional)
                          </span>
                        ) : null}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={
                          editId
                            ? 'New password (optional)'
                            : 'Password'
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                        Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className={fieldClass}
                      >
                        <option value="user">User</option>
                        <option value="trader">Trader</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <div className="min-w-0">
                      <label className="mb-0.5 block text-[11px] font-medium text-slate-600 sm:text-xs">
                        Account validity
                      </label>
                      <input
                        type="datetime-local"
                        name="subscriptionExpiresAt"
                        value={formData.subscriptionExpiresAt}
                        onChange={handleInputChange}
                        min={nowDateTimeInput()}
                        disabled={formData.role === 'admin'}
                        className={`${fieldClass} ${formData.role === 'admin' ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        User/Trader login selected exact date-time tak chalega. Testing ke liye aaj ka time bhi select kar sakte ho. Admin has no limit.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center justify-center rounded-md bg-[#424687] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#353a6e] sm:text-sm"
                    >
                      {editId ? 'Update user' : 'Add user'}
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="flex min-h-[min(65vh,calc(100vh-12rem))] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md">
              {loading && (
                <p className="border-b border-slate-100 bg-slate-50 py-2 text-center text-sm text-[#424687]">
                  Loading…
                </p>
              )}
              {error && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <span className="min-w-0 flex-1">{error}</span>
                  <button
                    type="button"
                    onClick={() => dispatch(clearError())}
                    className="shrink-0 rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#424687] shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 shadow-sm">
                    <tr className="bg-[#424687] text-white">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Username
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Email
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Role
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Validity
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          No users loaded.
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <tr
                          key={user._id}
                          className={`border-b border-slate-100/80 transition-colors hover:bg-indigo-50/40 ${index % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}
                        >
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            {user.username}
                          </td>
                          <td className="max-w-[14rem] truncate px-3 py-2.5 text-slate-600 sm:max-w-none sm:whitespace-normal">
                            {user.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${roleBadgeClass(user.role)}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${validityClass(user)}`}
                            >
                              {formatValidity(user)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            {(role === 'admin' || user._id === currentUser?.id) && (
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(user)}
                                  className="rounded-md p-1.5 text-[#424687] transition hover:bg-[#424687]/10 hover:text-[#353a6e]"
                                  title="Edit User"
                                >
                                  <FaEdit size={16} />
                                </button>
                                {role === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(user._id)}
                                    className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800"
                                    title="Delete User"
                                  >
                                    <FaTrash size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-slate-200/90 bg-white/95 px-4 py-12 text-center text-sm text-slate-600 shadow-sm">
            Redirecting to login…
          </div>
        )}
      </div>
    </div>
  );
};

export default User;