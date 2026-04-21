import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;
const VITE_API_URL = import.meta.env.VITE_API_URL;

const Sidebar = ({ isSidebarOpen }) => {
  const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
  const [name, setName] = useState({});
  const [navigationLinks, setNavigationLinks] = useState([]);

  useEffect(() => {
    const fetchUserData = () => {
      const userProfile = sessionStorage.getItem("userProfile");
      if (userProfile) {
        const userData = JSON.parse(userProfile);
        setName(userData[0]);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchMenuData = async () => {
      if (name?.id_category) {
        try {
          const response = await axios.get(`${VITE_API_URL}/menu/category/${name?.id_category}`,{headers});
          if (response.data && response.data.data) {
            const structuredMenu = buildMenuStructure(response.data.data);
            setNavigationLinks(structuredMenu);
          } else {
            console.error("Unexpected response structure:", response);
          }
        } catch (error) {
          console.error("Error fetching menus:", error);
        }
      }
    };

    fetchMenuData();
  }, [name?.id_category]);

  const buildMenuStructure = (menuItems) => {
    const menuMap = {};
    const rootMenu = [];

    menuItems.forEach((item) => {
      menuMap[item.id] = { ...item, submenu: [] };
    });

    menuItems.forEach((item) => {
      if (item.parent_id) {
        menuMap[item.parent_id]?.submenu.push(menuMap[item.id]);
      } else {
        rootMenu.push(menuMap[item.id]);
      }
    });

    return rootMenu;
  };

  return (
    <nav className={`sidebar sidebar-offcanvas ${isSidebarOpen ? "active" : ""}`} id="sidebar">
      <ul className="nav">
        <li className="nav-item nav-profile">
          <a className="nav-link">
            <div className="nav-profile-image">
              <img
                src={name?.photo_url ? `${VITE_API_IMAGE}${name?.photo_url}` : "/user-icon.jpg"}
                alt="profile"
              />
              <span className="login-status online"></span>
            </div>
            <div className="nav-profile-text d-flex flex-column">
              <span className="font-weight-bold mb-1 text-small">{name?.name || "Nama Dashboard"}</span>
              <span className="text-secondary text-small">{name?.category_user}</span>
            </div>
          </a>
        </li>
        {navigationLinks.map((link, index) => (
          <li className="nav-item" key={index}>
            {link.submenu && link.submenu.length > 0 ? (
              <>
                <a
                  className="nav-link"
                  data-bs-toggle="collapse"
                  href={`#${link.submenu_id}`}
                  aria-expanded="false"
                  aria-controls={link.submenu_id}
                >
                  <span className="menu-title">{link.name}</span>
                  <i className="menu-arrow"></i>
                  <i className={`mdi ${link.icon} menu-icon`}></i>
                </a>
                <div className="collapse" id={link.submenu_id}>
                  <ul className="nav flex-column sub-menu">
                    {link.submenu.map((sublink, subIndex) => (
                      <li className="nav-item" key={subIndex}>
                        <Link className="nav-link" to={sublink.path}>
                          {sublink.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <Link className="nav-link" to={link.path}>
                <span className="menu-title">{link.name}</span>
                <i className={`mdi ${link.icon} menu-icon`}></i>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
