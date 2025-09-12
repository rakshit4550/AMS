import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice'; // Ensure correct path

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);
  const isAuthenticated = !!token; // Derive isAuthenticated from token

  console.log('Sidebar: isAuthenticated=', isAuthenticated, 'token=', token);

  const handleLogout = () => {
    console.log('Logging out...');
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-white text-black flex flex-col shadow-lg">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        Accounting App
      </div>
      {isAuthenticated ? (
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/parties"
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-gray-200 transition-colors ${
                    isActive ? 'bg-gray-200' : ''
                  }`
                }
              >
                Parties
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-gray-200 transition-colors ${
                    isActive ? 'bg-gray-200' : ''
                  }`
                }
              >
                Account
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user"
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-gray-200 transition-colors ${
                    isActive ? 'bg-gray-200' : ''
                  }`
                }
              >
                Users
              </NavLink>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left p-2 rounded hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      ) : (
        <div className="p-4 text-gray-500">Please log in to see the menu.</div>
      )}
    </div>
  );
};

export default Sidebar;