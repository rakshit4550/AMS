import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
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

const getIconComponent = (iconName) => {
  switch (iconName) {
    case "AiOutlineDashboard":
      return <AiFillDashboard className="h-4 w-4" />;
    case "AiOutlineCreditCard":
      return <GrTransaction className="h-4 w-4" />;
    case "AiOutlineWallet":
      return <AiFillBank className="h-4 w-4" />;
    case "AiOutlineFileText":
      return <FaUser className="h-4 w-4" />;
    case "AiOutlineTransaction":
      return <FaMoneyBillTransfer className="h-4 w-4" />;
    case "AiOutlineFileAdd":
      return <MdSettingsSuggest className="h-4 w-4" />;
    case "AiOutlineTicket":
      return <MdPlaylistAddCircle className="h-4 w-4" />;
    case "TbReportAnalytics":
      return <TbReportAnalytics className="h-4 w-4" />;
    case "GiBank":
      return <GiBank className="h-4 w-4" />;
    case "FaDollarSign":
      return <FaDollarSign className="h-4 w-4" />;
    case "FaPiggyBank":
      return <FaPiggyBank className="h-4 w-4" />;
    case "BsReceiptCutoff":
      return <BsReceiptCutoff className="h-4 w-4" />;
    default:
      return null;
  }
};

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);
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

  const handleToggle = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white text-black shadow-lg">
      <div className="p-4 text-2xl font-bold border-b border-gray-200 text-center">
        Accounting App
      </div>
      <ul className="text-sm p-2">
        {/* Parties Menu Item */}
        <li>
          <div
            className={`flex items-center p-3 rounded-md transition-transform duration-300 hover:scale-[0.95] ${
              window.location.pathname === "/parties"
                ? "text-[#424687] border-r-4 border-[#424687]"
                : ""
            }`}
          >
            <NavLink
              to="/parties"
              className={({ isActive }) =>
                `flex items-center w-full rounded p-2 hover:bg-gray-200 ${
                  isActive ? "font-bold text-[#424687] bg-gray-200" : ""
                }`
              }
            >
              <span className="mr-3">
                {getIconComponent("AiOutlineWallet")}
              </span>
              <span>Parties</span>
            </NavLink>
          </div>
        </li>

        {/* Account Menu Item */}
        <li>
          <div
            className={`flex items-center p-3 rounded-md transition-transform duration-300 hover:scale-[0.95] ${
              window.location.pathname === "/account"
                ? "text-[#424687] border-r-4 border-[#424687]"
                : ""
            }`}
          >
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center w-full rounded p-2 hover:bg-gray-200 ${
                  isActive ? "font-bold text-[#424687] bg-gray-200" : ""
                }`
              }
            >
              <span className="mr-3">
                {getIconComponent("AiOutlineCreditCard")}
              </span>
              <span>Account</span>
            </NavLink>
          </div>
        </li>

        {/* UTR Menu Item (Trader only) */}
        {userRole === "trader" && (
          <li>
            <div
              className={`flex items-center p-3 rounded-md transition-transform duration-300 hover:scale-[0.95] ${
                window.location.pathname === "/utr"
                  ? "text-[#424687] border-r-4 border-[#424687]"
                  : ""
              }`}
            >
              <NavLink
                to="/utr"
                className={({ isActive }) =>
                  `flex items-center w-full rounded p-2 hover:bg-gray-200 ${
                    isActive ? "font-bold text-[#424687] bg-gray-200" : ""
                  }`
                }
              >
                <span className="mr-3">
                  {getIconComponent("BsReceiptCutoff")}
                </span>
                <span>UTR</span>
              </NavLink>
            </div>
          </li>
        )}

        {/* Report Menu Item */}
        <li>
          <div
            className={`flex items-center p-3 rounded-md transition-transform duration-300 hover:scale-[0.95] ${
              window.location.pathname === "/report"
                ? "text-[#424687] border-r-4 border-[#424687]"
                : ""
            }`}
          >
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `flex items-center w-full rounded p-2 hover:bg-gray-200 ${
                  isActive ? "font-bold text-[#424687] bg-gray-200" : ""
                }`
              }
            >
              <span className="mr-3">
                {getIconComponent("TbReportAnalytics")}
              </span>
              <span>Report</span>
            </NavLink>
          </div>
        </li>

        {/* Users Menu Item (Admin only) */}
        {role === "admin" && (
          <li>
            <div
              className={`flex items-center p-3 rounded-md transition-transform duration-300 hover:scale-[0.95] ${
                window.location.pathname === "/user"
                  ? "text-[#424687] border-r-4 border-[#424687]"
                  : ""
              }`}
            >
              <NavLink
                to="/user"
                className={({ isActive }) =>
                  `flex items-center w-full rounded p-2 hover:bg-gray-200 ${
                    isActive ? "font-bold text-[#424687] bg-gray-200" : ""
                  }`
                }
              >
                <span className="mr-3">
                  {getIconComponent("AiOutlineFileText")}
                </span>
                <span>Users</span>
              </NavLink>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
