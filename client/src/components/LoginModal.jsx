import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import {
  login,
  verify2FA,
  forgot2FA,
  forgotPassword,
  verifyOTP,
  resetPassword,
  clearError,
} from "../redux/authSlice";

const LoginModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.user || {});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending2FA, setPending2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [showForgot2FA, setShowForgot2FA] = useState(false);
  const [forgot2FAUsername, setForgot2FAUsername] = useState("");
  const [forgot2FAMessage, setForgot2FAMessage] = useState("");
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [step, setStep] = useState(1);

  const otpInputRefs = useRef([]);
  const OTP_LEN = 6;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (showForgotForm && step === 2) {
      otpInputRefs.current[0]?.focus();
    }
  }, [showForgotForm, step]);

  useEffect(() => {
    if (!open) return;
    if (location.state?.accountExpiredMessage) {
      setShowRechargePopup(true);
      navigate(location.pathname + location.search, {
        replace: true,
        state: {},
      });
    }
  }, [open, location.pathname, location.search, location.state, navigate]);

  const isSubscriptionExpiredError = (message) =>
    typeof message === "string" && /recharge|validity|expired/i.test(message);

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LEN);
    if (!pasted) return;
    setOtp(pasted);
    const next = Math.min(pasted.length, OTP_LEN - 1);
    requestAnimationFrame(() => otpInputRefs.current[next]?.focus());
  };

  const handleOtpBoxChange = (index, e) => {
    const code = otp.replace(/\D/g, "").slice(0, OTP_LEN);
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 1) {
      const pasted = raw.slice(0, OTP_LEN);
      setOtp(pasted);
      requestAnimationFrame(() =>
        otpInputRefs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus(),
      );
      return;
    }
    if (raw === "") {
      if (index < code.length) {
        setOtp(code.slice(0, index) + code.slice(index + 1));
      }
      return;
    }
    const digit = raw.slice(-1);
    let nextOtp;
    if (index < code.length) {
      nextOtp = (code.slice(0, index) + digit + code.slice(index + 1)).slice(
        0,
        OTP_LEN,
      );
    } else if (index === code.length && code.length < OTP_LEN) {
      nextOtp = (code + digit).slice(0, OTP_LEN);
    } else {
      return;
    }
    setOtp(nextOtp);
    if (digit && index < OTP_LEN - 1) {
      requestAnimationFrame(() => otpInputRefs.current[index + 1]?.focus());
    }
  };

  const handleOtpBoxKeyDown = (index, e) => {
    const code = otp.replace(/\D/g, "").slice(0, OTP_LEN);
    if (e.key !== "Backspace") return;
    if (code[index]) return;
    e.preventDefault();
    if (index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      setOtp(code.slice(0, index - 1) + code.slice(index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    dispatch(clearError());

    if (!email || !password) {
      setFormError("Please enter both username/email and password");
      return;
    }

    dispatch(login({ email: email.trim(), password })).then((result) => {
      if (result.type === "user/login/fulfilled") {
        if (result.payload?.requires2FA) {
          setPending2FA(true);
          setTempToken(result.payload.tempToken || "");
          setTwoFACode("");
          dispatch(clearError());
          return;
        }
        navigate("/dashboard");
      } else if (isSubscriptionExpiredError(result.payload)) {
        setShowRechargePopup(true);
        dispatch(clearError());
      }
    });
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    setFormError("");
    dispatch(clearError());

    if (!twoFACode.trim()) {
      setFormError("Please enter the 6-digit authenticator code");
      return;
    }

    dispatch(verify2FA({ tempToken, code: twoFACode.trim() })).then(
      (result) => {
        if (result.type === "user/verify2FA/fulfilled") {
          setPending2FA(false);
          setTempToken("");
          navigate("/dashboard");
        } else if (isSubscriptionExpiredError(result.payload)) {
          setShowRechargePopup(true);
          setPending2FA(false);
          dispatch(clearError());
        }
      },
    );
  };

  const handleBackFrom2FA = () => {
    setPending2FA(false);
    setTempToken("");
    setTwoFACode("");
    setShowForgot2FA(false);
    setForgot2FAUsername("");
    setForgot2FAMessage("");
    setFormError("");
    dispatch(clearError());
  };

  const openForgot2FA = () => {
    const loginId = email.trim();
    setForgot2FAUsername(loginId.includes("@") ? "" : loginId);
    setForgot2FAMessage("");
    setFormError("");
    setShowForgot2FA(true);
  };

  const handleForgot2FASubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setForgot2FAMessage("");

    if (!forgot2FAUsername.trim()) {
      setFormError("Please enter your username");
      return;
    }

    const result = await dispatch(forgot2FA(forgot2FAUsername.trim()));
    if (forgot2FA.fulfilled.match(result)) {
      setForgot2FAMessage(
        result.payload?.message ||
          "If this username exists and has 2FA enabled, a reset link has been sent to the registered email.",
      );
      return;
    }

    setFormError(result.payload || "Failed to send reset email");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert("Please enter your email");
      return;
    }
    const result = await dispatch(forgotPassword(forgotEmail.trim()));
    if (forgotPassword.fulfilled.match(result)) {
      alert(
        result.payload ||
          "If this email is registered, a password reset OTP has been sent.",
      );
      setStep(2);
    } else {
      alert(result.payload || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      alert("Please enter OTP");
      return;
    }
    const result = await dispatch(
      verifyOTP({ email: forgotEmail.trim(), otp: otp.trim() }),
    );
    if (verifyOTP.fulfilled.match(result)) {
      alert("OTP verified successfully");
      setStep(3);
    } else {
      alert(result.payload || "Invalid or expired OTP");
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    const result = await dispatch(
      resetPassword({
        email: forgotEmail.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      }),
    );
    if (resetPassword.fulfilled.match(result)) {
      alert("Password reset successfully");
      setShowForgotForm(false);
      setStep(1);
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
    } else {
      alert(result.payload || "Failed to reset password");
      if (result.payload === "Invalid or expired OTP") {
        setStep(2);
      }
    }
  };

  const handleClose = () => {
    setFormError("");
    dispatch(clearError());
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close login"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px]"
        onClick={handleClose}
      />

      {showRechargePopup && (
        <div className="absolute inset-0 z-[10060] flex items-center justify-center px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#424687]/15 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#424687] to-[#252858] px-6 py-4 text-white sm:px-8">
              <h2 className="text-lg font-bold">Account Recharge Required</h2>
              <p className="mt-1 text-sm text-white/80">
                Your account validity has expired.
              </p>
            </div>
            <div className="px-6 py-7 sm:px-8">
              <p className="text-base font-bold leading-relaxed text-slate-800 sm:text-lg">
                Please contact admin to renew your account validity.
              </p>
              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRechargePopup(false)}
                  className="rounded-xl bg-[#424687] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#252858]"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative z-[10055] flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white text-slate-900 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#424687]">
              MyAcBook
            </p>
            <h2
              id="login-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Sign in
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {showForgotForm ? (
            <div className="w-full">
              <h3 className="text-2xl font-bold text-gray-900 text-center">
                Reset Password
              </h3>
              <p className="text-gray-500 text-center mt-2 mb-6 text-sm">
                Enter your details to recover your account
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowForgotForm(false);
                  setStep(1);
                  setForgotEmail("");
                  setOtp("");
                  setNewPassword("");
                }}
                className="mb-5 text-[#424687] font-medium hover:underline"
              >
                ← Back to Login
              </button>

              {step === 1 && (
                <form onSubmit={handleForgotSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      OTP
                    </label>
                    <div
                      className="flex justify-center gap-2 sm:gap-3"
                      onPaste={handleOtpPaste}
                      role="group"
                      aria-label="6-digit one-time password"
                    >
                      {Array.from({ length: OTP_LEN }, (_, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpInputRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={i === 0 ? "one-time-code" : "off"}
                          maxLength={1}
                          value={
                            otp.replace(/\D/g, "").slice(0, OTP_LEN)[i] ?? ""
                          }
                          onChange={(e) => handleOtpBoxChange(i, e)}
                          onKeyDown={(e) => handleOtpBoxKeyDown(i, e)}
                          className="h-12 w-10 sm:h-14 sm:w-12 shrink-0 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-semibold tracking-widest text-gray-900 tabular-nums focus:border-[#424687] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40"
                          aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Enter the 6-digit code from your email
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleResetSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-[#424687]"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              )}

              {error && (
                <p className="text-red-500 mt-4 text-sm text-center bg-red-50 border border-red-100 rounded-lg py-2">
                  {error}
                </p>
              )}
            </div>
          ) : pending2FA && showForgot2FA ? (
            <div className="w-full">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900">
                  Forgot Authenticator
                </h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Username daalo. QR code aur confirm link sirf registered email
                  par jayega.
                </p>
              </div>

              <div className="mb-5 rounded-xl border border-[#424687]/15 bg-[#424687]/5 px-3 py-3 text-xs leading-relaxed text-slate-600">
                <p className="font-semibold text-[#424687]">Steps:</p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                  <li>Send Reset Email dabao</li>
                  <li>Email ka QR phone par scan karo</li>
                  <li>Email ki link kholo, code daalo, phir login karo</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForgot2FA(false);
                  setForgot2FAMessage("");
                  setFormError("");
                }}
                className="mb-5 text-[#424687] font-medium hover:underline"
              >
                ← Back to Authenticator Code
              </button>

              <form onSubmit={handleForgot2FASubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={forgot2FAUsername}
                    onChange={(e) => setForgot2FAUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Send Reset Email"}
                </button>
              </form>

              {forgot2FAMessage && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
                  <p>{forgot2FAMessage}</p>
                </div>
              )}

              {(formError || error) && (
                <p className="text-red-500 mt-4 text-sm text-center bg-red-50 border border-red-100 rounded-lg py-2">
                  {formError || error}
                </p>
              )}
            </div>
          ) : pending2FA ? (
            <form onSubmit={handle2FASubmit} className="w-full">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900">
                  Two-Factor Auth
                </h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Enter the 6-digit code from Google Authenticator
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackFrom2FA}
                className="mb-5 text-[#424687] font-medium hover:underline"
              >
                ← Back to Login
              </button>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={twoFACode}
                  onChange={(e) =>
                    setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-semibold tracking-[0.4em] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>

              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={openForgot2FA}
                  className="text-[#424687] hover:underline text-sm font-semibold"
                >
                  Lost access to Authenticator?
                </button>
              </p>

              {(formError || error) && (
                <p className="text-red-500 mt-4 text-sm text-center bg-red-50 border border-red-100 rounded-lg py-2">
                  {formError || error}
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="w-full">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-extrabold text-gray-900">
                  Welcome Back
                </h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Login to continue your accounting dashboard
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-[#424687]"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="mt-5 space-y-4">
                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotForm(true)}
                    className="text-[#424687] hover:underline text-sm font-semibold"
                  >
                    Forgot Password?
                  </button>
                </p>

                <div className="border border-green-100 bg-green-50 rounded-2xl p-4">
                  <p className="text-center text-sm text-gray-600 mb-3">
                    Need help? Our support team is available for any queries.
                  </p>
                  <a
                    href="https://wa.me/380936072208"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition text-sm sm:text-base text-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .12 5.35.12 11.94c0 2.1.55 4.16 1.6 5.98L0 24l6.25-1.64a11.9 11.9 0 0 0 5.8 1.48h.01c6.58 0 11.93-5.35 11.93-11.94 0-3.19-1.24-6.18-3.47-8.42ZM12.06 21.8h-.01a9.83 9.83 0 0 1-5.01-1.37l-.36-.21-3.71.97.99-3.61-.23-.37a9.83 9.83 0 0 1-1.52-5.27c0-5.44 4.42-9.86 9.87-9.86 2.63 0 5.11 1.02 6.97 2.89a9.8 9.8 0 0 1 2.89 6.97c0 5.44-4.43 9.86-9.88 9.86Zm5.41-7.39c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.48-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.1 4.48.71.31 1.27.5 1.7.64.72.23 1.37.2 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                    </svg>
                    Contact Support on WhatsApp
                  </a>
                </div>
              </div>

              {(formError || error) && (
                <p className="text-red-500 mt-4 text-sm text-center bg-red-50 border border-red-100 rounded-lg py-2">
                  {formError || error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
