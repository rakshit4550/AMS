import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import 'tailwindcss/tailwind.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Party from './pages/Party';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Account from './pages/Account';
import User from './pages/User';
import Report from './pages/Report';
import { jwtDecode } from 'jwt-decode';
import Settlement from './pages/Settlement';

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.user);
  const isAuthenticated = !!token;

  // Check token expiration
  let isTokenValid = false;
  if (isAuthenticated) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Current time in seconds
      isTokenValid = decoded.exp > currentTime;
      if (!isTokenValid) {
        localStorage.removeItem('token'); // Clear expired token
        toast.error('Session expired. Please log in again.');
      }
    } catch (error) {
      localStorage.removeItem('token'); // Clear invalid token
      toast.error('Invalid token. Please log in again.');
      isTokenValid = false;
    }
  }

  return isAuthenticated && isTokenValid ? children : <Navigate to="/" />;
};

const Layout = ({ children }) => {
  const { token } = useSelector((state) => state.user);
  const isAuthenticated = !!token;
  const location = useLocation();
  const [hideHeader, setHideHeader] = useState(false);

  useEffect(() => {
    const shouldHideHeader = location.pathname?.includes('/pay/');
    setHideHeader(shouldHideHeader);
  }, [location]);

  return (
    <div className="min-h-screen">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop={false}
        closeButton={false}
        icon={false}
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="colored"
      />
      {!hideHeader && isAuthenticated && 
        <div className='fixed left-0 lg:left-[15rem]  top-0 right-0 z-50'>
          <Header />
        </div>
      }
      <div className="flex">
        {!hideHeader && isAuthenticated && (
          <div className="fixed w-[15rem] top-0 left-0 hidden lg:block overflow-hidden overflow-y-auto">
            <Sidebar />
          </div>
        )}
        <main
          className={
            hideHeader
              ? "w-full"
              : isAuthenticated
                ? "px-4 z-[9] w-full lg:w-[calc(100vw-15rem-8px)] mt-[72px] lg:ml-[15rem]"
                : "w-full"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/parties"
          element={
            <Layout>
              <ProtectedRoute>
                <Party />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/account"
          element={
            <Layout>
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/user"
          element={
            <Layout>
              <ProtectedRoute>
                <User />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/report"
          element={
            <Layout>
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            </Layout>
          }
        />
         <Route
          path="/settlement"
          element={
            <Layout>
              <ProtectedRoute>
                <Settlement />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;