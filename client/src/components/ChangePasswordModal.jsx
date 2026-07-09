import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { changePassword, verifyOldPassword } from "../redux/authSlice";

const ChangePasswordModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedOld) {
      setFormError("Please enter your current password.");
      return;
    }
    if (!trimmedNew) {
      setFormError("Please enter a new password.");
      return;
    }
    if (trimmedNew.length < 6) {
      setFormError("New password must be at least 6 characters.");
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setFormError("New passwords do not match.");
      return;
    }

    setSubmitting(true);

    const verifyResult = await dispatch(verifyOldPassword(trimmedOld));
    if (!verifyOldPassword.fulfilled.match(verifyResult)) {
      setSubmitting(false);
      setFormError(verifyResult.payload || "Current password is incorrect.");
      return;
    }

    const passwordChangeToken = verifyResult.payload?.passwordChangeToken;
    if (!passwordChangeToken) {
      setSubmitting(false);
      setFormError("Could not verify password. Please try again.");
      return;
    }

    const changeResult = await dispatch(
      changePassword({
        password: trimmedNew,
        confirmPassword: trimmedConfirm,
        passwordChangeToken,
      }),
    );
    setSubmitting(false);

    if (changePassword.fulfilled.match(changeResult)) {
      toast.success("Password changed successfully!", {
        position: "top-center",
        autoClose: 2500,
      });
      onClose();
      return;
    }

    setFormError(changeResult.payload || "Failed to change password.");
  };

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div>
            <label
              htmlFor="old-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="old-password"
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700"
                tabIndex={-1}
                aria-label={showOldPassword ? "Hide password" : "Show password"}
              >
                {showOldPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700"
                tabIndex={-1}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700"
                tabIndex={-1}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <FaEyeSlash size={16} />
                ) : (
                  <FaEye size={16} />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[#424687] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#353a6e] disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
