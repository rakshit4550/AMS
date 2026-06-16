import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { AiFillBank, AiFillDashboard } from "react-icons/ai";
import { GrTransaction } from "react-icons/gr";
import { FaUser } from "react-icons/fa";
import { TbReportAnalytics } from "react-icons/tb";
import { BsReceiptCutoff } from "react-icons/bs";
import { IoLogOutOutline } from "react-icons/io5";
import { logout } from "../redux/authSlice";

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

const MobileBottomNav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.user);
  const userRole = role || getRoleFromToken();

  const items = [
    { to: "/dashboard", label: "Home", icon: AiFillDashboard },
    { to: "/parties", label: "Parties", icon: AiFillBank },
    { to: "/account", label: "Account", icon: GrTransaction },
    ...(userRole === "trader"
      ? [{ to: "/utr", label: "UTR", icon: BsReceiptCutoff }]
      : []),
    { to: "/report", label: "Report", icon: TbReportAnalytics },
    ...(userRole === "admin"
      ? [{ to: "/user", label: "Users", icon: FaUser }]
      : []),
  ];

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
    navigate("/");
  };

  return (
    <nav className="mobile-bottom-nav lg:hidden" aria-label="Mobile navigation">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            ["mobile-bottom-nav__item", isActive ? "is-active" : ""].join(" ")
          }
        >
          <span className="mobile-bottom-nav__icon">
            <Icon aria-hidden />
          </span>
          <span className="mobile-bottom-nav__label">{label}</span>
        </NavLink>
      ))}

      <button
        type="button"
        onClick={handleLogout}
        className="mobile-bottom-nav__item mobile-bottom-nav__item--logout"
        aria-label="Sign out"
      >
        <span className="mobile-bottom-nav__icon">
          <IoLogOutOutline aria-hidden />
        </span>
        <span className="mobile-bottom-nav__label">Logout</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
