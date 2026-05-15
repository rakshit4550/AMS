// import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';

// import ProfileMenu from './ProfileMenu';
// import Sidebar from './Sidebar';

// const Header = () => {

//   const [openNav, setOpenNav] = useState(false);

//   const handleMenuClick = () => {
//     setOpenNav(false);
//   };

//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 960) setOpenNav(false);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   return (
//     <div className="fixed top-0 left-0 right-0 z-50 bg-white px-4 py-2 lg:xml-[257px] shadow-md">
//       <div className="mx-2 flex items-center justify-between lg:justify-end">
//         <button
//           className="h-6 w-6 text-black hover:bg-gray-100 focus:outline-none lg:hidden"
//           onClick={() => setOpenNav(!openNav)}
//         >
//           {openNav ? (
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               className="h-6 w-6"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           ) : (
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-6 w-6"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           )}
//         </button>
//         <div className="flex items-center space-x-4">
//           <div className="flex items-center">
//             <div className="text-sm mr-2">

//               <span className="text-xs">USER</span>
//             </div>
//             <ProfileMenu />
//           </div>
//         </div>
//       </div>
//       <div className={`${openNav ? 'block' : 'hidden'} lg:hidden`}>
//         <Sidebar onMenuClick={handleMenuClick} open={openNav} />
//       </div>
//     </div>
//   );
// };

// export default Header;

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { FiCalendar, FiClock } from "react-icons/fi";

import ProfileMenu from "./ProfileMenu";
import Sidebar from "./Sidebar";

const IST = "Asia/Kolkata";

const Header = () => {
  const [openNav, setOpenNav] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);

  const { currentUser } = useSelector((state) => state.user || {});

  const { dateLabel, dateLabelShort, timeLabel } = useMemo(() => {
    const dateLabel = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(now);

    const dateLabelShort = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST,
      day: "numeric",
      month: "short",
      year: "2-digit",
    }).format(now);

    const timeLabel = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(now);

    return { dateLabel, dateLabelShort, timeLabel };
  }, [now]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleMenuClick = () => {
    setOpenNav(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 960) setOpenNav(false);
    };

    const handleClickOutside = (event) => {
      if (
        openNav &&
        sidebarRef.current &&
        headerRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !headerRef.current.contains(event.target)
      ) {
        setOpenNav(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openNav]);

  return (
    <div
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-[100] border-b border-indigo-200/30 bg-gradient-to-r from-[#eef2ff] via-white to-[#f5f3ff] shadow-[0_4px_24px_-8px_rgba(37,40,88,0.12)] lg:left-60 lg:right-0"
      >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#424687] via-indigo-500 to-[#252858]" />
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 px-3 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            className="shrink-0 rounded-lg p-1.5 text-slate-700 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#424687]/30 lg:hidden"
            type="button"
            onClick={() => setOpenNav(!openNav)}
            aria-label={openNav ? "Close menu" : "Open menu"}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center sm:justify-start lg:pl-1">
            <div className="flex max-w-full min-w-0 flex-col gap-0.5 rounded-2xl border border-[#424687]/12 bg-white/70 px-2.5 py-1.5 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3 sm:px-3 sm:py-1.5 sm:pr-4">
              {currentUser?.username ? (
                <p className="hidden truncate text-left text-xs font-semibold text-slate-600 sm:block sm:max-w-[10rem] lg:max-w-xs">
                  Hi,{" "}
                  <span className="text-[#424687]">{currentUser.username}</span>
                </p>
              ) : null}
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] sm:gap-x-3 sm:text-sm">
                <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-700">
                  <FiCalendar
                    className="h-3.5 w-3.5 shrink-0 text-[#424687] sm:h-4 sm:w-4"
                    aria-hidden
                  />
                  <span className="truncate sm:hidden">{dateLabelShort}</span>
                  <span className="hidden truncate sm:inline">{dateLabel}</span>
                </span>
                <span
                  className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block"
                  aria-hidden
                />
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <FiClock
                    className="h-3.5 w-3.5 shrink-0 text-[#424687] sm:h-4 sm:w-4"
                    aria-hidden
                  />
                  <span className="font-semibold text-[#252858]">
                    {timeLabel}
                  </span>
                  <span className="rounded-md bg-[#424687]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#424687]">
                    IST
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <ProfileMenu />
        </div>
      </div>
      <div
        ref={sidebarRef}
        className={`${openNav ? "block" : "hidden"} lg:hidden`}
      >
        <Sidebar onMenuClick={handleMenuClick} open={openNav} />
      </div>
    </div>
  );
};

export default Header;
