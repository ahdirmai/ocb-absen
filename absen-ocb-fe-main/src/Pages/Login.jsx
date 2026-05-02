import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode} from "jwt-decode"; // Perbaikan impor

const VITE_API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    let isValid = true;
  let errorMessage = "";

  if (!username || username.trim() === "" || !password || password.trim() === "" ) {
    isValid = false;
    errorMessage += "Username Or Password  is required.\n";
  }
  if (!isValid) {
    alert(errorMessage);
    return; // Hentikan fungsi jika validasi gagal
  }


    try {
      const response = await axios.post(`${VITE_API_URL}/users/login-dashboard`, {
        username,
        password,
      });
      // console.log(response)
      if (response.data.status_code === "200") {

      const token = response.data.token; // JWT dari server

      // Simpan token di LocalStorage
      localStorage.setItem("token", token);
      
      // Decode JWT dan simpan data ke sessionStorage
      const decoded = jwtDecode(token); // Mendekode token JWT
      // console.log(token);
      const userID = decoded.id;
      // console.log(userID)
      const profileResponse = await axios.post(
        `${VITE_API_URL}/users/profile-web/${userID}`,
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // console.log(profileResponse.data.status_code)
      if (profileResponse.data.status_code === "200" && profileResponse.data.status === "success") {
        // 5. Simpan hasil profil ke sessionStorage
        // console.log("masuk sini")
        sessionStorage.setItem("userProfile", JSON.stringify(profileResponse.data.data));

        // console.log("Profile berhasil disimpan ke sessionStorage", profileResponse.data.data);
      } else {
        console.error("Gagal mengambil profil:", profileResponse.data.message);
      }
    }

    

     Swal.fire("Login Success!", `Welcome to Dahsboard OCB`, "success");
      navigate("/");
    } catch (error) {

      console.error("Login failed:", error.response?.data || error.message);
      // alert(error.response?.data?.message || "An error occurred");
      Swal.fire(
              "Error!",
              error.response?.data?.message || error.message,
              "error"
            );
    }
  };
  
  return (
    <div className="container-scroller">
      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="content-wrapper d-flex align-items-center auth">
          <div className="row flex-grow">
            <div className="col-lg-4 mx-auto">
              <div className="auth-form-light text-left p-5">
                <div className="brand-logo">
                  <img src="logo_new.png" alt="Logo" />
                </div>
                <h4>{`Hello! let's get started`}</h4>
                <h6 className="font-weight-light">Sign in to continue.</h6>
                <form className="pt-3" onSubmit={handleLogin}>
                  <div className="form-group position-relative">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <i
                      className="fa fa-user position-absolute"
                      style={{
                        top: "50%",
                        right: "10px",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "#fb5a9c",
                      }}
                    ></i>
                  </div>
                  <div className="form-group position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control form-control-lg"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="position-absolute"
                      style={{
                        top: "50%",
                        right: "40px",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        color: "#fb5a9c",
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                    <i
                      className="fa fa-lock position-absolute"
                      style={{
                        top: "50%",
                        right: "10px",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "#fb5a9c",
                      }}
                    ></i>
                  </div>
                  <div className="mt-3 d-grid gap-2">
                    <button
                      className="btn btn-block btn-gradient-danger btn-lg font-weight-medium auth-form-btn"
                      type="submit"
                    >
                      SIGN IN
                    </button>
                  </div>
                  <div className="my-2 d-flex justify-content-between align-items-center"></div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
