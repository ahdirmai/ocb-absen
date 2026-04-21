

import { Navigate } from "react-router-dom";

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userSession = sessionStorage.getItem("userProfile");

  if (!token || !userSession) {
    // Hapus token dan session jika tidak valid
    localStorage.removeItem("token");
    sessionStorage.removeItem("userProfile");

    // Redirect ke halaman login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;