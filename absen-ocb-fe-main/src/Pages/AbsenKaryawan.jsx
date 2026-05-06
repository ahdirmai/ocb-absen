import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const initialLocation = { latitude: null, longitude: null };
const buildAuthKey = (token, userId) => `${userId || ""}:${token || ""}`;

const AbsenKaryawan = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(initialLocation);
  const [locationError, setLocationError] = useState("");
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
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isRequestingLocationRef = useRef(false);
  const activeAuthKeyRef = useRef("");

  const hasLocation = location.latitude !== null && location.longitude !== null;

  const hitungJarak = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const selectedTypeDetail = useMemo(
    () =>
      absenTypes.find(
        (type) => String(type.absen_id) === String(selectedAbsenType)
      ) || null,
    [absenTypes, selectedAbsenType]
  );

  const locationStatus = useMemo(() => {
    if (!hasLocation || !selectedTypeDetail) return null;
    const { latitude: retLat, longitude: retLon, radius, retail_name } = selectedTypeDetail;
    if (!retLat || !retLon || !radius) return null;
    const jarak = hitungJarak(location.latitude, location.longitude, Number(retLat), Number(retLon));
    const dalamRadius = jarak <= Number(radius);
    return { dalamRadius, jarak: Math.round(jarak), radius: Number(radius), retail_name };
  }, [hasLocation, location, selectedTypeDetail]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const resetUserScopedState = () => {
    setUserProfile(null);
    setAbsenTypes([]);
    setSelectedAbsenType("");
    setPhoto(null);
    setPhotoPreview(null);
    setLocation(initialLocation);
    setLocationError("");
    stopCamera();
  };

  const resetSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("userProfile");
    activeAuthKeyRef.current = "";
    setIsLoggedIn(false);
    resetUserScopedState();
    setUsername("");
    setPassword("");
  };

  const applyAuthSession = (token, userId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    activeAuthKeyRef.current = buildAuthKey(token, userId);
  };

  const getAuthData = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      return null;
    }

    return { token, userId };
  };

  const requestLocation = (options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }) => {
    if (isRequestingLocationRef.current) {
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Browser tidak support GPS.");
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setLocationError("Lokasi hanya bisa diakses di HTTPS atau localhost.");
      return;
    }

    isRequestingLocationRef.current = true;
    setLocationError("Mengambil lokasi...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        isRequestingLocationRef.current = false;
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError("");
      },
      (error) => {
        isRequestingLocationRef.current = false;
        console.error("Location error:", error);
        setLocation(initialLocation);

        let message = "Gagal ambil lokasi. Tap untuk coba lagi.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Izin lokasi ditolak. Izinkan akses lokasi di browser lalu coba lagi.";
        } else if (error.code === error.TIMEOUT) {
          message =
            "Pengambilan lokasi timeout. Coba lagi di area dengan sinyal GPS lebih baik.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          if (options.enableHighAccuracy) {
            requestLocation({
              enableHighAccuracy: false,
              timeout: 20000,
              maximumAge: 60000,
            });
            return;
          }

          message =
            "Lokasi belum tersedia. Pastikan GPS perangkat aktif lalu coba lagi.";
        }

        setLocationError(message);
      },
      options
    );
  };

  const fetchAbsenTypes = async (token, userId) => {
    const authKey = buildAuthKey(token, userId);

    try {
      const response = await axios.post(
        `${VITE_API_URL}/absen-management/shift-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (activeAuthKeyRef.current !== authKey) {
        return;
      }

      if (response.data.status === "success") {
        const rawTypes = Array.isArray(response.data.data) ? response.data.data : [];

        // Ambil status apakah sudah absen hari ini dari root response
        const isAbsenToday = Number(response.data.is_absen_today) === 1;

        // Filter otomatis: Jika sudah absen masuk (isAbsenToday: 1), hanya tampilkan tipe "Keluar"
        // Jika belum absen masuk (isAbsenToday: 0), hanya tampilkan tipe "Masuk"
        const filteredTypes = rawTypes.filter(type => {
          const typeName = (type.name || "").toLowerCase();
          const typeDesc = (type.description || "").toLowerCase();
          const isMasuk = typeName.includes('masuk') || typeDesc.includes('masuk');
          const isKeluar = typeName.includes('keluar') || typeDesc.includes('keluar');

          return isAbsenToday ? isKeluar : isMasuk;
        });

        setAbsenTypes(filteredTypes);

        // Auto-select tipe absen pertama hasil filter
        if (filteredTypes.length > 0) {
          setSelectedAbsenType(String(filteredTypes[0].absen_id));
        } else {
          setSelectedAbsenType("");
        }
      }
    } catch (error) {
      console.error("Error fetching absen types:", error);

      if (error.response?.status === 401) {
        resetSession();
      }
    }
  };

  const fetchProfile = async (token, userId) => {
    const authKey = buildAuthKey(token, userId);

    try {
      const response = await axios.post(
        `${VITE_API_URL}/users/profile/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (activeAuthKeyRef.current !== authKey) {
        return;
      }

      // Backend mengirim data dalam array [data], ambil index ke-0
      const profileData = Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;

      setUserProfile(profileData || null);
      sessionStorage.setItem(
        "userProfile",
        JSON.stringify(profileData || null)
      );

      await fetchAbsenTypes(token, userId);
    } catch (error) {
      console.error("Error fetching profile:", error);

      if (error.response?.status === 401) {
        resetSession();
        return;
      }

      Swal.fire(
        "Error",
        error.response?.data?.message || "Gagal memuat data profil.",
        "error"
      );
    }
  };

  useEffect(() => {
    const authData = getAuthData();

    if (!authData) {
      return;
    }

    try {
      jwtDecode(authData.token);
      activeAuthKeyRef.current = buildAuthKey(authData.token, authData.userId);
      setIsLoggedIn(true);
      fetchProfile(authData.token, authData.userId);
    } catch (error) {
      console.error("Invalid token:", error);
      resetSession();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      requestLocation();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [photoPreview, stream]);

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      Swal.fire("Error", "Username dan password wajib diisi.", "error");
      return;
    }

    setLoginLoading(true);

    try {
      const response = await axios.post(`${VITE_API_URL}/users/login-dashboard`, {
        username: trimmedUsername,
        password: trimmedPassword,
      });

      if (response.data.status === "success") {
        const token = response.data.token;
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        resetUserScopedState();
        applyAuthSession(token, userId);
        setIsLoggedIn(true);
        await fetchProfile(token, userId);
      } else {
        Swal.fire("Gagal", response.data.message || "Login gagal", "error");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Username atau password salah.",
        "error"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);
      Swal.fire(
        "Error",
        "Tidak bisa akses kamera. Pastikan izin kamera sudah diaktifkan.",
        "error"
      );
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      Swal.fire(
        "Error",
        "Kamera belum siap. Tunggu sebentar lalu coba lagi.",
        "error"
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          Swal.fire("Error", "Gagal mengambil foto. Coba lagi.", "error");
          return;
        }

        const file = new File([blob], `absen_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(blob);

        if (photoPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(photoPreview);
        }

        setPhoto(file);
        setPhotoPreview(previewUrl);
        stopCamera();
      },
      "image/jpeg",
      0.8
    );
  };

  const resetPhoto = () => {
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhoto(null);
    setPhotoPreview(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!photo) {
      Swal.fire("Error", "Wajib ambil foto selfie.", "error");
      return;
    }

    if (!hasLocation) {
      Swal.fire("Error", "Wajib aktifkan lokasi GPS.", "error");
      requestLocation();
      return;
    }

    if (!selectedAbsenType || !selectedTypeDetail) {
      Swal.fire("Error", "Wajib pilih tipe absen yang valid.", "error");
      return;
    }

    const authData = getAuthData();

    if (!authData) {
      Swal.fire("Error", "Sesi login tidak ditemukan. Silakan login ulang.", "error");
      resetSession();
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", authData.userId);
      formData.append("retail_id", selectedTypeDetail.retail_id);
      formData.append("absen_type_id", selectedAbsenType);
      formData.append("latitude", String(location.latitude));
      formData.append("longitude", String(location.longitude));
      const isOutsideRadius = locationStatus ? !locationStatus.dalamRadius : false;
      formData.append("reason", isOutsideRadius ? "Absen di luar radius" : "");
      formData.append("is_approval", isOutsideRadius ? 1 : 0);
      formData.append("photo_url", photo);

      const response = await axios.post(`${VITE_API_URL}/absensi/`, formData, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        Swal.fire("Berhasil!", "Absen berhasil disimpan.", "success");

        if (photoPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(photoPreview);
        }

        setPhoto(null);
        setPhotoPreview(null);
        await fetchAbsenTypes(authData.token, authData.userId);
        requestLocation();
      } else {
        Swal.fire("Gagal", response.data.message || "Absen gagal.", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);

      if (error.response?.status === 401) {
        Swal.fire("Error", "Sesi habis. Silakan login ulang.", "error");
        resetSession();
        return;
      }

      Swal.fire(
        "Error",
        error.response?.data?.message || "Terjadi kesalahan saat submit.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    resetSession();
  };

  const canSubmit =
    Boolean(photo) &&
    hasLocation &&
    Boolean(selectedAbsenType) &&
    !loading &&
    !loginLoading;

  if (!isLoggedIn) {
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "400px",
          margin: "50px auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
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
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px", position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                paddingRight: "44px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#888",
                fontSize: "18px",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
              }}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                // Eye-slash icon (hide)
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                // Eye icon (show)
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              width: "100%",
              padding: "12px",
              background: loginLoading ? "#bdc3c7" : "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: loginLoading ? "not-allowed" : "pointer",
            }}
          >
            {loginLoading ? "Loading..." : "LOGIN"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: "#e74c3c", margin: 0 }}>Absen Karyawan</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 15px",
            background: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {userProfile && (
        <div
          style={{
            background: "#f0f0f0",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: "5px 0" }}>
            <strong>Nama:</strong> {userProfile.name || userProfile.nama || userProfile.full_name || "-"}
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Username:</strong> {userProfile.username || userProfile.user_name || "-"}
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Retail Shift:</strong> {selectedTypeDetail?.retail_name || userProfile.retail_name || "-"}
          </p>
        </div>
      )}

      <div
        style={{
          background: "#fff3cd",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
          border: "1px solid #ffc107",
        }}
      >
        <p style={{ margin: "5px 0", fontWeight: "bold" }}>Checklist Absen:</p>
        <p style={{ margin: "5px 0", color: hasLocation ? "green" : "red" }}>
          {hasLocation ? "Siap" : "Belum"} Lokasi GPS{" "}
          {hasLocation
            ? `(${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
            : "(Belum aktif)"}
        </p>
        {locationStatus && (
          <p style={{ margin: "5px 0", color: locationStatus.dalamRadius ? "green" : "#f39c12", fontWeight: "bold" }}>
            {locationStatus.dalamRadius
              ? `Dalam radius ${locationStatus.retail_name} (${locationStatus.jarak}m / maks ${locationStatus.radius}m)`
              : `Di luar radius ${locationStatus.retail_name} (${locationStatus.jarak}m / maks ${locationStatus.radius}m) — absen akan menunggu approval atasan`}
          </p>
        )}
        <p style={{ margin: "5px 0", color: photo ? "green" : "red" }}>
          {photo ? "Siap" : "Belum"} Foto Selfie{" "}
          {photo ? "(Sudah diambil)" : "(Belum diambil)"}
        </p>
        <p
          style={{
            margin: "5px 0",
            color: selectedAbsenType ? "green" : "red",
          }}
        >
          {selectedAbsenType ? "Siap" : "Belum"} Tipe Absen{" "}
          {selectedAbsenType ? "(Sudah dipilih)" : "(Belum dipilih)"}
        </p>
        {locationError && (
          <p style={{ margin: "8px 0 0", color: "#c0392b" }}>{locationError}</p>
        )}
      </div>

      {!hasLocation && (
        <button
          onClick={requestLocation}
          style={{
            width: "100%",
            padding: "15px",
            background: "#f39c12",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "15px",
          }}
        >
          Aktifkan Lokasi GPS
        </button>
      )}

      <div style={{ marginBottom: "15px" }}>
        <label
          style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
        >
          Tipe Absen:
        </label>
        <select
          value={selectedAbsenType}
          onChange={(e) => setSelectedAbsenType(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "5px",
            border: "1px solid #ddd",
            fontSize: "16px",
          }}
        >
          <option value="" disabled>-- Pilih Tipe Absen --</option>
          {absenTypes.map((type) => (
            <option key={type.absen_id} value={type.absen_id}>
              {type.name}
              {type.retail_name ? ` - ${type.retail_name}` : ""}
            </option>
          ))}
        </select>
        {absenTypes.length === 0 && (
          <p style={{ marginTop: "8px", color: "#c0392b", fontSize: "14px" }}>
            Tipe absen untuk shift ini sudah selesai atau belum ditemukan.
          </p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        {!cameraActive && !photoPreview && (
          <button
            onClick={startCamera}
            style={{
              width: "100%",
              padding: "15px",
              background: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Buka Kamera
          </button>
        )}

        {cameraActive && (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                borderRadius: "10px",
                marginBottom: "10px",
                background: "#000",
              }}
            />
            <button
              onClick={takePhoto}
              style={{
                width: "100%",
                padding: "15px",
                background: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Ambil Foto
            </button>
          </div>
        )}

        {photoPreview && (
          <div>
            <img
              src={photoPreview}
              alt="Preview Foto"
              style={{
                width: "100%",
                borderRadius: "10px",
                marginBottom: "10px",
                border: "3px solid #27ae60",
              }}
            />
            <button
              onClick={resetPhoto}
              style={{
                width: "100%",
                padding: "12px",
                background: "#95a5a6",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Ulangi Foto
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
        {loading ? "Menyimpan..." : "SUBMIT ABSEN"}
      </button>

      {!canSubmit && (
        <p
          style={{
            textAlign: "center",
            color: "#e74c3c",
            marginTop: "10px",
            fontSize: "14px",
          }}
        >
          Lengkapi semua checklist di atas untuk submit absen.
        </p>
      )}
    </div>
  );
};

export default AbsenKaryawan;