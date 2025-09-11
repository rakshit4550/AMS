import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import 'tailwindcss/tailwind.css';
import Login from './pages/Login';
import Party from './pages/Party';
import Sidebar from './components/Sidebar'; // Adjust path as needed

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/" />;
};

const Layout = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return (
    <div className="flex">
      {isAuthenticated && <Sidebar />}
      <main className={`flex-1  ${isAuthenticated ? 'ml-64' : ''}`}>
        {children}
      </main>
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
        <Route path="/" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;