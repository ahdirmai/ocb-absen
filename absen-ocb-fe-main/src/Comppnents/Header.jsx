import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;
const VITE_API_URL = import.meta.env.VITE_API_URL;

const normalizeUserProfile = (rawProfile) => {
  if (!rawProfile) {
    return null;
  }

  return Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
};

const Header = ({ toggleSidebar }) => {
  const [name, setName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userProfile = sessionStorage.getItem("userProfile");

    if (userProfile) {
      const userData = JSON.parse(userProfile);
      setName(normalizeUserProfile(userData));
    }
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.post(`${VITE_API_URL}/users/logout`, {}, { headers });

    Swal.fire({
      title: "Logout!",
      text: `${response.data.message}`,
      icon: "success",
      confirmButtonText: "OK",
    }).then(() => {
      localStorage.removeItem("token");
      sessionStorage.removeItem("userProfile");
      navigate("/login");
    });
  };

  return (
    <nav className="navbar default-layout-navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
      <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-start">
        <a className="navbar-brand brand-logo">
          <img src="/logo_new.png" alt="logo" />
        </a>
        <a className="navbar-brand brand-logo-mini">
          <img src="/logo_mini.svg" alt="logo" />
        </a>
      </div>
      <div className="navbar-menu-wrapper d-flex align-items-stretch">
        <button
          className="navbar-toggler navbar-toggler align-self-center"
          type="button"
          data-toggle="minimize"
        >
          <span className="mdi mdi-menu"></span>
        </button>
        <div className="search-field d-none d-md-block">
          <form className="d-flex align-items-center h-100" action="#">
            <div className="input-group">
              <div className="input-group-prepend bg-transparent"></div>
            </div>
          </form>
        </div>
        <ul className="navbar-nav navbar-nav-right">
          <li className="nav-item nav-profile dropdown">
            <a
              className="nav-link dropdown-toggle"
              id="profileDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="nav-profile-img">
                <img
                  src={name?.photo_url ? `${VITE_API_IMAGE}${name.photo_url}` : "/user-icon.jpg"}
                  alt="profile"
                />
                <span className="availability-status online"></span>
              </div>
              <div className="nav-profile-text">
                <p className="mb-1 text-black">{name?.name || "Nama User Dashboard"}</p>
              </div>
            </a>
            <div className="dropdown-menu navbar-dropdown" aria-labelledby="profileDropdown">
              <Link className="dropdown-item" to="/profile">
                <i className="mdi mdi-account-file-text me-2 text-success"></i>
                Profile
              </Link>

              <div className="dropdown-divider"></div>
              <a className="dropdown-item" onClick={handleLogout}>
                <i className="mdi mdi-logout me-2 text-primary"></i> LogOut
              </a>
            </div>
          </li>
        </ul>
        <button
          className="navbar-toggler navbar-toggler-right d-lg-none align-self-center"
          type="button"
          onClick={toggleSidebar}
          data-toggle="offcanvas"
        >
          <span className="mdi mdi-menu"></span>
        </button>
      </div>
    </nav>
  );
};

export default Header;
