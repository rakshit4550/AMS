import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock } from "react-icons/fi";
import { logout } from "../redux/authSlice";

const IST = "Asia/Kolkata";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
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

  return (
    <div className="app-header fixed left-0 right-0 top-0 z-[100] border-b border-indigo-200/30 bg-gradient-to-r from-[#eef2ff]/95 via-white/95 to-[#f5f3ff]/95 shadow-[0_4px_24px_-8px_rgba(37,40,88,0.12)] backdrop-blur-xl lg:left-60 lg:right-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#424687] via-indigo-500 to-[#252858]" />

      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-2 px-3 py-2.5 sm:h-[72px] sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:py-0 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#424687]/70">
            myacbook
          </p>
          <h1 className="truncate text-base font-bold leading-tight text-[#252858]">
            Accounting
          </h1>
        </div>

        <div className="flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-[#424687]/12 bg-white/80 px-2.5 py-2 text-[11px] shadow-sm backdrop-blur-sm sm:w-auto sm:justify-end sm:gap-x-3 sm:px-3 sm:py-1.5 sm:text-sm">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-700">
            <FiCalendar
              className="h-3.5 w-3.5 shrink-0 text-[#424687] sm:h-4 sm:w-4"
              aria-hidden
            />
            <span className="truncate sm:hidden">{dateLabelShort}</span>
            <span className="hidden truncate sm:inline">{dateLabel}</span>
          </span>
          <span
            className="h-4 w-px shrink-0 bg-slate-200"
            aria-hidden
          />
          <span className="inline-flex shrink-0 items-center gap-1.5 tabular-nums">
            <FiClock
              className="h-3.5 w-3.5 shrink-0 text-[#424687] sm:h-4 sm:w-4"
              aria-hidden
            />
            <span className="whitespace-nowrap font-semibold text-[#252858]">
              {timeLabel}
            </span>
            <span className="rounded-md bg-[#424687]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#424687]">
              IST
            </span>
          </span>
        </div>

        {validityLabel && (
          <span
            className={`inline-flex w-full items-center justify-center rounded-2xl border px-3 py-2 text-center text-[10px] font-bold leading-snug shadow-sm sm:w-auto sm:max-w-full sm:rounded-full sm:px-5 sm:py-2 sm:text-sm sm:leading-normal ${
              validityLabel.startsWith("Expired")
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-green-300 bg-green-50 text-green-700"
            }`}
          >
            {validityLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default Header;
