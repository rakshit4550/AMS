import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  login,
  logout,
  loadUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "tailwindcss/tailwind.css";
import { Images } from "../assets/images";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, token, loading, error } = useSelector(
    (state) => state.user || {},
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot password states
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password

  const isAuthenticated = !!currentUser;

  // Load user on component mount to restore state from token
  useEffect(() => {
    console.log("Login: Dispatching loadUser");
    dispatch(loadUser()).then((result) => {
      if (result.type === "user/loadUser/fulfilled") {
        console.log("User loaded successfully, navigating to /parties");
        navigate("/parties");
      }
    });
  }, [dispatch, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      console.log("Validation failed: Email or password missing");
      alert("Please enter both username/email and password");
      return;
    }
    console.log("Submitting login with:", {
      email: email.trim(),
      password: "****",
    });
    dispatch(login({ email: email.trim(), password }))
      .then((result) => {
        console.log("Login result:", result);
        if (result.type === "user/login/fulfilled") {
          console.log("Login successful, navigating to /parties");
          navigate("/parties");
        } else {
          console.log("Login failed:", result.payload);
          alert(result.payload || "Login failed. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        alert("An unexpected error occurred. Please try again.");
      });
  };

  const handleLogout = () => {
    console.log("Logging out");
    dispatch(logout());
    navigate("/");
  };

  // Forgot password handlers
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert("Please enter your email");
      return;
    }
    const result = await dispatch(forgotPassword(forgotEmail.trim()));
    if (forgotPassword.fulfilled.match(result)) {
      alert("OTP sent to your email");
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
      // Stay on step 2 to retry
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
      // Optionally redirect to login
    } else {
      alert(result.payload || "Failed to reset password");
      // If invalid OTP in reset, go back to step 2
      if (
        result.payload === "Invalid OTP" ||
        result.payload === "OTP expired"
      ) {
        setStep(2);
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          Welcome, {currentUser?.username || "Admin"}!
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-white to-[#f5f3ff] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[620px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#424687] to-[#252858] text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/10 rounded-full" />

          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-4">Accounting App</h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Manage parties, accounts, UTR entries and reports in one clean
              dashboard.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
            <p className="text-sm text-white/80">Secure Login</p>
            <h3 className="text-2xl font-bold mt-1">Fast. Simple. Reliable.</h3>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            {showForgotForm ? (
              <div className="w-full">
                <h2 className="text-3xl font-bold text-gray-900 text-center">
                  Reset Password
                </h2>
                <p className="text-gray-500 text-center mt-2 mb-6">
                  Enter your details to recover your account
                </p>

                <button
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50"
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
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
                        required
                        maxLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50"
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
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
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
                      className="w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50"
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
            ) : (
              <form onSubmit={handleSubmit} className="w-full">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-extrabold text-gray-900">
                    Welcome Back
                  </h2>
                  <p className="text-gray-500 mt-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
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
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#424687]/40 focus:border-[#424687]"
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
                  className="mt-6 w-full bg-gradient-to-r from-[#424687] to-[#252858] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
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

                  <div className="border border-green-100 bg-green-50 rounded-2xl p-4 shadow-sm">
                    <p className="text-center text-sm text-gray-600 mb-3">
                      Need help? Our support team is available for any queries.
                    </p>

                    <a
                      href="https://wa.me/94763173419"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base text-center"
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

                    <p className="text-center text-xs text-gray-500 mt-3">
                      For any query our support team is available to help you.
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 mt-4 text-sm text-center bg-red-50 border border-red-100 rounded-lg py-2">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
