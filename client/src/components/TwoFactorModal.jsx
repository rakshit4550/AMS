import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { disable2FA, enable2FA, setup2FA } from "../redux/authSlice";

const TwoFactorModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const twoFactorEnabled = Boolean(currentUser?.twoFactorEnabled);

  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSetup = async () => {
    setFormError("");
    setSubmitting(true);
    const result = await dispatch(setup2FA());
    setSubmitting(false);

    if (setup2FA.fulfilled.match(result)) {
      setQrCode(result.payload.qrCode || "");
      setSecret(result.payload.secret || "");
      return;
    }

    setFormError(result.payload || "Failed to generate QR code.");
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!code.trim()) {
      setFormError("Enter the 6-digit code from Google Authenticator.");
      return;
    }

    setSubmitting(true);
    const result = await dispatch(enable2FA(code.trim()));
    setSubmitting(false);

    if (enable2FA.fulfilled.match(result)) {
      toast.success("Two-factor authentication enabled!", {
        position: "top-center",
        autoClose: 2500,
      });
      onClose();
      return;
    }

    setFormError(result.payload || "Invalid code. Try again.");
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!password.trim() || !code.trim()) {
      setFormError("Password and authenticator code are required.");
      return;
    }

    setSubmitting(true);
    const result = await dispatch(
      disable2FA({ password: password.trim(), code: code.trim() }),
    );
    setSubmitting(false);

    if (disable2FA.fulfilled.match(result)) {
      toast.success("Two-factor authentication disabled.", {
        position: "top-center",
        autoClose: 2500,
      });
      onClose();
      return;
    }

    setFormError(result.payload || "Failed to disable 2FA.");
  };

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-800">
            Two-Factor Authentication
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {!twoFactorEnabled && (
            <div className="rounded-lg border border-[#424687]/15 bg-[#424687]/5 px-3 py-3 text-xs leading-relaxed text-slate-600">
              <p className="font-semibold text-[#424687]">2FA enable kaise karein:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Phone par Google Authenticator app install karo</li>
                <li>Niche &quot;Setup 2FA&quot; dabao → QR code aayega</li>
                <li>App se QR scan karo</li>
                <li>App ka 6-digit code daalo → Enable 2FA</li>
              </ol>
            </div>
          )}

          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          {twoFactorEnabled ? (
            <form onSubmit={handleDisable} className="space-y-4">
              <p className="text-sm text-slate-600">
                2FA is <span className="font-semibold text-green-700">enabled</span>.
                Enter your password and authenticator code to turn it off.
              </p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                  placeholder="Your login password"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                  placeholder="6-digit code"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? "Disabling…" : "Disable 2FA"}
              </button>
            </form>
          ) : !qrCode ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Add an extra layer of security using Google Authenticator app.
              </p>
              <button
                type="button"
                onClick={handleSetup}
                disabled={submitting}
                className="w-full rounded-md bg-[#424687] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#353a6e] disabled:opacity-60"
              >
                {submitting ? "Loading…" : "Setup 2FA"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnable} className="space-y-4">
              <p className="text-sm text-slate-600">
                Scan this QR code in Google Authenticator, then enter the code
                below.
              </p>
              <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-3">
                <img src={qrCode} alt="2FA QR code" className="h-44 w-44" />
              </div>
              {secret && (
                <p className="break-all text-center text-xs text-slate-500">
                  Manual key: <span className="font-mono">{secret}</span>
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                  placeholder="6-digit code"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-[#424687] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#353a6e] disabled:opacity-60"
              >
                {submitting ? "Enabling…" : "Enable 2FA"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorModal;
