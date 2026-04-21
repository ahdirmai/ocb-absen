import { Navigate } from "react-router-dom";

const ALLOWED_DASHBOARD_ROLES = ["admin", "hrd", "owner"];

const getNormalizedRole = (userProfile) => {
  const normalizedProfile = Array.isArray(userProfile)
    ? userProfile[0]
    : userProfile;

  return String(normalizedProfile?.role || "").trim().toLowerCase();
};

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userSession = sessionStorage.getItem("userProfile");

  if (!token || !userSession) {
    localStorage.removeItem("token");
    sessionStorage.removeItem("userProfile");

    return <Navigate to="/login" replace />;
  }

  try {
    const parsedUserProfile = JSON.parse(userSession);
    const normalizedRole = getNormalizedRole(parsedUserProfile);

    if (!ALLOWED_DASHBOARD_ROLES.includes(normalizedRole)) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("userProfile");

      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error("Invalid userProfile session:", error);
    localStorage.removeItem("token");
    sessionStorage.removeItem("userProfile");

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
