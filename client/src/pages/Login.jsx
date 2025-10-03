// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { login, logout, loadUser, forgotPassword, verifyOTP, resetPassword } from '../redux/authSlice';
// import { useNavigate } from 'react-router-dom';
// import 'tailwindcss/tailwind.css';
// import { Images } from '../assets/images';

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { currentUser, token, loading, error } = useSelector((state) => state.user || {});
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   // Forgot password states
//   const [showForgotForm, setShowForgotForm] = useState(false);
//   const [forgotEmail, setForgotEmail] = useState('');
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password

//   const isAuthenticated = !!currentUser;

//   // Load user on component mount to restore state from token
//   useEffect(() => {
//     console.log('Login: Dispatching loadUser');
//     dispatch(loadUser()).then((result) => {
//       if (result.type === 'user/loadUser/fulfilled') {
//         console.log('User loaded successfully, navigating to /parties');
//         navigate('/parties');
//       }
//     });
//   }, [dispatch, navigate]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!email || !password) {
//       console.log('Validation failed: Email or password missing');
//       alert('Please enter both username/email and password');
//       return;
//     }
//     console.log('Submitting login with:', { email: email.trim(), password: '****' });
//     dispatch(login({ email: email.trim(), password }))
//       .then((result) => {
//         console.log('Login result:', result);
//         if (result.type === 'user/login/fulfilled') {
//           console.log('Login successful, navigating to /parties');
//           navigate('/parties');
//         } else {
//           console.log('Login failed:', result.payload);
//           alert(result.payload || 'Login failed. Please try again.');
//         }
//       })
//       .catch((err) => {
//         console.error('Login error:', err);
//         alert('An unexpected error occurred. Please try again.');
//       });
//   };

//   const handleLogout = () => {
//     console.log('Logging out');
//     dispatch(logout());
//     navigate('/');
//   };

//   // Forgot password handlers
//   const handleForgotSubmit = async (e) => {
//     e.preventDefault();
//     if (!forgotEmail) {
//       alert('Please enter your email');
//       return;
//     }
//     const result = await dispatch(forgotPassword(forgotEmail.trim()));
//     if (forgotPassword.fulfilled.match(result)) {
//       alert('OTP sent to your email');
//       setStep(2);
//     } else {
//       alert(result.payload || 'Failed to send OTP');
//     }
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     if (!otp) {
//       alert('Please enter OTP');
//       return;
//     }
//     const result = await dispatch(verifyOTP({ email: forgotEmail.trim(), otp: otp.trim() }));
//     if (verifyOTP.fulfilled.match(result)) {
//       alert('OTP verified successfully');
//       setStep(3);
//     } else {
//       alert(result.payload || 'Invalid or expired OTP');
//       // Stay on step 2 to retry
//     }
//   };

//   const handleResetSubmit = async (e) => {
//     e.preventDefault();
//     if (!newPassword || newPassword.length < 6) {
//       alert('Password must be at least 6 characters');
//       return;
//     }
//     const result = await dispatch(resetPassword({ email: forgotEmail.trim(), otp: otp.trim(), newPassword }));
//     if (resetPassword.fulfilled.match(result)) {
//       alert('Password reset successfully');
//       setShowForgotForm(false);
//       setStep(1);
//       setForgotEmail('');
//       setOtp('');
//       setNewPassword('');
//       // Optionally redirect to login
//     } else {
//       alert(result.payload || 'Failed to reset password');
//       // If invalid OTP in reset, go back to step 2
//       if (result.payload === 'Invalid OTP' || result.payload === 'OTP expired') {
//         setStep(2);
//       }
//     }
//   };

//   if (isAuthenticated) {
//     return (
//       <div className="container mx-auto p-4">
//         <h1 className="text-2xl font-bold mb-4">Welcome, {currentUser?.username || 'Admin'}!</h1>
//         <button
//           onClick={handleLogout}
//           className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//         >
//           Logout
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-white w-full">
//       <div className="hidden lg:flex items-center justify-center w-1/2">
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           data-name="Layer 1"
//           width="500.13137"
//           height="450.89848"
//           viewBox="0 0 774.13137 669.89848"
//         >
//           {/* SVG content remains unchanged */}
//         </svg>
//       </div>
//       <div className="w-full lg:w-1/2 px-4 lg:pr-10 flex flex-col justify-center">
//         <div className="flex items-center justify-center mb-4">
//           {/* Logo or image placeholder */}
//         </div>
//         <div className="flex items-center justify-center">
//           {showForgotForm ? (
//             <div className="w-full max-w-md shadow-xl py-10 px-5 bg-white rounded border">
//               <h2 className="text-2xl font-semibold mb-4 text-center">Reset Password</h2>
//               <button
//                 onClick={() => {
//                   setShowForgotForm(false);
//                   setStep(1);
//                   setForgotEmail('');
//                   setOtp('');
//                   setNewPassword('');
//                 }}
//                 className="mb-4 text-blue-500 hover:underline"
//               >
//                 Back to Login
//               </button>
//               {step === 1 && (
//                 <form onSubmit={handleForgotSubmit} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
//                       Email
//                     </label>
//                     <input
//                       type="email"
//                       value={forgotEmail}
//                       onChange={(e) => setForgotEmail(e.target.value)}
//                       placeholder="Enter your email"
//                       className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                   </div>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
//                   >
//                     {loading ? 'Sending...' : 'Send OTP'}
//                   </button>
//                 </form>
//               )}
//               {step === 2 && (
//                 <form onSubmit={handleVerifyOtp} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
//                       OTP
//                     </label>
//                     <input
//                       type="text"
//                       value={otp}
//                       onChange={(e) => setOtp(e.target.value)}
//                       placeholder="Enter 6-digit OTP"
//                       className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                       maxLength={6}
//                     />
//                   </div>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
//                   >
//                     {loading ? 'Verifying...' : 'Verify OTP'}
//                   </button>
//                 </form>
//               )}
//               {step === 3 && (
//                 <form onSubmit={handleResetSubmit} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
//                       New Password
//                     </label>
//                     <input
//                       type="password"
//                       value={newPassword}
//                       onChange={(e) => setNewPassword(e.target.value)}
//                       placeholder="Enter new password"
//                       className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                       minLength={6}
//                     />
//                   </div>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
//                   >
//                     {loading ? 'Resetting...' : 'Reset Password'}
//                   </button>
//                 </form>
//               )}
//               {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit} className="w-full max-w-md shadow-xl py-10 px-5 bg-white rounded border">
//               <h2 className="text-2xl font-semibold mb-4 text-center">Welcome</h2>
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
//                     Username or Email
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="text"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       placeholder="Enter username or email"
//                       className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="password"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       placeholder="Enter password"
//                       className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                   </div>
//                 </div>
//               </div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
//               >
//                 {loading ? 'Logging in...' : 'Login'}
//               </button>
//               <p className="text-center mt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowForgotForm(true)}
//                   className="text-blue-500 hover:underline text-sm"
//                 >
//                   Forgot Password?
//                 </button>
//               </p>
//               {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
//             </form>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout, loadUser, forgotPassword, verifyOTP, resetPassword } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import 'tailwindcss/tailwind.css';
import { Images } from '../assets/images';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, token, loading, error } = useSelector((state) => state.user || {});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot password states
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password

  const isAuthenticated = !!currentUser;

  // Load user on component mount to restore state from token
  useEffect(() => {
    console.log('Login: Dispatching loadUser');
    dispatch(loadUser()).then((result) => {
      if (result.type === 'user/loadUser/fulfilled') {
        console.log('User loaded successfully, navigating to /parties');
        navigate('/parties');
      }
    });
  }, [dispatch, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      console.log('Validation failed: Email or password missing');
      alert('Please enter both username/email and password');
      return;
    }
    console.log('Submitting login with:', { email: email.trim(), password: '****' });
    dispatch(login({ email: email.trim(), password }))
      .then((result) => {
        console.log('Login result:', result);
        if (result.type === 'user/login/fulfilled') {
          console.log('Login successful, navigating to /parties');
          navigate('/parties');
        } else {
          console.log('Login failed:', result.payload);
          alert(result.payload || 'Login failed. Please try again.');
        }
      })
      .catch((err) => {
        console.error('Login error:', err);
        alert('An unexpected error occurred. Please try again.');
      });
  };

  const handleLogout = () => {
    console.log('Logging out');
    dispatch(logout());
    navigate('/');
  };

  // Forgot password handlers
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert('Please enter your email');
      return;
    }
    const result = await dispatch(forgotPassword(forgotEmail.trim()));
    if (forgotPassword.fulfilled.match(result)) {
      alert('OTP sent to your email');
      setStep(2);
    } else {
      alert(result.payload || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      alert('Please enter OTP');
      return;
    }
    const result = await dispatch(verifyOTP({ email: forgotEmail.trim(), otp: otp.trim() }));
    if (verifyOTP.fulfilled.match(result)) {
      alert('OTP verified successfully');
      setStep(3);
    } else {
      alert(result.payload || 'Invalid or expired OTP');
      // Stay on step 2 to retry
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    const result = await dispatch(resetPassword({ email: forgotEmail.trim(), otp: otp.trim(), newPassword: newPassword.trim() }));
    if (resetPassword.fulfilled.match(result)) {
      alert('Password reset successfully');
      setShowForgotForm(false);
      setStep(1);
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
      // Optionally redirect to login
    } else {
      alert(result.payload || 'Failed to reset password');
      // If invalid OTP in reset, go back to step 2
      if (result.payload === 'Invalid OTP' || result.payload === 'OTP expired') {
        setStep(2);
      }
    }
  };

  if (isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome, {currentUser?.username || 'Admin'}!</h1>
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
    <div className="flex h-screen bg-white w-full">
      <div className="hidden lg:flex items-center justify-center w-1/2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          data-name="Layer 1"
          width="500.13137"
          height="450.89848"
          viewBox="0 0 774.13137 669.89848"
        >
          {/* SVG content remains unchanged */}
        </svg>
      </div>
      <div className="w-full lg:w-1/2 px-4 lg:pr-10 flex flex-col justify-center">
        <div className="flex items-center justify-center mb-4">
          {/* Logo or image placeholder */}
        </div>
        <div className="flex items-center justify-center">
          {showForgotForm ? (
            <div className="w-full max-w-md shadow-xl py-10 px-5 bg-white rounded border">
              <h2 className="text-2xl font-semibold mb-4 text-center">Reset Password</h2>
              <button
                onClick={() => {
                  setShowForgotForm(false);
                  setStep(1);
                  setForgotEmail('');
                  setOtp('');
                  setNewPassword('');
                }}
                className="mb-4 text-blue-500 hover:underline"
              >
                Back to Login
              </button>
              {step === 1 && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              )}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
                      OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </form>
              )}
              {step === 3 && (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
                      New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}
              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full max-w-md shadow-xl py-10 px-5 bg-white rounded border">
              <h2 className="text-2xl font-semibold mb-4 text-center">Welcome</h2>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
                    Username or Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter username or email"
                      className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <p className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotForm(true)}
                  className="text-blue-500 hover:underline text-sm"
                >
                  Forgot Password?
                </button>
              </p>
              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;