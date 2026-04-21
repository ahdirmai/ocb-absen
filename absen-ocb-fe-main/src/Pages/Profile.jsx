import axios from "axios";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;

const Profile = () => {
  const [Users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordOld, setPasswordOld] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const validatePassword = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*]/.test(password),
  });

  const passwordValidation = validatePassword(passwordNew);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      try {
        const profileResponse = await axios.post(
          `${VITE_API_URL}/users/profile-web/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const profile = profileResponse.data.data || [];
        //  console.log(profile)
        setUsers(profile[0]);

        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordOld || !passwordNew || !confirmPassword) {
      return Swal.fire("Error", "Semua field harus diisi!", "error");
    }

    if (passwordNew !== confirmPassword) {
      return Swal.fire(
        "Error",
        "Password baru dan konfirmasi tidak cocok!",
        "error"
      );
    }
    if (!Object.values(passwordValidation).every(Boolean)) {
      Swal.fire("Error!", "Password belum memenuhi kriteria!", "error");
      return;
    }

    const token = localStorage.getItem("token");
    const userProfile = sessionStorage.getItem("userProfile");
    const userData = JSON.parse(userProfile);
    const userId = userData[0]?.user_id;

    try {
      const response = await axios.post(
        `${VITE_API_URL}/users/change-password`,
        {
          user_id: userId,
          passwordOld,
          passwordNew,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire("Berhasil", response.data.message, "success");
      setPasswordOld("");
      setPasswordNew("");
      setConfirmPassword("");
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Terjadi kesalahan!",
        "error"
      );
    }
  };

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Profile User</h3>
      </div>

      <div className="row">
        {/* Profile Card */}
        <div className="col-md-8 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Personal Info</h4>
              {/* <p className="card-description">Personal Info</p> */}

              <div className="text-center mb-4">
                {/* Foto Profil */}
                <div className="mt-2">
                  <img
                    src={
                      Users?.photo_url
                        ? `${VITE_API_IMAGE}${Users.photo_url}`
                        : "/user-icon.jpg"
                    }
                    className="img-lg rounded-circle border"
                    alt="Profile"
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "10%",
                      cursor: "pointer",
                    }}
                  ></img>
                </div>
              </div>

              <form className="forms-sample">
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">
                    Nama Lengkap
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="name"
                      disabled
                      value={Users.name? Users.name: "-"}
                      // onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Job Title</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="catuser"
                      disabled
                      value={Users.category_user? Users.category_user : "-"}
                      // onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Username</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="firstName"
                      disabled
                      value={Users.username ? Users.username : "-"}
                      // onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Imei</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="imei"
                      disabled
                      value={Users.imei ? Users.imei : "-"}
                      // onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group row">
                  <label className="col-sm-2 col-form-label">Atasan</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="atasan"
                      value={Users.upline ? Users.upline : "-"}
                      disabled
                      // onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Update Password Card */}
        <div className="col-md-4 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Ubah Password</h4>
              <form onSubmit={handleChangePassword}>
                
                <div className="form-group position-relative">
              <label>Password Lama</label>
              <div className="input-group">
                <input
                  type={showPassword.old ? "text" : "password"}
                  value={passwordOld}
                  onChange={(e) => setPasswordOld(e.target.value)}
                  className="form-control"
                />
                <div
                  className="password-toggle"
                  onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}

                >
                  <i className={`fa ${showPassword.old ? "fa-eye" : "fa-eye-slash"}`} />
                </div>
              </div>
            </div>
            <div className="form-group position-relative">
                  <label>Password Baru</label>
                  <input
                   type={showPassword.new ? "text" : "password"}
                    name="passwordNew"
                    value={passwordNew}
                    onChange={(e) => setPasswordNew(e.target.value)}
                    className="form-control"
                    
                  />
                  {/* <div
                  className="password-toggle"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}

                >
                  <i className={`fa ${showPassword.new ? "fa-eye" : "fa-eye-slash"}`} />
                </div> */}
                 
                </div>
                <div className="password-rules">
              <p className={passwordValidation.length ? "valid" : "invalid"}>
                {passwordValidation.length ? "✅" : "❌"} Minimal 8 karakter
              </p>
              <p className={passwordValidation.uppercase ? "valid" : "invalid"}>
                {passwordValidation.uppercase ? "✅" : "❌"} Minimal satu huruf besar
              </p>
              <p className={passwordValidation.number ? "valid" : "invalid"}>
                {passwordValidation.number ? "✅" : "❌"} Minimal satu angka
              </p>
              <p className={passwordValidation.specialChar ? "valid" : "invalid"}>
                {passwordValidation.specialChar ? "✅" : "❌"} Minimal satu karakter unik (!@#$%^&*)
              </p>
            </div>
            <br />
            <div className="form-group position-relative">
                  <label>Konfirmasi Password Baru</label>
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-control"
                  />
                  {/* <div
                  className="password-toggle"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}

                >
                  <i className={`fa ${showPassword.confirm ? "fa-eye" : "fa-eye-slash"}`} />
                </div> */}
                </div>
                <button type="submit" className="btn btn-warning btn-block">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
