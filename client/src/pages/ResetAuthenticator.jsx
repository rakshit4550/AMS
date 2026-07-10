import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  confirmReset2FA,
  fetchReset2FASetup,
} from "../redux/authSlice";

const ResetAuthenticator = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadError("Reset link is invalid. Please request a new one.");
      return;
    }

    let cancelled = false;

    const loadSetup = async () => {
      setLoading(true);
      setLoadError("");
      const result = await dispatch(fetchReset2FASetup(token));
      if (cancelled) return;

      if (fetchReset2FASetup.fulfilled.match(result)) {
        setUsername(result.payload.username || "");
        setQrCode(result.payload.qrCode || "");
        setLoading(false);
        return;
      }

      setLoadError(result.payload || "Invalid or expired reset link.");
      setLoading(false);
    };

    loadSetup();

    return () => {
      cancelled = true;
    };
  }, [dispatch, token]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!code.trim()) {
      setFormError("Enter the 6-digit code from Google Authenticator.");
      return;
    }

    setSubmitting(true);
    const result = await dispatch(
      confirmReset2FA({ token, code: code.trim() }),
    );
    setSubmitting(false);

    if (confirmReset2FA.fulfilled.match(result)) {
      toast.success("Authenticator reset successfully. Please login.", {
        position: "top-center",
        autoClose: 3000,
      });
      navigate("/", { replace: true });
      return;
    }

    setFormError(result.payload || "Failed to reset authenticator.");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-white to-[#f5f3ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 text-center">
          Confirm Authenticator Reset
        </h1>
        <p className="text-gray-500 text-center mt-2 text-sm">
          Email wale QR se scan kar chuke ho? Bas code daalo aur confirm karo.
        </p>

        {loading && (
          <p className="mt-8 text-center text-sm text-slate-500">Loading…</p>
        )}

        {!loading && loadError && (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loadError}
            </p>
            <p className="text-center text-xs text-slate-500">
              Link expire ho gaya ho to login par jaake dubara &quot;Forgot
              Authenticator&quot; request karo.
            </p>
            <Link
              to="/"
              className="block text-center text-sm font-semibold text-[#424687] hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        )}

        {!loading && !loadError && qrCode && (
          <form onSubmit={handleConfirm} className="mt-6 space-y-4">
            {username && (
              <p className="text-center text-sm text-slate-600">
                Account: <span className="font-semibold">{username}</span>
              </p>
            )}

            <div className="rounded-xl border border-[#424687]/15 bg-[#424687]/5 px-3 py-3 text-xs leading-relaxed text-slate-600">
              <p className="font-semibold text-[#424687]">Steps:</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>
                  Email ka QR scan karo (ya neeche wala same QR use karo)
                </li>
                <li>Google Authenticator ka 6-digit code yahan daalo</li>
                <li>Confirm dabao — phir login karo</li>
              </ol>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-500">
                Same QR as email (scan again if needed)
              </p>
              <img src={qrCode} alt="Authenticator QR code" className="h-44 w-44" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-semibold tracking-[0.4em] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                autoFocus
              />
            </div>

            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
            >
              {submitting ? "Confirming…" : "Confirm & Enable 2FA"}
            </button>

            <Link
              to="/"
              className="block text-center text-sm font-semibold text-[#424687] hover:underline"
            >
              Go to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetAuthenticator;
