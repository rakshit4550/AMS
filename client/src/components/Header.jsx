import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import ProfileMenu from './ProfileMenu';
import Sidebar from './Sidebar';

const Header = () => {

  const [openNav, setOpenNav] = useState(false);


  const handleMenuClick = () => {
    setOpenNav(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 960) setOpenNav(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white px-4 py-2 lg:xml-[257px] shadow-md">
      <div className="mx-2 flex items-center justify-between lg:justify-end">
        <button
          className="h-6 w-6 text-black hover:bg-gray-100 focus:outline-none lg:hidden"
          onClick={() => setOpenNav(!openNav)}
        >
          {openNav ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="text-sm mr-2">
              
              <span className="text-xs">USER</span>
            </div>
            <ProfileMenu />
          </div>
        </div>
      </div>
      <div className={`${openNav ? 'block' : 'hidden'} lg:hidden`}>
        <Sidebar onMenuClick={handleMenuClick} open={openNav} />
      </div>
    </div>
  );
};

export default Header;