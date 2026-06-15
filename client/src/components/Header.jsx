// import React, { useState, useEffect, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { FiCalendar, FiClock } from "react-icons/fi";

// import Sidebar from "./Sidebar";
// import { logout } from "../redux/authSlice";

// const IST = "Asia/Kolkata";

// const Header = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [openNav, setOpenNav] = useState(false);
//   const [now, setNow] = useState(() => new Date());
//   const sidebarRef = useRef(null);
//   const headerRef = useRef(null);
//   const expiryLogoutDoneRef = useRef(false);
//   const { currentUser, role } = useSelector((state) => state.user);

//   const validityLabel = useMemo(() => {
//     if (!currentUser || role === "admin") return null;
//     if (!currentUser.subscriptionExpiresAt) return "Validity active";

//     const expiry = new Date(currentUser.subscriptionExpiresAt);
//     if (Number.isNaN(expiry.getTime())) return "Validity active";

//     const dateLabel = expiry.toLocaleString("en-IN", {
//       timeZone: IST,
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });

//     const diff = expiry.getTime() - now.getTime();

//     if (diff <= 0 || currentUser.subscriptionStatus === "expired") {
//       return `Expired on ${dateLabel}`;
//     }

//     const totalSeconds = Math.floor(diff / 1000);
//     const days = Math.floor(totalSeconds / (24 * 60 * 60));
//     const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
//     const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
//     const seconds = totalSeconds % 60;

//     const pad = (value) => String(value).padStart(2, "0");

//     return `Valid till ${dateLabel} · ${days}d ${pad(hours)}h ${pad(
//       minutes
//     )}m ${pad(seconds)}s left`;
//   }, [currentUser, role, now]);

//   const { dateLabel, dateLabelShort, timeLabel } = useMemo(() => {
//     const dateLabel = new Intl.DateTimeFormat("en-IN", {
//       timeZone: IST,
//       weekday: "short",
//       day: "numeric",
//       month: "short",
//       year: "numeric",
//     }).format(now);

//     const dateLabelShort = new Intl.DateTimeFormat("en-IN", {
//       timeZone: IST,
//       day: "numeric",
//       month: "short",
//       year: "2-digit",
//     }).format(now);

//     const timeLabel = new Intl.DateTimeFormat("en-IN", {
//       timeZone: IST,
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: true,
//     }).format(now);

//     return { dateLabel, dateLabelShort, timeLabel };
//   }, [now]);

//   useEffect(() => {
//     const id = window.setInterval(() => setNow(new Date()), 1000);
//     return () => window.clearInterval(id);
//   }, []);

//   useEffect(() => {
//     if (!currentUser || role === "admin" || !currentUser.subscriptionExpiresAt) {
//       expiryLogoutDoneRef.current = false;
//       return;
//     }

//     const expiry = new Date(currentUser.subscriptionExpiresAt);
//     if (Number.isNaN(expiry.getTime())) return;

//     if (expiry.getTime() <= now.getTime() && !expiryLogoutDoneRef.current) {
//       expiryLogoutDoneRef.current = true;
//       dispatch(logout());
//       navigate("/login", {
//         replace: true,
//         state: { accountExpiredMessage: "Please recharge your account" },
//       });
//     }
//   }, [currentUser, role, now, dispatch, navigate]);

//   const handleMenuClick = () => {
//     setOpenNav(false);
//   };

//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth >= 960) setOpenNav(false);
//     };

//     const handleClickOutside = (event) => {
//       if (
//         openNav &&
//         sidebarRef.current &&
//         headerRef.current &&
//         !sidebarRef.current.contains(event.target) &&
//         !headerRef.current.contains(event.target)
//       ) {
//         setOpenNav(false);
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [openNav]);

//   return (
//     <div
//       ref={headerRef}
//       className="fixed left-0 right-0 top-0 z-[100] border-b border-indigo-200/30 bg-gradient-to-r from-[#eef2ff] via-white to-[#f5f3ff] shadow-[0_4px_24px_-8px_rgba(37,40,88,0.12)] lg:left-60 lg:right-0"
//     >
//       <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#424687] via-indigo-500 to-[#252858]" />
//       <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 px-3 py-2 sm:px-6 lg:px-8">
//         <button
//           className="shrink-0 rounded-lg p-1.5 text-slate-700 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#424687]/30 lg:hidden"
//           type="button"
//           onClick={() => setOpenNav(!openNav)}
//           aria-label={openNav ? "Close menu" : "Open menu"}
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
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           ) : (
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-6 w-6"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M4 6h16M4 12h16M4 18h16"
//               />
//             </svg>
//           )}
//         </button>

//         <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
//           {validityLabel && (
//             <span
//               className={`inline-flex max-w-full truncate rounded-full border px-4 py-2 text-sm font-bold shadow-md sm:px-5 sm:py-2.5 sm:text-base ${
//                 validityLabel.startsWith("Expired")
//                   ? "border-red-300 bg-red-50 text-red-700"
//                   : "border-green-300 bg-green-50 text-green-700"
//               }`}
//             >
//               {validityLabel}
//             </span>
//           )}
//           <div className="flex max-w-full min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 rounded-2xl border border-[#424687]/12 bg-white/70 px-2.5 py-1.5 text-[11px] shadow-sm backdrop-blur-sm sm:gap-x-3 sm:px-3 sm:py-1.5 sm:text-sm">
//             <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-700">
//               <FiCalendar
//                 className="h-3.5 w-3.5 shrink-0 text-[#424687] sm:h-4 sm:w-4"
//                 aria-hidden
//               />
//               <span className="truncate sm:hidden">{dateLabelShort}</span>
//               <span className="hidden truncate sm:inline">{dateLabel}</span>
//             </span>
//             <span
//               className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block"
//               aria-hidden
//             />
//             <span className="inline-flex items-center gap-1.5 tabular-nums">
//               <FiClock
//                 className="h-3.5 w-3.5 shrink-0 text-[#424687] sm:h-4 sm:w-4"
//                 aria-hidden
//               />
//               <span className="font-semibold text-[#252858]">{timeLabel}</span>
//               <span className="rounded-md bg-[#424687]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#424687]">
//                 IST
//               </span>
//             </span>
//           </div>
//         </div>
//       </div>
//       <div
//         ref={sidebarRef}
//         className={`${openNav ? "block" : "hidden"} lg:hidden`}
//       >
//         <Sidebar onMenuClick={handleMenuClick} />
//       </div>
//     </div>
//   );
// };

// export default Header;



import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock } from "react-icons/fi";

import Sidebar from "./Sidebar";
import { logout } from "../redux/authSlice";

const IST = "Asia/Kolkata";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openNav, setOpenNav] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const expiryLogoutDoneRef = useRef(false);
  const { currentUser, role } = useSelector((state) => state.user);

  const validityLabel = useMemo(() => {
    if (!currentUser || role === "admin") return null;
    if (!currentUser.subscriptionExpiresAt) return "Validity active";

    const expiry = new Date(currentUser.subscriptionExpiresAt);
    if (Number.isNaN(expiry.getTime())) return "Validity active";

    const dateLabel = expiry.toLocaleString("en-IN", {
      timeZone: IST,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0 || currentUser.subscriptionStatus === "expired") {
      return `Expired on ${dateLabel}`;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    const pad = (value) => String(value).padStart(2, "0");

    return `Valid till ${dateLabel} · ${days}d ${pad(hours)}h ${pad(
      minutes
    )}m ${pad(seconds)}s left`;
  }, [currentUser, role, now]);

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

  useEffect(() => {
    if (!currentUser || role === "admin" || !currentUser.subscriptionExpiresAt) {
      expiryLogoutDoneRef.current = false;
      return;
    }

    const expiry = new Date(currentUser.subscriptionExpiresAt);
    if (Number.isNaN(expiry.getTime())) return;

    if (expiry.getTime() <= now.getTime() && !expiryLogoutDoneRef.current) {
      expiryLogoutDoneRef.current = true;
      dispatch(logout());
      navigate("/login", {
        replace: true,
        state: { accountExpiredMessage: "Please recharge your account" },
      });
    }
  }, [currentUser, role, now, dispatch, navigate]);

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

  useEffect(() => {
    if (!openNav) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openNav]);

  return (
    <div
      ref={headerRef}
      className="app-header fixed left-0 right-0 top-0 z-[100] border-b border-indigo-200/30 bg-gradient-to-r from-[#eef2ff]/95 via-white/95 to-[#f5f3ff]/95 shadow-[0_4px_24px_-8px_rgba(37,40,88,0.12)] backdrop-blur-xl lg:left-60 lg:right-0"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#424687] via-indigo-500 to-[#252858]" />
      <div className="mx-auto flex min-h-[104px] w-full max-w-[1920px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:h-[72px] sm:min-h-[72px] sm:flex-nowrap sm:px-6 sm:py-0 lg:px-8">
        <button
          className="order-1 shrink-0 rounded-2xl border border-white/70 bg-white/70 p-2 text-slate-700 shadow-sm transition active:scale-95 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#424687]/30 lg:hidden"
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

        <div className="order-2 ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:order-none sm:flex-1 sm:gap-2">
          <div className="flex min-w-0 items-center gap-x-2 rounded-2xl border border-[#424687]/12 bg-white/80 px-2 py-1.5 text-[10px] shadow-sm backdrop-blur-sm sm:max-w-full sm:gap-x-3 sm:px-3 sm:text-sm">
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
              <span className="font-semibold text-[#252858]">{timeLabel}</span>
              <span className="rounded-md bg-[#424687]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#424687]">
                IST
              </span>
            </span>
          </div>
        </div>

        {validityLabel && (
          <span
            className={`order-3 inline-flex w-full items-center justify-center rounded-full border px-3 py-1.5 text-center text-[11px] font-bold leading-snug shadow-md sm:order-none sm:w-auto sm:max-w-full sm:whitespace-nowrap sm:px-5 sm:py-2.5 sm:text-base ${
              validityLabel.startsWith("Expired")
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-green-300 bg-green-50 text-green-700"
            }`}
          >
            {validityLabel}
          </span>
        )}
      </div>
      {openNav && (
        <div
          className="fixed inset-0 top-[104px] z-[110] sm:top-[72px] lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setOpenNav(false)}
            aria-label="Close menu overlay"
          />
          <div
            ref={sidebarRef}
            className="mobile-drawer absolute left-0 top-0 h-[calc(100dvh-104px)] w-[82vw] max-w-[19rem] overflow-hidden rounded-r-[2rem] bg-white shadow-2xl sm:h-[calc(100dvh-72px)]"
          >
            <Sidebar onMenuClick={handleMenuClick} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
