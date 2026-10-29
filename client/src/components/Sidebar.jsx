import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { AiFillBank, AiFillDashboard } from "react-icons/ai";
import { GrTransaction } from "react-icons/gr";
import { FaHandshake, FaUser } from "react-icons/fa";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { TbReportAnalytics } from "react-icons/tb";
import { FaDollarSign } from "react-icons/fa";
import { GiBank } from "react-icons/gi";
import { FaPiggyBank } from "react-icons/fa6";
import { BsReceiptCutoff } from "react-icons/bs";
import { MdEvent, MdPlaylistAddCircle, MdSettingsSuggest } from "react-icons/md";

const getIconComponent = (iconName, className = "h-4 w-4") => {
  const cn = className;
  switch (iconName) {
    case "AiOutlineDashboard":
      return <AiFillDashboard className={cn} />;
    case "AiOutlineCreditCard":
      return <GrTransaction className={cn} />;
    case "AiOutlineWallet":
      return <AiFillBank className={cn} />;
    case "AiOutlineFileText":
      return <FaUser className={cn} />;
    case "AiOutlineTransaction":
      return <FaMoneyBillTransfer className={cn} />;
    case "AiOutlineFileAdd":
      return <MdSettingsSuggest className={cn} />;
    case "AiOutlineTicket":
      return <MdPlaylistAddCircle className={cn} />;
    case "TbReportAnalytics":
      return <TbReportAnalytics className={cn} />;
    case "GiBank":
      return <GiBank className={cn} />;
    case "FaDollarSign":
      return <FaDollarSign className={cn} />;
    case "FaPiggyBank":
      return <FaPiggyBank className={cn} />;
    case "BsReceiptCutoff":
      return <BsReceiptCutoff className={cn} />;
    case "FaHandshake":
      return <FaHandshake className={cn} />;
    case "MdEvent":
      return <MdEvent className={cn} />;
    default:
      return null;
  }
};

const Sidebar = ({ expanded = true, pinned = false, onToggle, onMenuClick }) => {
  const { role } = useSelector((state) => state.user);

  const getRoleFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "";
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.role || "";
    } catch {
      return "";
    }
  };

  const userRole = role || getRoleFromToken();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "AiOutlineDashboard" },
    { to: "/parties", label: "Parties", icon: "AiOutlineWallet" },
    { to: "/interest", label: "Interest", icon: "FaPiggyBank" },
    { to: "/settlement", label: "Settlement", icon: "FaHandshake" },
    { to: "/events", label: "Book", icon: "MdEvent" },
    { to: "/account", label: "Account", icon: "AiOutlineCreditCard" },
    ...(userRole === "trader"
      ? [{ to: "/utr", label: "UTR", icon: "BsReceiptCutoff" }]
      : []),
    { to: "/report", label: "Report", icon: "TbReportAnalytics" },
    ...(role === "admin"
      ? [{ to: "/user", label: "Users", icon: "AiOutlineFileText" }]
      : []),
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100/95 shadow-[4px_0_24px_-8px_rgba(66,70,135,0.18)]">
      <div
        className={`relative shrink-0 bg-gradient-to-br from-[#424687] to-[#353a6e] text-white ${
          expanded ? "px-4 py-5" : "flex flex-col items-center px-2 py-4"
        }`}
      >
        {expanded ? (
          <div className="pr-8">
            <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
              myacbook
            </p>
            <h1 className="whitespace-nowrap text-lg font-bold leading-tight tracking-tight">
              Accounting
            </h1>
            <p className="mt-1 whitespace-nowrap text-xs text-white/75">Ledger &amp; reports</p>
          </div>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
            M
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={pinned ? "Collapse menu" : "Keep menu open"}
          aria-label={pinned ? "Collapse menu" : "Keep menu open"}
          className={`inline-flex !h-7 !w-7 !min-h-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 ${
            expanded ? "absolute right-3 top-4" : "mt-3"
          }`}
        >
          {pinned ? <IoChevronBack size={16} /> : <IoChevronForward size={16} />}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${expanded ? "p-3" : "px-2 py-3"}`}>
        <p
          className={`mb-2 overflow-hidden px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition-all duration-300 ${
            expanded ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                title={expanded ? undefined : label}
                onClick={() => onMenuClick?.()}
                className={({ isActive }) =>
                  [
                    "group flex items-center rounded-xl text-sm font-medium transition-all duration-300",
                    expanded ? "gap-3 px-2.5 py-2" : "justify-center px-0 py-1.5",
                    isActive
                      ? "bg-[#424687]/12 text-[#424687] shadow-sm ring-1 ring-[#424687]/20"
                      : "text-slate-700 hover:bg-white/80 hover:text-slate-900 hover:shadow-sm",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105",
                        isActive
                          ? "bg-[#424687] text-white shadow-md shadow-[#424687]/25"
                          : "bg-slate-200/70 text-slate-600 group-hover:bg-[#424687] group-hover:text-white",
                      ].join(" ")}
                    >
                      {getIconComponent(icon, "h-[1.05rem] w-[1.05rem]")}
                    </span>
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                        expanded ? "max-w-[9rem] flex-1 opacity-100" : "max-w-0 opacity-0"
                      }`}
                    >
                      {label}
                    </span>
                    {isActive && expanded && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#424687]" aria-hidden />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
