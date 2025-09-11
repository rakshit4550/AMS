// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import 'tailwindcss/tailwind.css';
// import Login from './pages/Login';
// import Party from './pages/Party';
// import Sidebar from './components/Sidebar';
// import Account from './pages/Account';
// import User from './pages/User';

// const ProtectedRoute = ({ children }) => {
//   const { token } = useSelector((state) => state.user); // Change to state.user
//   const isAuthenticated = !!token; // Derive isAuthenticated
//   return isAuthenticated ? children : <Navigate to="/" />;
// };

// const Layout = ({ children }) => {
//   const { token } = useSelector((state) => state.user); // Change to state.user
//   const isAuthenticated = !!token;
//   return (
//     <div className="flex">
//       {isAuthenticated && <Sidebar />}
//       <main className={`flex-1 ${isAuthenticated ? 'ml-64' : ''}`}>
//         {children}
//       </main>
//     </div>
//   );
// };

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route
//           path="/"
//           element={
//             <Layout>
//               <Login />
//             </Layout>
//           }
//         />
//         <Route
//           path="/parties"
//           element={
//             <Layout>
//               <ProtectedRoute>
//                 <Party />
//               </ProtectedRoute>
//             </Layout>
//           }
//         />
//         <Route
//           path="/account"
//           element={
//             <Layout>
//               <ProtectedRoute>
//                 <Account />
//               </ProtectedRoute>
//             </Layout>
//           }
//         />
//         <Route
//           path="/user"
//           element={
//             <Layout>
//               <ProtectedRoute>
//                 <User />
//               </ProtectedRoute>
//             </Layout>
//           }
//         />
//         <Route path="*" element={<Navigate to="/" />} /> {/* Fix catch-all route */}
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import 'tailwindcss/tailwind.css';
import Login from './pages/Login';
import Party from './pages/Party';
import Sidebar from './components/Sidebar';
import Account from './pages/Account';
import User from './pages/User';

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.user);
  const isAuthenticated = !!token;
  console.log('ProtectedRoute: isAuthenticated=', isAuthenticated, 'token=', token);
  return isAuthenticated ? children : <Navigate to="/" />;
};

const Layout = ({ children }) => {
  const { token } = useSelector((state) => state.user);
  const isAuthenticated = !!token;
  console.log('Layout: isAuthenticated=', isAuthenticated, 'token=', token);
  return (
    <div className="flex">
      <Sidebar />
      <main className={`flex-1 ${isAuthenticated ? 'ml-64' : ''}`}>
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;