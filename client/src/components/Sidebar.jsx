import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AiFillBank, AiFillDashboard } from 'react-icons/ai';
import { GrTransaction } from 'react-icons/gr';
import { FaUser } from 'react-icons/fa';
import { FaMoneyBillTransfer } from 'react-icons/fa6';
import { MdSettingsSuggest, MdPlaylistAddCircle } from 'react-icons/md';
import { TbReportAnalytics } from 'react-icons/tb';
import { FaDollarSign } from 'react-icons/fa';
import { GiBank } from 'react-icons/gi';
import { FaPiggyBank } from 'react-icons/fa6';

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'AiOutlineDashboard':
      return <AiFillDashboard className="h-4 w-4" />;
    case 'AiOutlineCreditCard':
      return <GrTransaction className="h-4 w-4" />;
    case 'AiOutlineWallet':
      return <AiFillBank className="h-4 w-4" />;
    case 'AiOutlineFileText':
      return <FaUser className="h-4 w-4" />;
    case 'AiOutlineTransaction':
      return <FaMoneyBillTransfer className="h-4 w-4" />;
    case 'AiOutlineFileAdd':
      return <MdSettingsSuggest className="h-4 w-4" />;

    case 'AiOutlineTicket':
      return <MdPlaylistAddCircle className="h-4 w-4" />;
    case 'TbReportAnalytics':
      return <TbReportAnalytics className="h-4 w-4" />;
    case 'GiBank':
      return <GiBank className="h-4 w-4" />;
    case 'FaDollarSign':
      return <FaDollarSign className="h-4 w-4" />;
    case 'FaPiggyBank':
      return <FaPiggyBank className="h-4 w-4" />;
    default:
      return null;
  }
};

const MENU = [
  {
    title: 'Dashboard',
    route: '/dashboard',
    icon: 'AiOutlineDashboard',
    roles: ['User', 'Admin'],
    submenu: [],
  },
  {
    title: 'Parties',
    route: '/parties',
    icon: 'AiOutlineWallet',
    roles: ['User', 'Admin'],
    submenu: [],
  },
  {
    title: 'Account',
    route: '/account',
    icon: 'AiOutlineCreditCard',
    roles: ['User', 'Admin'],
    submenu: [],
  },
      {
    title: 'report',
    route: '/Report',
    icon: 'AiOutlineFileText',
    roles: ['Admin'],
    submenu: [],
  },
  {
    title: 'Users',
    route: '/user',
    icon: 'AiOutlineFileText',
    roles: ['Admin'],
    submenu: [],
  },


];

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const handleToggle = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white text-black shadow-lg">
      <div className="p-4 text-2xl font-bold border-b border-gray-200 text-center">
        Accounting App
      </div>
      <ul className="text-sm p-2">
        {MENU.map((menuItem, index) => (
          <li key={index}>
            <div
              className={`flex items-center p-3 rounded-md transition-transform duration-300 hover:scale-[0.95] ${
                window.location.pathname === menuItem.route
                  ? 'text-[#424687] border-r-4 border-[#424687]'
                  : ''
              }`}
            >
              <NavLink
                to={menuItem.route}
                className={({ isActive }) =>
                  `flex items-center w-full rounded p-2  hover:bg-gray-200 ${isActive ? 'font-bold text-[#424687]  bg-gray-200' : ''}`
                }
              >
                <span className="mr-3">{menuItem.icon && getIconComponent(menuItem.icon)}</span>
                <span>{menuItem.title}</span>
              </NavLink>
              {menuItem.submenu?.length > 0 && (
                <button
                  onClick={() => handleToggle(index)}
                  className="ml-auto focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className={`h-4 w-4 transition-transform ${
                      openMenu === index ? 'rotate-180' : ''
                    }`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
            </div>
            {menuItem.submenu?.length > 0 && (
              <ul
                className={`pl-6 transition-all duration-300 ease-in-out ${
                  openMenu === index ? 'block' : 'hidden'
                }`}
              >
                {menuItem.submenu.map((subMenuItem, subIndex) => (
                  <li key={subIndex} className="py-1">
                    <NavLink
                      to={subMenuItem.route}
                      className={({ isActive }) =>
                        `flex items-center text-[#424687] hover:text-[#424687] ${
                          isActive ? 'font-bold ' : ''
                        }`
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-3 w-5 mr-2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {subMenuItem.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;