// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { login, logout } from '../redux/authSlice';
// import { useNavigate } from 'react-router-dom';
// import 'tailwindcss/tailwind.css';
// import { Images } from "../assets/images";

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { token, loading, error } = useSelector((state) => state.user);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const isAuthenticated = !!token;

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!email || !password) {
//       alert('Please enter both username/email and password');
//       return;
//     }
//     dispatch(login({ email: email.trim(), password })).then((result) => {
//       if (result.type === 'user/login/fulfilled') {
//         navigate('/parties');
//       }
//     });
//   };

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate('/');
//   };

//   if (isAuthenticated) {
//     return (
//       <div className="container mx-auto p-4">
//         <h1 className="text-2xl font-bold mb-4">Welcome, Admin!</h1>
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
         
//         </div>
//         <div className="flex items-center justify-center">
//           <form onSubmit={handleSubmit} className="w-full max-w-md shadow-xl py-10 px-5 bg-white rounded border">
//             <h2 className="text-2xl font-semibold mb-4 text-center">Welcome</h2>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
//                   Username or Email
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="Enter username or email"
//                     className="mt-1 p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     placeholder="Enter password"
//                     className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//               </div>
//             </div>
//             {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
//             >
//               {loading ? 'Logging in...' : 'Login'}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import { Images } from "../assets/images";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useSelector((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isAuthenticated = !!token;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      console.log('Validation failed: Email or password missing');
      alert('Please enter both username/email and password');
      return;
    }
    console.log('Submitting login with:', { email: email.trim(), password: '****' });
    dispatch(login({ email: email.trim(), password })).then((result) => {
      console.log('Login result:', result);
      if (result.type === 'user/login/fulfilled') {
        console.log('Login successful, navigating to /parties');
        navigate('/parties');
      } else {
        console.log('Login failed:', result.payload);
        alert(result.payload || 'Login failed. Please try again.');
      }
    });
  };

  const handleLogout = () => {
    console.log('Logging out');
    dispatch(logout());
    navigate('/');
  };

  if (isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome, Admin!</h1>
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
          <form onSubmit={handleSubmit} className="w-full max-w-md shadow-xl py-10 px-5 bg-white rounded border">
            <h2 className="text-2xl font-semibold mb-4 text-center">Welcome</h2>
            <div className="space-y-4">
              <div>
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
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4c4b59]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#424687] text-white px-10 py-3 my-3 rounded-md focus:outline-none focus:shadow-outline-blue w-full flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;