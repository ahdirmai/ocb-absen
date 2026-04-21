import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
const VITE_API_URL = import.meta.env.VITE_API_URL;
const AbsenKaryawan = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [absenTypes, setAbsenTypes] = useState([]);
  const [selectedAbsenType, setSelectedAbsenType] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (token && userId) {
      setIsLoggedIn(true);
      fetchProfile(token, userId);
    }
  }, []);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await axios.post(`${VITE_API_URL}/users/login-dashboard`, {
        username,
        password,
      });
      if (response.data.status === "success") {
        const token = response.data.token;
        const decoded = jwtDecode(token);
        const userId = decoded.id;
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        setIsLoggedIn(true);
        fetchProfile(token, userId);
        requestLocation();
      } else {
        Swal.fire("Gagal", response.data.message || "Login gagal", "error");
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Username atau password salah", "error");
    } finally {
      setLoginLoading(false);
    }
  };
  const fetchProfile = async (token, userId) => {
    try {
      const response = await axios.post(
        `${VITE_API_URL}/users/profile/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserProfile(response.data.data);
      fetchAbsenTypes(token, userId);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };
  const fetchAbsenTypes = async (token, userId) => {
    try {
      const response = await axios.post(
        `${VITE_API_URL}/absen-management/shift-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === "success" && response.data.data) {
        setAbsenTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching absen types:", error);
    }
  };
  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocationError("Mengambil lokasi...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Location error:", error);
          setLocationError("Gagal ambil lokasi. Tap untuk coba lagi.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError("Browser tidak support GPS");
    }
  };
  useEffect(() => {
    if (isLoggedIn) {
      requestLocation();
    }
  }, [isLoggedIn]);
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);
      Swal.fire("Error", "Tidak bisa akses kamera. Pastikan izin kamera sudah diaktifkan.", "error");
    }
  };
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        Swal.fire("Error", "Kamera belum siap. Tunggu sebentar lalu coba lagi.", "error");
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setPhotoPreview(dataUrl);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `absen_${Date.now()}.jpg`, { type: "image/jpeg" });
          setPhoto(file);
          stopCamera();
        } else {
          Swal.fire("Error", "Gagal mengambil foto. Coba lagi.", "error");
        }
      }, "image/jpeg", 0.8);
    }
  };
  const resetPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    startCamera();
  };
  const handleSubmit = async () => {
    if (!photo) {
      Swal.fire("Error", "WAJIB ambil foto selfie!", "error");
      return;
    }
    if (!location.latitude || !location.longitude) {
      Swal.fire("Error", "WAJIB aktifkan lokasi GPS!", "error");
      requestLocation();
      return;
    }
    if (!selectedAbsenType) {
      Swal.fire("Error", "WAJIB pilih tipe absen!", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("retail_id", userProfile?.retail_id || 1);
      formData.append("absen_type_id", selectedAbsenType);
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);
      formData.append("reason", "");
      formData.append("is_approval", 0);
      formData.append("photo_url", photo);
      const response = await axios.post(`${VITE_API_URL}/absensi/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.status === "success") {
        Swal.fire("Berhasil!", "Absen berhasil disimpan", "success");
        setPhoto(null);
        setPhotoPreview(null);
        setSelectedAbsenType("");
      } else {
        Swal.fire("Gagal", response.data.message || "Absen gagal", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire("Error", error.response?.data?.message || "Terjadi kesalahan saat submit", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserProfile(null);
    setPhoto(null);
    setPhotoPreview(null);
    setLocation({ latitude: null, longitude: null });
    stopCamera();
  };
  if (!isLoggedIn) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", margin: "50px auto", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#e74c3c", margin: 0 }}>OCB Absensi</h1>
          <p style={{ color: "#666" }}>Login untuk absen</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            style={{ width: "100%", padding: "12px", background: loginLoading ? "#bdc3c7" : "#e74c3c", color: "white", border: "none", borderRadius: "5px", fontSize: "16px", cursor: loginLoading ? "not-allowed" : "pointer" }}
          >
            {loginLoading ? "Loading..." : "LOGIN"}
          </button>
        </form>
      </div>
    );
  }
  const canSubmit = photo && location.latitude && selectedAbsenType && !loading;
  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#e74c3c", margin: 0 }}>Absen Karyawan</h2>
        <button onClick={handleLogout} style={{ padding: "8px 15px", background: "#95a5a6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          Logout
        </button>
      </div>
      {userProfile && (
        <div style={{ background: "#f0f0f0", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
          <p style={{ margin: "5px 0" }}><strong>Nama:</strong> {userProfile.name}</p>
          <p style={{ margin: "5px 0" }}><strong>Username:</strong> {userProfile.username}</p>
        </div>
      )}
      <div style={{ background: "#fff3cd", padding: "15px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #ffc107" }}>
        <p style={{ margin: "5px 0", fontWeight: "bold" }}>Checklist Absen:</p>
        <p style={{ margin: "5px 0", color: location.latitude ? "green" : "red" }}>
          {location.latitude ? "?" : "?"} Lokasi GPS {location.latitude ? `(${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})` : "(Belum aktif)"}
        </p>
        <p style={{ margin: "5px 0", color: photo ? "green" : "red" }}>
          {photo ? "?" : "?"} Foto Selfie {photo ? "(Sudah diambil)" : "(Belum diambil)"}
        </p>
        <p style={{ margin: "5px 0", color: selectedAbsenType ? "green" : "red" }}>
          {selectedAbsenType ? "?" : "?"} Tipe Absen {selectedAbsenType ? "(Sudah dipilih)" : "(Belum dipilih)"}
        </p>
      </div>
      {!location.latitude && (
        <button
          onClick={requestLocation}
          style={{ width: "100%", padding: "15px", background: "#f39c12", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", marginBottom: "15px" }}
        >
          ?? Aktifkan Lokasi GPS
        </button>
      )}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Tipe Absen:</label>
        <select
          value={selectedAbsenType}
          onChange={(e) => setSelectedAbsenType(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "16px" }}
        >
          <option value="">-- Pilih Tipe Absen --</option>
          {absenTypes.map((type) => (
            <option key={type.absen_id} value={type.absen_id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "20px" }}>
        {!cameraActive && !photoPreview && (
          <button
            onClick={startCamera}
            style={{ width: "100%", padding: "15px", background: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}
          >
            ?? Buka Kamera
          </button>
        )}
        {cameraActive && (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", borderRadius: "10px", marginBottom: "10px", background: "#000" }}
            />
            <button
              onClick={takePhoto}
              style={{ width: "100%", padding: "15px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}
            >
              ?? Ambil Foto
            </button>
          </div>
        )}
        {photoPreview && (
          <div>
            <img
              src={photoPreview}
              alt="Preview Foto"
              style={{ width: "100%", borderRadius: "10px", marginBottom: "10px", border: "3px solid #27ae60" }}
            />
            <button
              onClick={resetPhoto}
              style={{ width: "100%", padding: "12px", background: "#95a5a6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              ?? Ulangi Foto
            </button>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: "100%",
          padding: "18px",
          background: canSubmit ? "#e74c3c" : "#bdc3c7",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: canSubmit ? "pointer" : "not-allowed",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        {loading ? "Menyimpan..." : "? SUBMIT ABSEN"}
      </button>
      {!canSubmit && (
        <p style={{ textAlign: "center", color: "#e74c3c", marginTop: "10px", fontSize: "14px" }}>
          Lengkapi semua checklist di atas untuk submit absen
        </p>
      )}
    </div>
  );
};
export default AbsenKaryawan;