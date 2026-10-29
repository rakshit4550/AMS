import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiChevronDown, FiClock, FiLock, FiLogOut, FiShield } from "react-icons/fi";
import { toast } from "./AppToast";
import { logout } from "../redux/authSlice";
import ChangePasswordModal from "./ChangePasswordModal";
import TwoFactorModal from "./TwoFactorModal";

const IST = "Asia/Kolkata";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const profileRef = useRef(null);
  const expiryLogoutDoneRef = useRef(false);
  const { currentUser, role } = useSelector((state) => state.user);

  const displayName =
    currentUser?.username || currentUser?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

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
      minutes,
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
      navigate("/", {
        replace: true,
        state: { accountExpiredMessage: "Please recharge your account" },
      });
    }
  }, [currentUser, role, now, dispatch, navigate]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  const openChangePassword = () => {
    setProfileOpen(false);
    setChangePasswordOpen(true);
  };

  const openTwoFactor = () => {
    setProfileOpen(false);
    setTwoFactorOpen(true);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logout());
    toast.success("Logged out successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
    navigate("/");
  };

  return (
    <>
      <div className="app-header fixed left-0 right-0 top-0 z-[100] border-b border-indigo-200/30 bg-gradient-to-r from-[#eef2ff]/95 via-white/95 to-[#f5f3ff]/95 shadow-[0_4px_24px_-8px_rgba(37,40,88,0.12)] backdrop-blur-xl transition-[left] duration-300 ease-out lg:left-[var(--app-sidebar-width)] lg:right-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#424687] via-indigo-500 to-[#252858]" />

        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-1.5 px-3 py-1.5 sm:h-[52px] sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:py-0 lg:px-5">
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-sm font-bold leading-tight text-[#252858]">Accounting</p>
          </div>

          <div className="flex w-full min-w-0 items-center justify-end gap-1.5 sm:w-auto">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full border border-[#424687]/10 bg-white/90 px-2.5 py-1 text-[11px] shadow-sm sm:flex-none sm:px-3 sm:text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-700">
                <FiCalendar className="h-3.5 w-3.5 shrink-0 text-[#424687]" aria-hidden />
                <span className="truncate sm:hidden">{dateLabelShort}</span>
                <span className="hidden truncate sm:inline">{dateLabel}</span>
              </span>
              <span className="h-3.5 w-px shrink-0 bg-slate-200" aria-hidden />
              <span className="inline-flex shrink-0 items-center gap-1.5 tabular-nums">
                <FiClock className="h-3.5 w-3.5 shrink-0 text-[#424687]" aria-hidden />
                <span className="whitespace-nowrap font-semibold text-[#252858]">{timeLabel}</span>
                <span className="rounded bg-[#424687]/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#424687]">
                  IST
                </span>
              </span>
            </div>

            <div className="relative shrink-0" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="inline-flex !h-9 !min-h-0 items-center gap-1.5 rounded-full border border-[#424687]/10 bg-white/90 py-1 pl-1 pr-2 text-sm shadow-sm transition hover:border-[#424687]/25 hover:bg-white"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Profile menu"
              >
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#424687] to-[#353a6e] text-xs font-bold text-white">
                  {initials}
                  {currentUser?.twoFactorEnabled && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"
                      title="2FA enabled"
                    />
                  )}
                </span>
                <span className="max-w-[72px] truncate text-xs font-semibold text-slate-700 sm:max-w-[120px]">
                  {displayName}
                </span>
                <FiChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-[110] w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_40px_-12px_rgba(37,40,88,0.35)]"
                >
                  <div className="bg-gradient-to-br from-[#424687] to-[#353a6e] px-4 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        {currentUser?.email && (
                          <p className="truncate text-[11px] text-white/75">{currentUser.email}</p>
                        )}
                        {role && (
                          <p className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            {role}
                            {currentUser?.twoFactorEnabled ? " · 2FA" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openTwoFactor}
                      className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-[#424687]/5"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#424687]/10 text-[#424687]">
                        <FiShield className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">Two-Factor Auth</span>
                        <span className="block text-[11px] text-slate-500">
                          {currentUser?.twoFactorEnabled
                            ? "Enabled with Google Authenticator"
                            : "Turn on Google Authenticator"}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openChangePassword}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-[#424687]/5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#424687]/10 text-[#424687]">
                        <FiLock className="h-4 w-4" aria-hidden />
                      </span>
                      Change password
                    </button>
                    <div className="my-1 h-px bg-slate-100" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <FiLogOut className="h-4 w-4" aria-hidden />
                      </span>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {validityLabel && (
            <span
              className={`inline-flex w-full items-center justify-center rounded-full border px-3 py-1 text-center text-[10px] font-semibold leading-snug sm:w-auto sm:max-w-md sm:px-3 sm:text-xs ${
                validityLabel.startsWith("Expired")
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {validityLabel}
            </span>
          )}
        </div>
      </div>

      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}

      {twoFactorOpen && (
        <TwoFactorModal onClose={() => setTwoFactorOpen(false)} />
      )}
    </>
  );
};

export default Header;
