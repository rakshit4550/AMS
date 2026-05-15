import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { IoLogOutOutline } from "react-icons/io5";
import { AiFillBank, AiFillDashboard } from "react-icons/ai";
import { GrTransaction } from "react-icons/gr";
import { FaUser } from "react-icons/fa";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { MdSettingsSuggest, MdPlaylistAddCircle } from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";
import { FaDollarSign } from "react-icons/fa";
import { GiBank } from "react-icons/gi";
import { FaPiggyBank } from "react-icons/fa6";
import { BsReceiptCutoff } from "react-icons/bs";
import { logout } from "../redux/authSlice";

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
    default:
      return null;
  }
};

const Sidebar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, currentUser } = useSelector((state) => state.user);

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

  const handleSignOut = () => {
    onMenuClick?.();
    dispatch(logout());
    toast.success("Logged out successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
    navigate("/");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "AiOutlineDashboard" },
    { to: "/parties", label: "Parties", icon: "AiOutlineWallet" },
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
    <div className="flex h-full w-60 flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100/95 shadow-[4px_0_24px_-8px_rgba(66,70,135,0.18)]">
      <div className="shrink-0 bg-gradient-to-br from-[#424687] to-[#353a6e] px-4 py-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          myacbook
        </p>
        <h1 className="text-lg font-bold leading-tight tracking-tight">
          Accounting
        </h1>
        <p className="mt-1 text-xs text-white/75">Ledger &amp; reports</p>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={() => onMenuClick?.()}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
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
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                        isActive
                          ? "bg-[#424687] text-white shadow-md shadow-[#424687]/25"
                          : "bg-slate-200/70 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800",
                      ].join(" ")}
                    >
                      {getIconComponent(icon, "h-[1.05rem] w-[1.05rem]")}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {isActive && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#424687]"
                        aria-hidden
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-200/90 bg-slate-50/80 p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-white px-2.5 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 hover:border-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
        >
          <IoLogOutOutline className="h-5 w-5 shrink-0" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
